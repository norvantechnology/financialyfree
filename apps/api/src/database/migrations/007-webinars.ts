import { MigrationInterface, QueryRunner } from 'typeorm';

export class Webinars1725000007 implements MigrationInterface {
  name = 'Webinars1725000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create webinar status enum if not exists
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "webinar_status_enum" AS ENUM('scheduled', 'live', 'completed', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Create webinars table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "webinars" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "title" varchar(255) NOT NULL,
        "slug" varchar(150) UNIQUE NOT NULL,
        "description" text NOT NULL,
        "topic" varchar(200),
        "scheduledAt" timestamptz NOT NULL,
        "durationMinutes" integer NOT NULL DEFAULT 60,
        "instructorName" varchar(150) NOT NULL DEFAULT 'Sandeep Kumar (CMT, CFA)',
        "instructorBio" text,
        "status" "webinar_status_enum" NOT NULL DEFAULT 'scheduled',
        "thumbnailUrl" varchar(500),
        "meetingUrl" varchar(500),
        "replayUrl" varchar(500),
        "tierRequired" varchar(20) NOT NULL DEFAULT 'FREE',
        "maxAttendees" integer NOT NULL DEFAULT 500,
        "linkedCompanies" jsonb NOT NULL DEFAULT '[]',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_webinars_scheduled_at" ON "webinars"("scheduledAt")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_webinars_status" ON "webinars"("status")`);

    // 3. Create webinar_registrations table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "webinar_registrations" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "webinarId" uuid NOT NULL REFERENCES "webinars"("id") ON DELETE CASCADE,
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "registeredAt" timestamptz NOT NULL DEFAULT now(),
        "joinUrl" varchar(500) NOT NULL,
        "attended" boolean NOT NULL DEFAULT false,
        "attendedMinutes" integer NOT NULL DEFAULT 0,
        CONSTRAINT "uq_webinar_user" UNIQUE ("webinarId", "userId")
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_webinar_registrations_user" ON "webinar_registrations"("userId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "webinar_registrations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "webinars"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "webinar_status_enum"`);
  }
}
