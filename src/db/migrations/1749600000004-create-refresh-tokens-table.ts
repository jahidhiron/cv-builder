import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRefreshTokensTable1749600000004 implements MigrationInterface {
  name = 'CreateRefreshTokensTable1749600000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id"             BIGSERIAL     PRIMARY KEY,
        "token_hash"     VARCHAR(255)  NOT NULL UNIQUE,
        "user_id"        BIGINT        NOT NULL,
        "family_id"      VARCHAR(255)  NOT NULL,
        "expires_at"     TIMESTAMPTZ   NOT NULL,
        "revoked_at"     TIMESTAMPTZ,
        "revoked_reason" VARCHAR(100),
        "created_at"     TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_refresh_tokens_user_id"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_refresh_tokens_user_id"   ON "refresh_tokens"("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_refresh_tokens_family_id" ON "refresh_tokens"("family_id")`);
    await queryRunner.query(`CREATE INDEX "idx_refresh_tokens_expires_at" ON "refresh_tokens"("expires_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
  }
}
