import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateResumeExportsTable1749600000016 implements MigrationInterface {
  name = 'CreateResumeExportsTable1749600000016';

  public async up(queryRunner: QueryRunner): Promise<void> {
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

    await queryRunner.query(`CREATE INDEX "idx_resume_exports_user_id"   ON "resume_exports"("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_resume_exports_resume_id" ON "resume_exports"("resume_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "resume_exports"`);
  }
}

