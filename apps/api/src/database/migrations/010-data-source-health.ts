import { MigrationInterface, QueryRunner } from 'typeorm';

export class DataSourceHealth1725000000010 implements MigrationInterface {
  name = 'DataSourceHealth1725000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "data_source_health" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "sourceKey" varchar(64) NOT NULL,
        "sourceName" varchar(128) NOT NULL,
        "mode" varchar(32) NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'SUCCESS',
        "upstreamRef" varchar(512) NOT NULL,
        "lastFetchedAt" timestamptz NOT NULL DEFAULT now(),
        "durationMs" integer NOT NULL DEFAULT 0,
        "rawResponseSnippet" text NOT NULL,
        "errorMessage" text,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_data_source_health_sourceKey" UNIQUE ("sourceKey")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_data_source_health_last_fetched"
      ON "data_source_health"("lastFetchedAt" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "data_source_health" CASCADE`);
  }
}
