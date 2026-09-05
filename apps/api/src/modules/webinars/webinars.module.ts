import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  WebinarEntity,
  WebinarRegistrationEntity,
} from '../../database/entities/webinar.entity';
import { WebinarsService } from './webinars.service';
import { WebinarsController } from './webinars.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebinarEntity, WebinarRegistrationEntity]),
  ],
  controllers: [WebinarsController],
  providers: [WebinarsService],
  exports: [WebinarsService],
})
export class WebinarsModule {}
