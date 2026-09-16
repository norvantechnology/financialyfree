import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { ConsentPreferencesDto, SimulateNotificationDto } from '@ff/types';
import { JwtAuthGuard, Public } from '../auth/guards/jwt-auth.guard';
import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator';

class ContactFormDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsIn(['general', 'support', 'billing', 'partnership', 'compliance'])
  topic!: string;

  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  message!: string;
}

@ApiTags('Notifications & DPDP Consent')
@Controller('notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifService: NotificationsService) {}

  private getUserId(req: any): string {
    if (req.user?.id) return req.user.id;
    if (req.user?.userId) return req.user.userId;
    const authHeader = req.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const payloadBase64 = token.split('.')[1];
        if (payloadBase64) {
          const decoded: any = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
          if (decoded?.sub) return decoded.sub;
        }
      } catch {}
    }
    throw new UnauthorizedException('Authentication required');
  }

  @Public()
  @Post('contact')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Public marketing contact form → EMAIL_PROVIDER channel' })
  async submitContact(@Body() dto: ContactFormDto) {
    if (!dto?.name || !dto?.email || !dto?.message) {
      throw new BadRequestException('name, email, and message are required');
    }
    return this.notifService.submitContactForm(dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get user notifications and unread count' })
  async getMyNotifications(@Req() req: any) {
    return this.notifService.getMyNotifications(this.getUserId(req));
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark specific notification as read' })
  async markAsRead(@Req() req: any, @Param('id') notificationId: string) {
    return this.notifService.markAsRead(this.getUserId(req), notificationId);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Req() req: any) {
    return this.notifService.markAllAsRead(this.getUserId(req));
  }

  @Get('consent')
  @ApiOperation({ summary: 'Get user DPDP Act 2023 notification consent settings' })
  async getConsent(@Req() req: any) {
    return this.notifService.getConsent(this.getUserId(req));
  }

  @Put('consent')
  @ApiOperation({ summary: 'Update user DPDP Act 2023 notification consent settings' })
  async updateConsent(
    @Req() req: any,
    @Body() dto: ConsentPreferencesDto,
  ) {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
    return this.notifService.updateConsent(this.getUserId(req), dto, ip);
  }

  @Post('simulate-alert')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Trigger simulated SIP, Course, or KYC alert' })
  async simulateAlert(
    @Req() req: any,
    @Body() dto: SimulateNotificationDto,
  ) {
    return this.notifService.simulateTrigger(this.getUserId(req), dto.triggerType);
  }
}
