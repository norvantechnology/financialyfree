import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { OptionsAnalyticsService } from './options-analytics.service';

@Processor('oi-tracker')
export class OiTrackerProcessor extends WorkerHost {
  private readonly logger = new Logger(OiTrackerProcessor.name);

  constructor(private readonly analyticsService: OptionsAnalyticsService) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.debug(`Processing oi-tracker job: ${job.name} (id: ${job.id})`);
    const underlying = job.data?.underlying || 'NIFTY';
    const count = await this.analyticsService.recordOiSnapshot(underlying);
    return { underlying, count };
  }
}
