import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../database/entities/user.entity';
import { SubscriptionEntity } from '../../database/entities/subscription.entity';
import { GoalEntity } from '../../database/entities/goal.entity';
import { KycEntity } from '../../database/entities/kyc.entity';
import { MfSchemeEntity, MfOrderEntity } from '../../database/entities/mf.entity';
import { DataSourceHealthEntity } from '../../database/entities/data-source-health.entity';
import { AdminService } from './admin.service';
import { DataIntegrityService } from './data-integrity.service';
import { AdminController } from './admin.controller';
import { MfExecutionModule } from '../mf-execution/mf-execution.module';
import { TechnoFundaModule } from '../techno-funda/techno-funda.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      SubscriptionEntity,
      GoalEntity,
      KycEntity,
      MfSchemeEntity,
      MfOrderEntity,
      DataSourceHealthEntity,
    ]),
    MfExecutionModule,
    TechnoFundaModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, DataIntegrityService],
  exports: [AdminService, DataIntegrityService],
})
export class AdminModule {}
