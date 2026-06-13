import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateResumeImportsTable1749600000015 implements MigrationInterface {
  name = 'CreateResumeImportsTable1749600000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "resume_imports" (
        "id"                BIGSERIAL     PRIMARY KEY,
        "user_id"           BIGINT        NOT NULL,
        "resume_id"         BIGINT,
        "source"            VARCHAR(100)  NOT NULL,
        "original_filename" VARCHAR(255),
        "parsed_content"    JSONB,
        "status"            VARCHAR(50)   NOT NULL DEFAULT 'pending',
        "created_at"        TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_resume_imports_user_id"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_resume_imports_resume_id"
          FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_resume_imports_user_id" ON "resume_imports"("user_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "resume_imports"`);
  }
}
