import { MigrationInterface, QueryRunner } from 'typeorm';

export class Notifications1725000000008 implements MigrationInterface {
  name = 'Notifications1725000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Enums
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "notification_category_enum" AS ENUM(
          'sip_reminder', 'portfolio_update', 'course_progress',
          'kyc_status', 'payment_success', 'payment_failed', 'general'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "notification_channel_type_enum" AS ENUM('in_app', 'email', 'whatsapp', 'sms', 'push');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. notifications table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "type" "notification_category_enum" NOT NULL DEFAULT 'general',
        "channel" "notification_channel_type_enum" NOT NULL DEFAULT 'in_app',
        "title" varchar(255) NOT NULL,
        "message" text NOT NULL,
        "isRead" boolean NOT NULL DEFAULT false,
        "metadata" jsonb,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_notifications_user" ON "notifications"("userId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_notifications_is_read" ON "notifications"("isRead")`);

    // 3. user_notification_preferences table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_notification_preferences" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "whatsappTransactional" boolean NOT NULL DEFAULT true,
        "whatsappMarketing" boolean NOT NULL DEFAULT false,
        "emailAlerts" boolean NOT NULL DEFAULT true,
        "emailMarketing" boolean NOT NULL DEFAULT false,
        "ipAddress" varchar(60),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_user_notification_preferences_user" ON "user_notification_preferences"("userId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_notification_preferences"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_channel_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_category_enum"`);
  }
}
