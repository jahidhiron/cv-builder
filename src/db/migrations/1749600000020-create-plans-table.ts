import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlansTable1749600000020 implements MigrationInterface {
  name = 'CreatePlansTable1749600000020';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "plans"`);
  }
}
