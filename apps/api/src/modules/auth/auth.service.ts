import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { UserEntity } from '../../database/entities/user.entity';
import { UserSessionEntity, RefreshTokenEntity } from '../../database/entities/session.entity';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { AuthTokensDto, LoginResponseDto, JwtPayload } from '@ff/types';

@Injectable()
export class AuthService {
  /**
   * Diagnostic in-memory buffer for pending password reset tokens.
   * Real email delivery is blocked pending AWS SES / Twilio credentials.
   * This buffer allows the admin account-integrity endpoint to surface tokens
   * so the flow can be tested end-to-end without live email.
   * Max 100 entries to prevent unbounded growth.
   */
  public readonly pendingPasswordResets: {
    email: string;
    tokenHash: string;
    expiresAt: Date;
    requestedAt: Date;
    emailDeliveryStatus: 'PENDING_CREDENTIALS';
  }[] = [];

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
    @InjectRepository(UserSessionEntity)
    private readonly sessionsRepo: Repository<UserSessionEntity>,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokensRepo: Repository<RefreshTokenEntity>,
  ) {}

  // ── Register ────────────────────────────────────────────────────────
  async register(dto: RegisterDto, ipAddress?: string): Promise<LoginResponseDto> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    const user = await this.usersService.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
    });

    const session = await this.createSession(user, ipAddress, true);
    const tokens = await this.issueTokens(user, session.id, { rememberMe: true });

    return {
      user: this.usersService.toDto(user),
      tokens,
    };
  }

  // ── Login ────────────────────────────────────────────────────────────
  async login(dto: LoginDto, ipAddress?: string): Promise<LoginResponseDto> {
    const user = await this.usersService.findByEmailWithPassword(dto.email.toLowerCase());
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.passwordHash) {
      throw new UnauthorizedException('Please sign in with Google');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated');
    }

    const isValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const rememberMe = dto.rememberMe !== false;
    const session = await this.createSession(user, ipAddress, rememberMe);
    const tokens = await this.issueTokens(user, session.id, { rememberMe });

    return {
      user: this.usersService.toDto(user),
      tokens,
    };
  }

  // ── Refresh ──────────────────────────────────────────────────────────
  async refresh(dto: RefreshTokenDto): Promise<AuthTokensDto> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(dto.refreshToken, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokenHash = this.hashToken(dto.refreshToken);
    const storedToken = await this.refreshTokensRepo.findOne({
      where: { tokenHash, isRevoked: false },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is expired or revoked');
    }

    // Rotate: revoke old, issue new
    storedToken.isRevoked = true;
    await this.refreshTokensRepo.save(storedToken);

    const user = await this.usersService.findById(payload.sub);
    if (!user) throw new UnauthorizedException('User not found');

    return this.issueTokens(user, payload.sessionId, {
      rememberMe: true,
      // Keep the same refresh lifetime as the revoked token when possible
      refreshExpiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '60d'),
    });
  }

  // ── Logout ───────────────────────────────────────────────────────────
  async logout(sessionId: string): Promise<void> {
    await this.refreshTokensRepo.update({ sessionId }, { isRevoked: true });
    await this.sessionsRepo.delete({ id: sessionId });
  }

  // ── Forgot Password ───────────────────────────────────────────────────
  async forgotPassword(email: string): Promise<void> {
    // Always return 200 to prevent email enumeration
    const user = await this.usersService.findByEmail(email.toLowerCase());
    if (!user) return;

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(resetToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min expiry

    // Buffer the pending reset for admin diagnostic inspection.
    // Real email delivery is blocked pending AWS SES / Twilio credentials.
    if (this.pendingPasswordResets.length >= 100) {
      this.pendingPasswordResets.shift(); // evict oldest
    }
    this.pendingPasswordResets.push({
      email: email.toLowerCase(),
      tokenHash,
      expiresAt,
      requestedAt: new Date(),
      emailDeliveryStatus: 'PENDING_CREDENTIALS',
    });

    // Surface token to server log for immediate dev testing
    console.log(
      `[AUTH-DIAGNOSTIC] Reset token for ${email}: ${resetToken} | expires: ${expiresAt.toISOString()}`,
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────────
  private async createSession(
    user: UserEntity,
    ipAddress?: string,
    rememberMe = true,
  ): Promise<UserSessionEntity> {
    const expiresAt = new Date();
    // Remember-me sessions track the refresh lifetime (60d); short sessions last 1 day
    expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 60 : 1));

    const session = this.sessionsRepo.create({
      userId: user.id,
      ipAddress,
      lastUsedAt: new Date(),
      expiresAt,
    });
    return this.sessionsRepo.save(session);
  }

  private async issueTokens(
    user: UserEntity,
    sessionId: string,
    opts?: { rememberMe?: boolean; refreshExpiresIn?: string },
  ): Promise<AuthTokensDto> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId,
    };

    const accessExpiresIn = this.config.get('JWT_EXPIRES_IN', '15m');
    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.getOrThrow('JWT_SECRET'),
      expiresIn: accessExpiresIn,
    });

    const rememberMe = opts?.rememberMe !== false;
    const refreshExpiresIn =
      opts?.refreshExpiresIn ||
      (rememberMe
        ? this.config.get<string>('JWT_REFRESH_EXPIRES_IN') || '60d'
        : this.config.get<string>('JWT_REFRESH_EXPIRES_IN_SHORT') || '1d');

    const refreshToken = this.jwtService.sign(
      { ...payload, jti: crypto.randomUUID() },
      {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn,
      },
    );

    // Store refresh token hash - DB expiry must match JWT lifetime
    const expiresAt = new Date(Date.now() + parseDurationMs(refreshExpiresIn));
    await this.refreshTokensRepo.save(
      this.refreshTokensRepo.create({
        sessionId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
      }),
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: Math.floor(parseDurationMs(accessExpiresIn) / 1000),
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

/** Parse jwt-style durations like 15m / 7d / 60d into milliseconds. */
function parseDurationMs(value: string): number {
  const raw = String(value || '').trim();
  const m = /^(\d+)\s*([smhd])$/i.exec(raw);
  if (!m) return 60 * 24 * 60 * 60 * 1000; // default 60d
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  const mult =
    unit === 's' ? 1000 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000;
  return n * mult;
}
