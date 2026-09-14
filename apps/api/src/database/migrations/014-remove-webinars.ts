import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveWebinars1725000000014 implements MigrationInterface {
  name = 'RemoveWebinars1725000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop webinar registrations table if it exists
    await queryRunner.query(`DROP TABLE IF EXISTS "webinar_registrations" CASCADE;`);

    // 2. Drop webinars table if it exists
    await queryRunner.query(`DROP TABLE IF EXISTS "webinars" CASCADE;`);

    // 3. Drop webinar status enum if exists
    await queryRunner.query(`DROP TYPE IF EXISTS "webinar_status_enum" CASCADE;`);

    // 4. Clean up any 'webinars_1yr' entitlements
    await queryRunner.query(`DELETE FROM "entitlements" WHERE "sku" = 'webinars_1yr';`);

    // 5. Update plans table: remove webinar references and standardize tools-annual slug
    await queryRunner.query(`
      UPDATE "plans"
      SET
        "slug" = 'tools-annual',
        "name" = 'Techno-Funda Tools Annual',
        "description" = 'Annual renewal for active investors: 23 Techno-Funda Research Desks, Market Mood Pro, Master Tracker, PEAD, and Vahan data aggregator.',
        "skus" = ARRAY['tools_1yr'],
        "features" = ARRAY[
          'Market Mood Index & Trend Reversal Alerts',
          'Master Tracker + PEAD Results Screener',
          'Vahan Vehicle Registration Real-time Trends',
          '23 Institutional Research Desks & Scanners',
          'Valuation Lab, Bulk Deals & Arbitrage Monitor'
        ]
      WHERE "slug" = 'tools-webinars-annual' OR "slug" = 'tools-annual';
    `);

    await queryRunner.query(`
      UPDATE "plans"
      SET
        "description" = 'Flagship investor bundle: Lifetime course access + 1 Year Techno-Funda Tools (Market Mood, Master Tracker, PEAD, Vahan, Institutional Research Desks).',
        "skus" = ARRAY['course_lifetime', 'tools_1yr', 'bundle_diy'],
        "features" = ARRAY[
          'Everything in Techno-Funda DIY Masterclass (Lifetime)',
          'Market Mood Index & Pro Technical Overlays (1 Year)',
          'Master Tracker + PEAD + Vahan Auto Registrations (1 Year)',
          '23 Institutional Market Desks, F&O Analytics & Valuation Lab (1 Year)',
          'Priority WhatsApp & Email Support'
        ]
      WHERE "slug" = 'all-access-bundle';
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Reversible hook left empty as webinars are permanently deprecated
  }
}
