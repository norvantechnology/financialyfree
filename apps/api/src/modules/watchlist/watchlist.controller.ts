import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WatchlistService } from './watchlist.service';
import {
  CreateWatchlistItemDto,
  UpdateWatchlistAlertDto,
} from './dto/watchlist-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Watchlist')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('watchlist')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  private getUserId(req: any): string {
    if (!req.user?.id) {
      throw new UnauthorizedException('Authentication required');
    }
    return req.user.id;
  }

  @Get()
  @ApiOperation({ summary: 'List all watchlist items for the authenticated user with live prices' })
  async getWatchlist(@Req() req: any) {
    return this.watchlistService.getWatchlist(this.getUserId(req));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a new stock symbol to personal watchlist' })
  async addItem(@Req() req: any, @Body() dto: CreateWatchlistItemDto) {
    return this.watchlistService.addItem(this.getUserId(req), dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update price alert thresholds for a watchlist item' })
  async updateItem(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateWatchlistAlertDto,
  ) {
    return this.watchlistService.updateItem(this.getUserId(req), id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a symbol from personal watchlist' })
  async removeItem(@Req() req: any, @Param('id') id: string) {
    return this.watchlistService.removeItem(this.getUserId(req), id);
  }

  @Get('check/:symbol')
  @ApiOperation({ summary: 'Check if a specific symbol is in the user watchlist' })
  async checkSymbol(@Req() req: any, @Param('symbol') symbol: string) {
    return this.watchlistService.checkSymbol(this.getUserId(req), symbol);
  }

  @Post('check-alerts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually trigger price alert evaluation against live quotes' })
  async triggerAlertsCheck() {
    return this.watchlistService.checkAlerts();
  }
}
