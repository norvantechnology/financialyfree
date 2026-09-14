import { MigrationInterface, QueryRunner } from 'typeorm';

export class SystemSettings1725000000013 implements MigrationInterface {
  name = 'SystemSettings1725000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "system_settings" (
        "key" varchar(64) PRIMARY KEY,
        "value" text NOT NULL,
        "description" text,
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);

    // Seed default access mode: 'FREE' (unlocked for all)
    // Options: 'FREE' (all tabs free) | 'SUBSCRIPTION' (current paywalls & pricing active)
    await queryRunner.query(`
      INSERT INTO "system_settings" ("key", "value", "description", "updatedAt")
      VALUES (
        'SUBSCRIPTION_ACCESS_MODE',
        'FREE',
        'Global platform access switch: FREE (all tabs and tools unlocked for everyone) or SUBSCRIPTION (requires active plan/entitlements).',
        now()
      )
      ON CONFLICT ("key") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "system_settings" CASCADE`);
  }
}
