import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MfExecutionService } from './mf-execution.service';
import { AuthRequest } from '../auth/strategies/jwt.strategy';
import { Public } from '../auth/guards/jwt-auth.guard';
import { CreateSipOrderRequest } from '@ff/types';

@ApiTags('Mutual Funds & BSE StAR MF Execution')
@Controller('mutual-funds')
export class MfExecutionController {
  constructor(private readonly mfService: MfExecutionService) {}

  @Public()
  @Get('schemes')
  @ApiOperation({ summary: 'List curated mutual fund schemes with NAVs and returns' })
  async getSchemes(@Query('category') category?: string) {
    return this.mfService.getSchemes(category);
  }

  @Get('portfolio')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user mutual fund portfolio & holdings' })
  async getPortfolio(@Req() req: AuthRequest) {
    return this.mfService.getUserPortfolio(req.user.id);
  }

  @Post('sip')
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Place a goal-linked SIP order via BSE StAR MF' })
  async createSipOrder(@Req() req: AuthRequest, @Body() dto: CreateSipOrderRequest) {
    return this.mfService.createSipOrder(req.user.id, dto);
  }

  @Get('orders')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get mutual fund order execution history' })
  async getOrders(@Req() req: AuthRequest) {
    return this.mfService.getUserOrders(req.user.id);
  }
}
