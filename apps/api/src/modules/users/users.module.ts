import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserEntity } from '../../database/entities/user.entity';
import { EntitlementEntity } from '../../database/entities/subscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, EntitlementEntity])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
