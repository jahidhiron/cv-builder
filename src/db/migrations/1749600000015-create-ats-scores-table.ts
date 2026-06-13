import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAtsScoresTable1749600000013 implements MigrationInterface {
  name = 'CreateAtsScoresTable1749600000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
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

    await queryRunner.query(`CREATE INDEX "idx_ats_scores_resume_id"  ON "ats_scores"("resume_id")`);
    await queryRunner.query(`CREATE INDEX "idx_ats_scores_created_at" ON "ats_scores"("created_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "ats_scores"`);
  }
}
