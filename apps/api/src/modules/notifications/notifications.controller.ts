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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { AuthRequest } from '../auth/strategies/jwt.strategy';
import { ConsentPreferencesDto, SimulateNotificationDto } from '@ff/types';

@ApiTags('Notifications & DPDP Consent')
@Controller('notifications')
@ApiBearerAuth('access-token')
export class NotificationsController {
  constructor(private readonly notifService: NotificationsService) {}

  @Get('my')
  @ApiOperation({ summary: 'Get user notifications and unread count' })
  async getMyNotifications(@Req() req: AuthRequest) {
    return this.notifService.getMyNotifications(req.user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark specific notification as read' })
  async markAsRead(@Req() req: AuthRequest, @Param('id') notificationId: string) {
    return this.notifService.markAsRead(req.user.id, notificationId);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Req() req: AuthRequest) {
    return this.notifService.markAllAsRead(req.user.id);
  }

  @Get('consent')
  @ApiOperation({ summary: 'Get user DPDP Act 2023 notification consent settings' })
  async getConsent(@Req() req: AuthRequest) {
    return this.notifService.getConsent(req.user.id);
  }

  @Put('consent')
  @ApiOperation({ summary: 'Update user DPDP Act 2023 notification consent settings' })
  async updateConsent(
    @Req() req: AuthRequest,
    @Body() dto: ConsentPreferencesDto,
  ) {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
    return this.notifService.updateConsent(req.user.id, dto, ip);
  }

  @Post('simulate-alert')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Trigger simulated SIP, Webinar, or KYC alert' })
  async simulateAlert(
    @Req() req: AuthRequest,
    @Body() dto: SimulateNotificationDto,
  ) {
    return this.notifService.simulateTrigger(req.user.id, dto.triggerType);
  }
}
