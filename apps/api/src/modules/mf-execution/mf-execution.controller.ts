import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MfExecutionService } from './mf-execution.service';
import { AmfiNavService } from './amfi-nav.service';
import { Public, JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSipOrderRequest } from '@ff/types';

@ApiTags('Mutual Funds & BSE StAR MF Execution')
@UseGuards(JwtAuthGuard)
@Controller('mutual-funds')
export class MfExecutionController {
  constructor(
    private readonly mfService: MfExecutionService,
    private readonly amfiNavService: AmfiNavService,
  ) {}

  @Public()
  @Get('schemes')
  @ApiOperation({ summary: 'List curated mutual fund schemes with NAVs and returns' })
  async getSchemes(@Query('category') category?: string) {
    return this.mfService.getSchemes(category);
  }

  @Public()
  @Post('sync-nav')
  @ApiOperation({ summary: 'Trigger ingestion of official public AMFI daily NAV file' })
  async syncNav() {
    return this.amfiNavService.syncDailyNavs();
  }

  @Public()
  @Get('nav-history/:schemeCode')
  @ApiOperation({ summary: 'Get daily NAV history snapshots for a scheme' })
  async getNavHistory(
    @Param('schemeCode') schemeCode: string,
    @Query('limit') limit?: string,
  ) {
    return this.amfiNavService.getNavHistory(
      schemeCode,
      limit ? parseInt(limit, 10) : 30,
    );
  }

  private getUserId(req: any): string {
    if (!req.user?.id) {
      throw new UnauthorizedException('Authentication required');
    }
    return req.user.id;
  }

  @Get('portfolio')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user mutual fund portfolio & holdings' })
  async getPortfolio(@Req() req: any) {
    return this.mfService.getUserPortfolio(this.getUserId(req));
  }

  @Post('sip')
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Place a goal-linked SIP order via BSE StAR MF' })
  async createSipOrder(@Req() req: any, @Body() dto: CreateSipOrderRequest) {
    return this.mfService.createSipOrder(this.getUserId(req), dto);
  }

  @Get('orders')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get mutual fund order execution history' })
  async getOrders(@Req() req: any) {
    return this.mfService.getUserOrders(this.getUserId(req));
  }
}

