import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { LessonType } from '@ff/types';

@Entity('courses')
export class CourseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ length: 100 })
  slug!: string;

  @Column({ length: 255 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ length: 255, nullable: true })
  thumbnailUrl?: string;

  @Column({ type: 'int', default: 0 })
  totalDuration!: number; // in minutes

  @Column({ type: 'int', default: 0 })
  lessonCount!: number;

  @Column({ length: 50, default: 'Intermediate' })
  level!: string;

  @Column({ length: 50, default: 'course_lifetime' })
  requiredSku!: string; // e.g. 'course_lifetime'

  @Column({ default: true })
  isPublished!: boolean;

  @Column({ type: 'int', default: 1 })
  order!: number;

  @OneToMany(() => CourseModuleEntity, (m) => m.course)
  modules!: CourseModuleEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

@Entity('course_modules')
export class CourseModuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  courseId!: string;

  @ManyToOne(() => CourseEntity, (c) => c.modules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course!: CourseEntity;

  @Column({ length: 200 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', default: 1 })
  order!: number;

  @OneToMany(() => LessonEntity, (l) => l.module)
  lessons!: LessonEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}

@Entity('lessons')
export class LessonEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  moduleId!: string;

  @ManyToOne(() => CourseModuleEntity, (m) => m.lessons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'moduleId' })
  module!: CourseModuleEntity;

  @Index()
  @Column({ type: 'uuid' })
  courseId!: string;

  @Column({ length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 20, default: 'video' })
  type!: LessonType;

  @Column({ type: 'int', default: 15 })
  duration!: number; // in minutes

  @Column({ type: 'int', default: 1 })
  order!: number;

  @Column({ default: false })
  isPreview!: boolean;

  @Column({ length: 100, nullable: true })
  videoId?: string; // Cloudflare Stream UID or Mock UID

  @Column({ length: 500, nullable: true })
  videoPlaybackUrl?: string;

  @Column({ type: 'text', nullable: true })
  textContent?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}

@Entity('quizzes')
export class QuizEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  courseId!: string;

  @Column({ length: 255 })
  title!: string;

  @Column({ type: 'int', default: 70 })
  passingScorePct!: number;

  @Column({ type: 'jsonb' })
  questions!: Array<{
    id: string;
    question: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string;
  }>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}

@Entity('user_lesson_progress')
export class UserLessonProgressEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Index()
  @Column({ type: 'uuid' })
  lessonId!: string;

  @Column({ default: false })
  isCompleted!: boolean;

  @Column({ type: 'int', default: 0 })
  watchedSeconds!: number;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}

@Entity('quiz_submissions')
export class QuizSubmissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Index()
  @Column({ type: 'uuid' })
  quizId!: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  scorePct!: number;

  @Column({ default: false })
  passed!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  answers?: Record<string, number>;

  @CreateDateColumn({ type: 'timestamptz' })
  submittedAt!: Date;
}

@Entity('certificates')
export class CertificateEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Index()
  @Column({ type: 'uuid' })
  courseId!: string;

  @ManyToOne(() => CourseEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course!: CourseEntity;

  @Index({ unique: true })
  @Column({ length: 50 })
  certificateNumber!: string;

  @Column({ length: 500, nullable: true })
  certificateUrl?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  issuedAt!: Date;
}
