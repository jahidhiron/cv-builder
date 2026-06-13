import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiGenerationsTable1749600000014 implements MigrationInterface {
  name = 'CreateAiGenerationsTable1749600000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
    await queryRunner.query(`CREATE INDEX "idx_ai_gen_resume_id"  ON "ai_generations"("resume_id")`);
    await queryRunner.query(`CREATE INDEX "idx_ai_gen_type"       ON "ai_generations"("type")`);
    await queryRunner.query(`CREATE INDEX "idx_ai_gen_created_at" ON "ai_generations"("created_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "ai_generations"`);
  }
}
