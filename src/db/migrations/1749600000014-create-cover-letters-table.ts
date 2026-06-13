import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCoverLettersTable1749600000012 implements MigrationInterface {
  name = 'CreateCoverLettersTable1749600000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
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

    await queryRunner.query(`CREATE INDEX "idx_cover_letters_user_id"   ON "cover_letters"("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_cover_letters_resume_id" ON "cover_letters"("resume_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "cover_letters"`);
  }
}
