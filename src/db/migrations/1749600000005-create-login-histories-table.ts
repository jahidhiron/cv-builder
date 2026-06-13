import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLoginHistoriesTable1749600000005 implements MigrationInterface {
  name = 'CreateLoginHistoriesTable1749600000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "login_histories" (
        "id"              BIGSERIAL     PRIMARY KEY,
        "user_id"         BIGINT        NOT NULL,
        "ip"              VARCHAR(64)   NOT NULL,
        "user_agent"      VARCHAR(512),
        "device_info"     JSONB,
        "client_location" JSONB,
        "family_id"       VARCHAR(255)  NOT NULL,
        "session_id"      VARCHAR(16)   NOT NULL,
        "logged_in_at"    TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "logged_out_at"   TIMESTAMPTZ,
        "expired_at"      TIMESTAMPTZ,
        "created_at"      TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_login_histories_user_id"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_login_histories_user_id"   ON "login_histories"("user_id", "logged_in_at")`);
    await queryRunner.query(`CREATE INDEX "idx_login_histories_family_id" ON "login_histories"("family_id")`);
    await queryRunner.query(`CREATE INDEX "idx_login_histories_expired_at" ON "login_histories"("expired_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "login_histories"`);
  }
}
