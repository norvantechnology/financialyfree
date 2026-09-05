import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';

@ApiTags('Admin Console & Data-Quality Monitoring')
@Controller('admin')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Platform KPI metrics: Total users, ARR, SIP volume, KYC funnel' })
  async getMetrics() {
    return this.adminService.getPlatformMetrics();
  }

  @Get('data-quality')
  @ApiOperation({ summary: 'Data-quality health check: Stale NAVs, gateway latency, webhook sync' })
  async getDataQuality() {
    return this.adminService.getDataQualityHealth();
  }

  @Get('kyc-queue')
  @ApiOperation({ summary: 'Pending KYC review queue for compliance officer' })
  async getKycQueue() {
    return this.adminService.getPendingKycQueue();
  }

  @Post('kyc-queue/:id/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Review and approve/reject pending KYC profile' })
  async reviewKyc(
    @Param('id') kycId: string,
    @Body() body: { action: 'APPROVE' | 'REJECT'; notes?: string },
  ) {
    return this.adminService.reviewKyc(kycId, body.action, body.notes);
  }
}
