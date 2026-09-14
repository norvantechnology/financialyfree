import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EntitlementEntity } from '../../database/entities/subscription.entity';
import type { Request } from 'express';

class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(50) firstName?: string;
  @IsOptional() @IsString() @MaxLength(50) lastName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() preferredLanguage?: 'en' | 'hi';
}

interface AuthRequest extends Request {
  user: { userId: string };
}

@ApiTags('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(EntitlementEntity)
    private readonly entitlementRepo: Repository<EntitlementEntity>,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile including active entitlement SKUs' })
  async getMe(@Req() req: AuthRequest) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) return null;
    const dto = this.usersService.toDto(user);

    // Fetch active entitlements  attach as flat SKU string array for frontend gating
    const now = new Date();
    const entitlements = await this.entitlementRepo.find({ where: { userId: req.user.userId } });
    const activeSkus = entitlements
      .filter((e) => e.isLifetime || !e.expiresAt || new Date(e.expiresAt) > now)
      .map((e) => e.sku);

    return { ...dto, entitlements: activeSkus };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMe(@Req() req: AuthRequest, @Body() dto: UpdateProfileDto) {
    const user = await this.usersService.updateProfile(req.user.userId, dto);
    return this.usersService.toDto(user);
  }
}

