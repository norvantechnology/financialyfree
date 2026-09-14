import { IsString, IsOptional, IsNumber, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWatchlistItemDto {
  @ApiProperty({ example: 'TATAMOTORS', description: 'NSE or BSE equity symbol' })
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  symbol!: string;

  @ApiPropertyOptional({ example: 'Tata Motors Limited', description: 'Company name' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  companyName?: string;

  @ApiPropertyOptional({ example: 750.0, description: 'Alert when price crosses above' })
  @IsOptional()
  @IsNumber()
  alertPriceAbove?: number;

  @ApiPropertyOptional({ example: 600.0, description: 'Alert when price crosses below' })
  @IsOptional()
  @IsNumber()
  alertPriceBelow?: number;

  @ApiPropertyOptional({ example: 'Accumulate near 20-DMA support', description: 'Personal research notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateWatchlistAlertDto {
  @ApiPropertyOptional({ example: 780.0, description: 'Alert when price crosses above' })
  @IsOptional()
  @IsNumber()
  alertPriceAbove?: number | null;

  @ApiPropertyOptional({ example: 620.0, description: 'Alert when price crosses below' })
  @IsOptional()
  @IsNumber()
  alertPriceBelow?: number | null;

  @ApiPropertyOptional({ example: 'Breakout above resistance target' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export interface WatchlistEnrichedItem {
  id: string;
  userId: string;
  symbol: string;
  companyName?: string | null;
  alertPriceAbove?: number | null;
  alertPriceBelow?: number | null;
  addedAt: string;
  lastTriggeredAt?: string | null;
  notes?: string | null;
  currentPrice?: number | null;
  change?: number | null;
  changePct?: number | null;
  previousClose?: number | null;
  dayHigh?: number | null;
  dayLow?: number | null;
  alertAboveTriggered?: boolean;
  alertBelowTriggered?: boolean;
  distanceToAlertAbovePct?: number | null;
  distanceToAlertBelowPct?: number | null;
  lastPriceUpdated?: string;
}
