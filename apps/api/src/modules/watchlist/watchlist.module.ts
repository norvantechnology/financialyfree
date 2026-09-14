import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { WatchlistItemEntity } from '../../database/entities/watchlist-item.entity';
import { WatchlistService } from './watchlist.service';
import { WatchlistController } from './watchlist.controller';
import { WatchlistProcessor } from './watchlist.processor';
import { TechnoFundaModule } from '../techno-funda/techno-funda.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WatchlistItemEntity]),
    BullModule.registerQueue({
      name: 'watchlist-alerts',
    }),
    TechnoFundaModule,
    NotificationsModule,
  ],
  controllers: [WatchlistController],
  providers: [WatchlistService, WatchlistProcessor],
  exports: [WatchlistService],
})
export class WatchlistModule {}
