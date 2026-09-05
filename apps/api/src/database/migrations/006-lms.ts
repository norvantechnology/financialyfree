import { MigrationInterface, QueryRunner } from 'typeorm';

export class Lms1725000006 implements MigrationInterface {
  name = 'Lms1725000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. courses
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "courses" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "slug" varchar(100) UNIQUE NOT NULL,
        "title" varchar(255) NOT NULL,
        "description" text NOT NULL,
        "thumbnailUrl" varchar(255),
        "totalDuration" integer NOT NULL DEFAULT 0,
        "lessonCount" integer NOT NULL DEFAULT 0,
        "level" varchar(50) NOT NULL DEFAULT 'Intermediate',
        "requiredSku" varchar(50) NOT NULL DEFAULT 'course_lifetime',
        "isPublished" boolean NOT NULL DEFAULT true,
        "order" integer NOT NULL DEFAULT 1,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);

    // 2. course_modules
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "course_modules" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "courseId" uuid NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
        "title" varchar(200) NOT NULL,
        "description" text,
        "order" integer NOT NULL DEFAULT 1,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_course_modules_course" ON "course_modules"("courseId")`);

    // 3. lessons
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "lessons" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "moduleId" uuid NOT NULL REFERENCES "course_modules"("id") ON DELETE CASCADE,
        "courseId" uuid NOT NULL,
        "title" varchar(255) NOT NULL,
        "type" varchar(20) NOT NULL DEFAULT 'video',
        "duration" integer NOT NULL DEFAULT 15,
        "order" integer NOT NULL DEFAULT 1,
        "isPreview" boolean NOT NULL DEFAULT false,
        "videoId" varchar(100),
        "videoPlaybackUrl" varchar(500),
        "textContent" text,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_lessons_module" ON "lessons"("moduleId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_lessons_course" ON "lessons"("courseId")`);

    // 4. quizzes
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "quizzes" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "courseId" uuid NOT NULL,
        "title" varchar(255) NOT NULL,
        "passingScorePct" integer NOT NULL DEFAULT 70,
        "questions" jsonb NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);

    // 5. user_lesson_progress
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_lesson_progress" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "lessonId" uuid NOT NULL,
        "isCompleted" boolean NOT NULL DEFAULT false,
        "watchedSeconds" integer NOT NULL DEFAULT 0,
        "completedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_progress_user" ON "user_lesson_progress"("userId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_progress_lesson" ON "user_lesson_progress"("lessonId")`);

    // 6. quiz_submissions
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "quiz_submissions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "quizId" uuid NOT NULL,
        "scorePct" decimal(5,2) NOT NULL,
        "passed" boolean NOT NULL DEFAULT false,
        "answers" jsonb,
        "submittedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);

    // 7. certificates
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "certificates" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "courseId" uuid NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
        "certificateNumber" varchar(50) UNIQUE NOT NULL,
        "certificateUrl" varchar(500),
        "issuedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_cert_user" ON "certificates"("userId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "certificates" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "quiz_submissions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_lesson_progress" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "quizzes" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lessons" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "course_modules" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "courses" CASCADE`);
  }
}
