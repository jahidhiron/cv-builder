import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCategoriesTable1749600000010 implements MigrationInterface {
  name = 'CreateCategoriesTable1749600000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id"          BIGSERIAL     PRIMARY KEY,
        "name"        VARCHAR(255)  NOT NULL,
        "slug"        VARCHAR(255)  UNIQUE NOT NULL,
        "sort_order"  SMALLINT      NOT NULL DEFAULT 0,
        "is_deleted"  BOOLEAN       NOT NULL DEFAULT FALSE,
        "deleted_at"  TIMESTAMPTZ,
        "created_by"  BIGINT,
        "updated_by"  BIGINT,
        "created_at"  TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"  TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_categories_created_by"
          FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_categories_updated_by"
          FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_categories_slug" ON "categories"("slug")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "categories"`);
  }
}

