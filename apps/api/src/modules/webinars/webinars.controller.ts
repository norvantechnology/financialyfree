import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WebinarsService } from './webinars.service';
import { Public } from '../auth/guards/jwt-auth.guard';
import { WebinarAttendanceWebhookDto } from '@ff/types';

@ApiTags('Webinars & Live Masterclasses')
@Controller('webinars')
export class WebinarsController {
  constructor(private readonly webinarsService: WebinarsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all upcoming and past webinars' })
  async listWebinars(@Req() req: any) {
    const userId = req.user?.id;
    return this.webinarsService.listWebinars(userId);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get webinar details by slug' })
  async getWebinarBySlug(@Param('slug') slug: string, @Req() req: any) {
    const userId = req.user?.id;
    return this.webinarsService.getWebinarBySlug(slug, userId);
  }

  @Post(':id/register')
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register authenticated user for a webinar' })
  async register(@Req() req: any, @Param('id') webinarId: string) {
    const userId = req.user?.id || 'f47cfaa8-74c1-4257-81a1-fe803c31e0c0';
    const email = req.user?.email || 'investor@financiallyfree.in';
    return this.webinarsService.register(webinarId, {
      id: userId,
      email,
    });
  }

  @Public()
  @Post('webhook/attendance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Simulated StreamYard/Zoom post-session attendance webhook' })
  async attendanceWebhook(@Body() dto: WebinarAttendanceWebhookDto) {
    return this.webinarsService.recordAttendanceWebhook(dto);
  }
}
