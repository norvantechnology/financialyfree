import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { DataIntegrityService } from './data-integrity.service';
import { AccountIntegrityService } from './account-integrity.service';
import { Public } from '../auth/guards/jwt-auth.guard';

@ApiTags('Admin Console & Data-Quality Monitoring')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly dataIntegrityService: DataIntegrityService,
    private readonly accountIntegrityService: AccountIntegrityService,
  ) {}

  @Get('metrics')
  @Public()
  @ApiOperation({ summary: 'Platform KPI metrics: Total users, ARR, SIP volume, KYC funnel' })
  async getMetrics() {
    return this.adminService.getPlatformMetrics();
  }

  @Get('data-quality')
  @Public()
  @ApiOperation({ summary: 'Data-quality health check: Stale NAVs, gateway latency, webhook sync' })
  async getDataQuality() {
    return this.adminService.getDataQualityHealth();
  }

  @Get('kyc-queue')
  @Public()
  @ApiOperation({ summary: 'Pending KYC review queue for compliance officer' })
  async getKycQueue() {
    return this.adminService.getPendingKycQueue();
  }

  @Post('kyc-queue/:id/review')
  @Public()
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

  // ── Account & Session Integrity Diagnostics (Live Deep-Check Audits) ──

  @Get('account-integrity')
  @Public()
  @ApiOperation({ summary: 'Account & Session Integrity audits across 8 key boundaries' })
  async getAccountIntegrity() {
    const checks = await this.accountIntegrityService.runAllChecks();
    return {
      checks,
      serverTime: new Date().toISOString(),
      timestampMs: Date.now(),
    };
  }

  @Post('account-integrity/:checkKey/run')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run a specific live account & session integrity check' })
  async runSpecificAccountCheck(@Param('checkKey') checkKey: string) {
    let result;
    switch (checkKey) {
      case 'users_me':
        result = await this.accountIntegrityService.checkUsersMe();
        break;
      case 'argon2_hash':
        result = await this.accountIntegrityService.checkArgon2Hash();
        break;
      case 'token_boundary':
        result = await this.accountIntegrityService.checkTokenBoundary();
        break;
      case 'entitlement_boundary':
        result = await this.accountIntegrityService.checkEntitlementBoundary();
        break;
      case 'kyc_record':
        result = await this.accountIntegrityService.checkKycRecord();
        break;
      case 'goal_soft_delete':
        result = await this.accountIntegrityService.checkGoalSoftDelete();
        break;
      case 'lesson_progress':
        result = await this.accountIntegrityService.checkLessonProgress();
        break;
      case 'subscription_entitlements':
        result = await this.accountIntegrityService.checkSubscriptionEntitlements();
        break;
      default:
        throw new NotFoundException(`Unknown check key: ${checkKey}`);
    }

    return {
      success: true,
      result,
      serverTime: new Date().toISOString(),
      timestampMs: Date.now(),
    };
  }
}
