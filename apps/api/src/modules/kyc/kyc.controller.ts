import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { KycService } from './kyc.service';
import { InitiateKycDto } from '@ff/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('KYC / KRA Verification')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  private getUserId(req: any): string {
    if (!req.user?.id) {
      throw new UnauthorizedException('Authentication required');
    }
    return req.user.id;
  }

  @Get('status')
  @ApiOperation({ summary: 'Get current user KYC status & BSE UCC readiness' })
  async getStatus(@Req() req: any) {
    return this.kycService.getKycStatus(this.getUserId(req));
  }

  @Get('record')
  @ApiOperation({ summary: 'Get masked KYC record' })
  async getRecord(@Req() req: any) {
    return this.kycService.getKycRecord(this.getUserId(req));
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('initiate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate KRA verification using PAN and Date of Birth (rate limited: 10 req/min)' })
  async initiateKyc(@Req() req: any, @Body() dto: InitiateKycDto) {
    return this.kycService.initiateKyc(this.getUserId(req), dto);
  }
}
