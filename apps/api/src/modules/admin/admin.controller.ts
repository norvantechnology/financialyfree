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
import { DataIntegrityService } from './data-integrity.service';
import { JwtAuthGuard, Public } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';

@ApiTags('Admin Console & Data-Quality Monitoring')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly dataIntegrityService: DataIntegrityService,
  ) {}

  @Get('metrics')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Platform KPI metrics: Total users, ARR, SIP volume, KYC funnel' })
  async getMetrics() {
    return this.adminService.getPlatformMetrics();
  }

  @Get('data-quality')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Data-quality health check: Stale NAVs, gateway latency, webhook sync' })
  async getDataQuality() {
    return this.adminService.getDataQualityHealth();
  }

  @Get('kyc-queue')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Pending KYC review queue for compliance officer' })
  async getKycQueue() {
    return this.adminService.getPendingKycQueue();
  }

  @Post('kyc-queue/:id/review')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Review and approve/reject pending KYC profile' })
  async reviewKyc(
    @Param('id') kycId: string,
    @Body() body: { action: 'APPROVE' | 'REJECT'; notes?: string },
  ) {
    return this.adminService.reviewKyc(kycId, body.action, body.notes);
  }

  // ── Data Integrity Diagnostics (Auditable Real vs Mock Registry) ──

  @Get('data-integrity')
  @Public()
  @ApiOperation({ summary: 'Objective diagnostics registry: Real vs Mock status across all 11 dependencies' })
  async getDataIntegrity() {
    const sources = await this.dataIntegrityService.getAllSources();
    return {
      sources,
      serverTime: new Date().toISOString(),
      timestampMs: Date.now(),
    };
  }

  @Post('data-integrity/:sourceKey/refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Force refresh a specific data dependency upstream and log response' })
  async refreshDataSource(@Param('sourceKey') sourceKey: string) {
    const updatedSource = await this.dataIntegrityService.forceRefresh(sourceKey);
    return {
      success: true,
      updatedSource,
      serverTime: new Date().toISOString(),
      timestampMs: Date.now(),
    };
  }

  @Post('data-integrity/refresh-all')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Batch force-refresh all 11 external data dependencies and update health records' })
  async refreshAllDataSources() {
    const updatedSources = await this.dataIntegrityService.forceRefreshAll();
    return {
      success: true,
      updatedSources,
      serverTime: new Date().toISOString(),
      timestampMs: Date.now(),
    };
  }
}
