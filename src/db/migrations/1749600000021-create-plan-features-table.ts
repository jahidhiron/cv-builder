import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlanFeaturesTable1749600000021 implements MigrationInterface {
  name = 'CreatePlanFeaturesTable1749600000021';

  public async up(queryRunner: QueryRunner): Promise<void> {
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

    await queryRunner.query(`CREATE INDEX "idx_plan_features_plan_id" ON "plan_features"("plan_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "plan_features"`);
  }
}
