import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { WatchlistItemEntity } from '../../database/entities/watchlist-item.entity';
import { WatchlistService } from './watchlist.service';
import { WatchlistController } from './watchlist.controller';
import { WatchlistProcessor } from './watchlist.processor';
import { TechnoFundaModule } from '../techno-funda/techno-funda.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { isRedisConfigured } from '../../config/redis.config';

const useBull = isRedisConfigured();

@Module({
  imports: [
    TypeOrmModule.forFeature([WatchlistItemEntity]),
    ...(useBull
      ? [
          BullModule.registerQueue({
            name: 'watchlist-alerts',
          }),
        ]
      : []),
    TechnoFundaModule,
    NotificationsModule,
  ],
  controllers: [WatchlistController],
  providers: useBull
    ? [WatchlistService, WatchlistProcessor]
    : [WatchlistService],
  exports: [WatchlistService],
})
export class WatchlistModule {}
