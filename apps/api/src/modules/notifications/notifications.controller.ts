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
import { ConsentPreferencesDto, SimulateNotificationDto } from '@ff/types';

@ApiTags('Notifications & DPDP Consent')
@Controller('notifications')
@ApiBearerAuth('access-token')
export class NotificationsController {
  constructor(private readonly notifService: NotificationsService) {}

  private getUserId(req: any): string {
    return req.user?.id || 'f47cfaa8-74c1-4257-81a1-fe803c31e0c0';
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
  @ApiOperation({ summary: 'Trigger simulated SIP, Webinar, or KYC alert' })
  async simulateAlert(
    @Req() req: any,
    @Body() dto: SimulateNotificationDto,
  ) {
    return this.notifService.simulateTrigger(this.getUserId(req), dto.triggerType);
  }
}
