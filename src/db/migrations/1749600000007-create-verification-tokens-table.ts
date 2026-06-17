import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVerificationTokensTable1749600000007 implements MigrationInterface {
  name = 'CreateVerificationTokensTable1749600000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "verification_tokens" (
        "id"         BIGSERIAL     PRIMARY KEY,
        "token"      VARCHAR(255)  NOT NULL,
        "type"       VARCHAR(50)   NOT NULL,
        "user_id"    BIGINT        NOT NULL,
        "ip"         VARCHAR(64),
        "expired_at" TIMESTAMPTZ   NOT NULL,
        "applied"    BOOLEAN       NOT NULL DEFAULT FALSE,
        "verified"   BOOLEAN       NOT NULL DEFAULT FALSE,
        "created_at" TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_verification_tokens_user_id"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_verification_tokens_user_id" ON "verification_tokens"("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_verification_tokens_token"   ON "verification_tokens"("token")`);
    await queryRunner.query(`CREATE INDEX "idx_verification_tokens_type"    ON "verification_tokens"("type")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "verification_tokens"`);
  }
}

