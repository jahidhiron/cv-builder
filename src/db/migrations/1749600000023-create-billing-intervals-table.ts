import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBillingIntervalsTable1749600000023 implements MigrationInterface {
  name = 'CreateBillingIntervalsTable1749600000023';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "billing_intervals" (
        "id"          BIGSERIAL     PRIMARY KEY,
        "name"        VARCHAR(255)  NOT NULL,
        "months"      SMALLINT      NOT NULL,
        "is_deleted"  BOOLEAN       NOT NULL DEFAULT FALSE,
        "deleted_at"  TIMESTAMPTZ,
        "created_by"  BIGINT,
        "updated_by"  BIGINT,
        "created_at"  TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"  TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_billing_intervals_created_by"
          FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_billing_intervals_updated_by"
          FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      INSERT INTO "billing_intervals" ("name", "months") VALUES
        ('Monthly', 1),
        ('Annual',  12)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "billing_intervals"`);
  }
}

