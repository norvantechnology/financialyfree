import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../database/entities/user.entity';
import { SubscriptionEntity } from '../../database/entities/subscription.entity';
import { GoalEntity } from '../../database/entities/goal.entity';
import { KycEntity } from '../../database/entities/kyc.entity';
import { MfSchemeEntity, MfOrderEntity } from '../../database/entities/mf.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      SubscriptionEntity,
      GoalEntity,
      KycEntity,
      MfSchemeEntity,
      MfOrderEntity,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
