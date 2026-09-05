import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { KycService } from './kyc.service';
import { AuthRequest } from '../auth/strategies/jwt.strategy';
import { InitiateKycDto } from '@ff/types';

@ApiTags('KYC / KRA Verification')
@ApiBearerAuth('access-token')
@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get current user KYC status & BSE UCC readiness' })
  async getStatus(@Req() req: AuthRequest) {
    return this.kycService.getKycStatus(req.user.id);
  }

  @Get('record')
  @ApiOperation({ summary: 'Get masked KYC record' })
  async getRecord(@Req() req: AuthRequest) {
    return this.kycService.getKycRecord(req.user.id);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('initiate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate KRA verification using PAN and Date of Birth (rate limited: 10 req/min)' })
  async initiateKyc(@Req() req: AuthRequest, @Body() dto: InitiateKycDto) {
    return this.kycService.initiateKyc(req.user.id, dto);
  }
}
