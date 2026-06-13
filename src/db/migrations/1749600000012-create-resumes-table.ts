import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateResumesTable1749600000010 implements MigrationInterface {
  name = 'CreateResumesTable1749600000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "resumes" (
        "id"          BIGSERIAL     PRIMARY KEY,
        "user_id"     BIGINT        NOT NULL,
        "template_id" BIGINT,
        "title"       VARCHAR(255)  NOT NULL,
        "status"      VARCHAR(50)   NOT NULL DEFAULT 'draft',
        "created_at"  TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"  TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_resumes_user_id"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_resumes_template_id"
          FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_resumes_user_id"     ON "resumes"("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_resumes_template_id" ON "resumes"("template_id")`);
    await queryRunner.query(`CREATE INDEX "idx_resumes_status"      ON "resumes"("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "resumes"`);
  }
}
