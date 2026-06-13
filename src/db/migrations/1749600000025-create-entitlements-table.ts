import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEntitlementsTable1749600000025 implements MigrationInterface {
  name = 'CreateEntitlementsTable1749600000025';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
  }
}
