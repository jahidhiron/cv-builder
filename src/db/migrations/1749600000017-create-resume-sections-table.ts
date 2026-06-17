import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateResumeSectionsTable1749600000011 implements MigrationInterface {
  name = 'CreateResumeSectionsTable1749600000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "resume_sections" (
        "id"              BIGSERIAL   PRIMARY KEY,
        "resume_id"       BIGINT      NOT NULL,
        "section_type_id" BIGINT      NOT NULL,
        "order_index"     SMALLINT    NOT NULL DEFAULT 0,
        "is_visible"      BOOLEAN     NOT NULL DEFAULT TRUE,
        "content"         JSONB       NOT NULL DEFAULT '{}',
        "created_at"      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_resume_sections_resume_id"
          FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_resume_sections_section_type_id"
          FOREIGN KEY ("section_type_id") REFERENCES "section_types"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_resume_sections_resume_id"       ON "resume_sections"("resume_id")`);
    await queryRunner.query(`CREATE INDEX "idx_resume_sections_section_type_id" ON "resume_sections"("section_type_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "resume_sections"`);
  }
}

