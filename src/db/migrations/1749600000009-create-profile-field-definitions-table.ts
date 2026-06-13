import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProfileFieldDefinitionsTable1749600000009 implements MigrationInterface {
  name = 'CreateProfileFieldDefinitionsTable1749600000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "profile_field_definitions" (
        "id"          BIGSERIAL     PRIMARY KEY,
        "category_id" BIGINT,
        "field_key"   VARCHAR(255)  NOT NULL,
        "field_label" VARCHAR(255)  NOT NULL,
        "field_type"  VARCHAR(50)   NOT NULL,
        "options"     JSONB,
        "is_required" BOOLEAN       NOT NULL DEFAULT FALSE,
        "order_index" SMALLINT      NOT NULL DEFAULT 0,
        "is_deleted"  BOOLEAN       NOT NULL DEFAULT FALSE,
        "deleted_at"  TIMESTAMPTZ,
        "created_by"  BIGINT,
        "updated_by"  BIGINT,
        "created_at"  TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"  TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_pfd_category_id"
          FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_pfd_created_by"
          FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_pfd_updated_by"
          FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "uq_pfd_category_field_key"
          UNIQUE ("category_id", "field_key")
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_pfd_category_id" ON "profile_field_definitions"("category_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "profile_field_definitions"`);
  }
}
