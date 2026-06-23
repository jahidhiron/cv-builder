import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the billing and subscription schema.
 *
 * Tables created:
 *  - `billing_intervals`    â€” recurring billing cycles (Monthly, Annual)
 *  - `plans`                â€” subscription plan tiers (Free, Pro, Enterprise)
 *  - `plan_features`        â€” feature flags and limits per plan
 *  - `plan_prices`          â€” price per plan per billing interval (in BDT)
 *  - `subscriptions`        â€” active/historical user subscriptions
 *  - `subscription_events`  â€” append-only audit log of subscription lifecycle events
 *  - `entitlements`         â€” resolved feature access snapshot per user (cache of current plan)
 *
 * Seed data:
 *  - Billing intervals: Monthly (1 month), Annual (12 months)
 *  - Plans:             Free, Pro, Enterprise
 */
export class CreateBillingSchema1749600000006 implements MigrationInterface {
  name = 'CreateBillingSchema1749600000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Billing intervals
    await queryRunner.query(`
      CREATE TABLE "billing_intervals" (
        "id"         BIGSERIAL     PRIMARY KEY,
        "name"       VARCHAR(255)  NOT NULL,
        "months"     SMALLINT      NOT NULL,
        "is_deleted" BOOLEAN       NOT NULL DEFAULT FALSE,
        "deleted_at" TIMESTAMPTZ,
        "created_by" BIGINT,
        "updated_by" BIGINT,
        "created_at" TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
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

    // Plans
    await queryRunner.query(`
      CREATE TABLE "plans" (
        "id"           BIGSERIAL     PRIMARY KEY,
        "slug"         VARCHAR(255)  UNIQUE NOT NULL,
        "display_name" VARCHAR(255)  NOT NULL,
        "sort_order"   SMALLINT      NOT NULL DEFAULT 0,
        "is_deleted"   BOOLEAN       NOT NULL DEFAULT FALSE,
        "deleted_at"   TIMESTAMPTZ,
        "created_by"   BIGINT,
        "updated_by"   BIGINT,
        "created_at"   TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"   TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_plans_created_by"
          FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_plans_updated_by"
          FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      INSERT INTO "plans" ("slug", "display_name", "sort_order") VALUES
        ('free',       'Free',       0),
        ('pro',        'Pro',        1),
        ('enterprise', 'Enterprise', 2)
    `);

    // Plan features
    await queryRunner.query(`
      CREATE TABLE "plan_features" (
        "id"            BIGSERIAL     PRIMARY KEY,
        "plan_id"       BIGINT        NOT NULL,
        "feature_key"   VARCHAR(255)  NOT NULL,
        "is_enabled"    BOOLEAN       NOT NULL DEFAULT FALSE,
        "feature_limit" INT,
        "created_by"    BIGINT,
        "updated_by"    BIGINT,
        "created_at"    TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"    TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_plan_features_plan_id"
          FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_plan_features_created_by"
          FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_plan_features_updated_by"
          FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "uq_plan_features_plan_feature_key"
          UNIQUE ("plan_id", "feature_key")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_plan_features_plan_id" ON "plan_features"("plan_id")`,
    );

    // Plan prices
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

    // Subscriptions
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

    await queryRunner.query(
      `CREATE INDEX "idx_subscriptions_user_id"            ON "subscriptions"("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_subscriptions_plan_id"            ON "subscriptions"("plan_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_subscriptions_status"             ON "subscriptions"("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_subscriptions_current_period_end" ON "subscriptions"("current_period_end")`,
    );

    // Subscription events
    await queryRunner.query(`
      CREATE TABLE "subscription_events" (
        "id"              BIGSERIAL     PRIMARY KEY,
        "subscription_id" BIGINT        NOT NULL,
        "user_id"         BIGINT        NOT NULL,
        "event_type"      VARCHAR(100)  NOT NULL,
        "metadata"        JSONB,
        "created_at"      TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_sub_events_subscription_id"
          FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_sub_events_user_id"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_sub_events_subscription_id" ON "subscription_events"("subscription_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_sub_events_user_id"         ON "subscription_events"("user_id")`,
    );

    // Entitlements
    await queryRunner.query(`
      CREATE TABLE "entitlements" (
        "id"              BIGSERIAL     PRIMARY KEY,
        "user_id"         BIGINT        NOT NULL UNIQUE,
        "plan_id"         BIGINT        NOT NULL,
        "features"        JSONB         NOT NULL DEFAULT '{}',
        "is_active"       BOOLEAN       NOT NULL DEFAULT TRUE,
        "valid_until"     TIMESTAMPTZ,
        "subscription_id" BIGINT,
        "source"          VARCHAR(50)   NOT NULL DEFAULT 'free',
        "created_at"      TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"      TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_entitlements_user_id"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_entitlements_plan_id"
          FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_entitlements_subscription_id"
          FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_entitlements_user_id" ON "entitlements"("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_entitlements_plan_id" ON "entitlements"("plan_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "entitlements"`);
    await queryRunner.query(`DROP TABLE "subscription_events"`);
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(`DROP TABLE "plan_prices"`);
    await queryRunner.query(`DROP TABLE "plan_features"`);
    await queryRunner.query(`DROP TABLE "plans"`);
    await queryRunner.query(`DROP TABLE "billing_intervals"`);
  }
}
