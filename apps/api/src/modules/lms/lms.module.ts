import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CourseEntity,
  CourseModuleEntity,
  LessonEntity,
  QuizEntity,
  UserLessonProgressEntity,
  QuizSubmissionEntity,
  CertificateEntity,
} from '../../database/entities/lms.entity';
import { EntitlementEntity } from '../../database/entities/subscription.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { LmsService } from './lms.service';
import { LmsController } from './lms.controller';
import { SystemConfigModule } from '../system-config/system-config.module';

@Module({
  imports: [
    SystemConfigModule,
    TypeOrmModule.forFeature([
      CourseEntity,
      CourseModuleEntity,
      LessonEntity,
      QuizEntity,
      UserLessonProgressEntity,
      QuizSubmissionEntity,
      CertificateEntity,
      EntitlementEntity,
      UserEntity,
    ]),
  ],
  controllers: [LmsController],
  providers: [LmsService],
  exports: [LmsService],
})
export class LmsModule {}
