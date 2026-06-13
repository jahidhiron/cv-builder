import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1749600000002 implements MigrationInterface {
  name = 'CreateUsersTable1749600000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"                BIGSERIAL     PRIMARY KEY,
        "role_id"           BIGINT        NOT NULL,
        "google_id"         VARCHAR(255)  UNIQUE,
        "email"             VARCHAR(255)  UNIQUE NOT NULL,
        "password"          TEXT,
        "name"              VARCHAR(255)  NOT NULL,
        "avatar_url"        TEXT,
        "email_verified"    BOOLEAN       NOT NULL DEFAULT FALSE,
        "email_verified_at" TIMESTAMPTZ,
        "failed_attempts"   INT           NOT NULL DEFAULT 0,
        "locked_until"      TIMESTAMPTZ,
        "is_active"         BOOLEAN       NOT NULL DEFAULT TRUE,
        "is_deleted"        BOOLEAN       NOT NULL DEFAULT FALSE,
        "deleted_at"        TIMESTAMPTZ,
        "created_at"        TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"        TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_users_role_id"
          FOREIGN KEY ("role_id") REFERENCES "roles"("id")
          ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_users_role_id"   ON "users"("role_id")`);
    await queryRunner.query(`CREATE INDEX "idx_users_email"     ON "users"("email")`);
    await queryRunner.query(`CREATE INDEX "idx_users_google_id" ON "users"("google_id") WHERE "google_id" IS NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
