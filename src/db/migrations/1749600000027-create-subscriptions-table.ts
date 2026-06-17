import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubscriptionsTable1749600000027 implements MigrationInterface {
  name = 'CreateSubscriptionsTable1749600000027';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id"                   BIGSERIAL     PRIMARY KEY,
        "user_id"              BIGINT        NOT NULL,
        "plan_id"              BIGINT        NOT NULL,
        "billing_interval_id"  BIGINT        NOT NULL,
        "status"               VARCHAR(50)   NOT NULL DEFAULT 'active',
        "current_period_start" TIMESTAMPTZ,
        "current_period_end"   TIMESTAMPTZ,
        "cancel_at_period_end" BOOLEAN       NOT NULL DEFAULT FALSE,
        "canceled_at"          TIMESTAMPTZ,
        "ended_at"             TIMESTAMPTZ,
        "sslcommerz_tran_id"   VARCHAR(255),
        "created_at"           TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"           TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_subscriptions_user_id"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_subscriptions_plan_id"
          FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_subscriptions_billing_interval_id"
          FOREIGN KEY ("billing_interval_id") REFERENCES "billing_intervals"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_subscriptions_user_id"            ON "subscriptions"("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_subscriptions_plan_id"            ON "subscriptions"("plan_id")`);
    await queryRunner.query(`CREATE INDEX "idx_subscriptions_status"             ON "subscriptions"("status")`);
    await queryRunner.query(`CREATE INDEX "idx_subscriptions_current_period_end" ON "subscriptions"("current_period_end")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "subscriptions"`);
  }
}

