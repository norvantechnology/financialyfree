import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { WatchlistService } from './watchlist.service';

@Processor('watchlist-alerts')
export class WatchlistProcessor extends WorkerHost {
  private readonly logger = new Logger(WatchlistProcessor.name);

  constructor(private readonly watchlistService: WatchlistService) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.debug(`Processing watchlist-alerts job: ${job.name} (id: ${job.id})`);
    const result = await this.watchlistService.checkAlerts();
    return result;
  }
}
