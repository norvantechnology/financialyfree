import { MigrationInterface, QueryRunner } from 'typeorm';

export class Webinars1725000000007 implements MigrationInterface {
  name = 'Webinars1725000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Deprecated: Webinars have been permanently removed from the platform.
    await queryRunner.query(`DROP TABLE IF EXISTS "webinar_registrations" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "webinars" CASCADE;`);
    await queryRunner.query(`DROP TYPE IF EXISTS "webinar_status_enum" CASCADE;`);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Deprecated
  }
}
