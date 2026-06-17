import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSectionTypesTable1749600000012 implements MigrationInterface {
  name = 'CreateSectionTypesTable1749600000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "section_types" (
        "id"           BIGSERIAL     PRIMARY KEY,
        "name"         VARCHAR(255)  NOT NULL,
        "slug"         VARCHAR(255)  UNIQUE NOT NULL,
        "icon"         VARCHAR(255),
        "field_schema" JSONB,
        "is_system"    BOOLEAN       NOT NULL DEFAULT FALSE,
        "sort_order"   SMALLINT      NOT NULL DEFAULT 0,
        "is_deleted"   BOOLEAN       NOT NULL DEFAULT FALSE,
        "deleted_at"   TIMESTAMPTZ,
        "created_by"   BIGINT,
        "updated_by"   BIGINT,
        "created_at"   TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"   TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_section_types_created_by"
          FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_section_types_updated_by"
          FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      INSERT INTO "section_types" ("name", "slug", "is_system", "sort_order") VALUES
        ('Summary',        'summary',        TRUE, 1),
        ('Experience',     'experience',     TRUE, 2),
        ('Education',      'education',      TRUE, 3),
        ('Skills',         'skills',         TRUE, 4),
        ('Projects',       'projects',       TRUE, 5),
        ('Certifications', 'certifications', TRUE, 6),
        ('Custom',         'custom',         FALSE, 7)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "section_types"`);
  }
}

