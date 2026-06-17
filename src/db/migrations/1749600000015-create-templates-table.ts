import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTemplatesTable1749600000009 implements MigrationInterface {
  name = 'CreateTemplatesTable1749600000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "templates" (
        "id"            BIGSERIAL     PRIMARY KEY,
        "name"          VARCHAR(255)  NOT NULL,
        "slug"          VARCHAR(255)  UNIQUE NOT NULL,
        "style_id"      BIGINT,
        "layout"        VARCHAR(50)   NOT NULL DEFAULT 'single_column',
        "target_level"  VARCHAR(50)   NOT NULL DEFAULT 'mid',
        "category_id"   BIGINT,
        "preview_url"   TEXT,
        "thumbnail_url" TEXT,
        "sort_order"    SMALLINT      NOT NULL DEFAULT 0,
        "is_deleted"    BOOLEAN       NOT NULL DEFAULT FALSE,
        "deleted_at"    TIMESTAMPTZ,
        "created_by"    BIGINT,
        "updated_by"    BIGINT,
        "created_at"    TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"    TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_templates_style_id"
          FOREIGN KEY ("style_id") REFERENCES "resume_styles"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_templates_category_id"
          FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_templates_created_by"
          FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_templates_updated_by"
          FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_templates_style_id"    ON "templates"("style_id")`);
    await queryRunner.query(`CREATE INDEX "idx_templates_category_id" ON "templates"("category_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "templates"`);
  }
}

