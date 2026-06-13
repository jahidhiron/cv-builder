import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateResumeStylesTable1749600000007 implements MigrationInterface {
  name = 'CreateResumeStylesTable1749600000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "resume_styles" (
        "id"            BIGSERIAL     PRIMARY KEY,
        "name"          VARCHAR(255)  NOT NULL,
        "slug"          VARCHAR(255)  UNIQUE NOT NULL,
        "thumbnail_url" TEXT,
        "sort_order"    SMALLINT      NOT NULL DEFAULT 0,
        "is_deleted"    BOOLEAN       NOT NULL DEFAULT FALSE,
        "deleted_at"    TIMESTAMPTZ,
        "created_by"    BIGINT,
        "updated_by"    BIGINT,
        "created_at"    TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"    TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_resume_styles_created_by"
          FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_resume_styles_updated_by"
          FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "resume_styles"`);
  }
}
