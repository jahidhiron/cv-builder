import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates document-generation and tracking tables.
 *
 * Tables created:
 *  - `cover_letters`   â€” cover letter documents optionally linked to a resume
 *  - `ats_scores`      â€” ATS (Applicant Tracking System) score snapshots for a resume
 *  - `ai_generations`  â€” log of AI-assisted content generation requests and responses
 *  - `resume_imports`  â€” records of resume files imported from external sources
 *  - `resume_exports`  â€” records of resume files exported (PDF, DOCX, etc.)
 */
export class CreateDocumentsSchema1749600000005 implements MigrationInterface {
  name = 'CreateDocumentsSchema1749600000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Cover letters
    await queryRunner.query(`
      CREATE TABLE "cover_letters" (
        "id"         BIGSERIAL     PRIMARY KEY,
        "user_id"    BIGINT        NOT NULL,
        "resume_id"  BIGINT,
        "title"      VARCHAR(255)  NOT NULL,
        "content"    TEXT,
        "status"     VARCHAR(50)   NOT NULL DEFAULT 'draft',
        "created_at" TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_cover_letters_user_id"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_cover_letters_resume_id"
          FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_cover_letters_user_id"   ON "cover_letters"("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_cover_letters_resume_id" ON "cover_letters"("resume_id")`,
    );

    // ATS scores
    await queryRunner.query(`
      CREATE TABLE "ats_scores" (
        "id"         BIGSERIAL   PRIMARY KEY,
        "resume_id"  BIGINT      NOT NULL,
        "score"      SMALLINT    NOT NULL,
        "breakdown"  JSONB       NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_ats_scores_resume_id"
          FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE,
        CONSTRAINT "chk_ats_scores_score"
          CHECK ("score" BETWEEN 0 AND 100)
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_ats_scores_resume_id"  ON "ats_scores"("resume_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_ats_scores_created_at" ON "ats_scores"("created_at")`,
    );

    // AI generations
    await queryRunner.query(`
      CREATE TABLE "ai_generations" (
        "id"              BIGSERIAL     PRIMARY KEY,
        "user_id"         BIGINT        NOT NULL,
        "resume_id"       BIGINT,
        "section_id"      BIGINT,
        "cover_letter_id" BIGINT,
        "type"            VARCHAR(100)  NOT NULL,
        "prompt"          TEXT,
        "response"        JSONB,
        "model"           VARCHAR(255),
        "input_tokens"    INT,
        "output_tokens"   INT,
        "created_at"      TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_ai_gen_user_id"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_ai_gen_resume_id"
          FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_ai_gen_section_id"
          FOREIGN KEY ("section_id") REFERENCES "resume_sections"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_ai_gen_cover_letter_id"
          FOREIGN KEY ("cover_letter_id") REFERENCES "cover_letters"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_ai_gen_user_id"    ON "ai_generations"("user_id")`);
    await queryRunner.query(
      `CREATE INDEX "idx_ai_gen_resume_id"  ON "ai_generations"("resume_id")`,
    );
    await queryRunner.query(`CREATE INDEX "idx_ai_gen_type"       ON "ai_generations"("type")`);
    await queryRunner.query(
      `CREATE INDEX "idx_ai_gen_created_at" ON "ai_generations"("created_at")`,
    );

    // Resume imports
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

    await queryRunner.query(
      `CREATE INDEX "idx_resume_imports_user_id" ON "resume_imports"("user_id")`,
    );

    // Resume exports
    await queryRunner.query(`
      CREATE TABLE "resume_exports" (
        "id"         BIGSERIAL     PRIMARY KEY,
        "user_id"    BIGINT        NOT NULL,
        "resume_id"  BIGINT        NOT NULL,
        "format"     VARCHAR(50)   NOT NULL,
        "file_url"   TEXT,
        "expires_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_resume_exports_user_id"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_resume_exports_resume_id"
          FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_resume_exports_user_id"   ON "resume_exports"("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_resume_exports_resume_id" ON "resume_exports"("resume_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "resume_exports"`);
    await queryRunner.query(`DROP TABLE "resume_imports"`);
    await queryRunner.query(`DROP TABLE "ai_generations"`);
    await queryRunner.query(`DROP TABLE "ats_scores"`);
    await queryRunner.query(`DROP TABLE "cover_letters"`);
  }
}
