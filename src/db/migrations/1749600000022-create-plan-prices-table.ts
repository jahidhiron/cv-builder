import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlanPricesTable1749600000022 implements MigrationInterface {
  name = 'CreatePlanPricesTable1749600000022';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "plan_prices" (
        "id"                  BIGSERIAL   PRIMARY KEY,
        "plan_id"             BIGINT      NOT NULL,
        "billing_interval_id" BIGINT      NOT NULL,
        "price_bdt"           INT         NOT NULL,
        "created_by"          BIGINT,
        "updated_by"          BIGINT,
        "created_at"          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_plan_prices_plan_id"
          FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_plan_prices_billing_interval_id"
          FOREIGN KEY ("billing_interval_id") REFERENCES "billing_intervals"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_plan_prices_created_by"
          FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_plan_prices_updated_by"
          FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "uq_plan_prices_plan_interval"
          UNIQUE ("plan_id", "billing_interval_id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_plan_prices_plan_id" ON "plan_prices"("plan_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "plan_prices"`);
  }
}
