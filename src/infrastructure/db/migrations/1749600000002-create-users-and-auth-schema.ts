import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the users table and all authentication-related tables.
 *
 * Tables created:
 *  - `users`               — core user accounts; FK to `roles`
 *  - `verification_tokens` — email-verification and password-reset one-time tokens
 *  - `refresh_tokens`      — refresh-token family tracking for token rotation
 *  - `login_histories`     — per-session device and location audit trail
 *  - `password_histories`  — previous password hashes for reuse prevention
 */
export class CreateUsersAndAuthSchema1749600000002 implements MigrationInterface {
  name = 'CreateUsersAndAuthSchema1749600000002';

  /**
   * Applies the migration: creates the users table and all authentication-related tables.
   *
   * @param queryRunner - TypeORM query runner used to execute SQL statements
   * @returns Promise that resolves when all statements have executed
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users
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
        "deleted_by"        BIGINT,
        "created_at"        TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"        TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_users_role_id"
          FOREIGN KEY ("role_id") REFERENCES "roles"("id")
          ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_users_role_id"   ON "users"("role_id")`);
    await queryRunner.query(`CREATE INDEX "idx_users_email"     ON "users"("email")`);
    await queryRunner.query(
      `CREATE INDEX "idx_users_google_id" ON "users"("google_id") WHERE "google_id" IS NOT NULL`,
    );

    // Verification tokens
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

    await queryRunner.query(
      `CREATE INDEX "idx_verification_tokens_user_id" ON "verification_tokens"("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_verification_tokens_token"   ON "verification_tokens"("token")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_verification_tokens_type"    ON "verification_tokens"("type")`,
    );

    // Refresh tokens
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id"                  BIGSERIAL     PRIMARY KEY,
        "token_hash"          VARCHAR(255)  NOT NULL UNIQUE,
        "user_id"             BIGINT        NOT NULL,
        "family_id"           VARCHAR(255)  NOT NULL,
        "expires_at"          TIMESTAMPTZ   NOT NULL,
        "revoked_at"          TIMESTAMPTZ,
        "revoked_reason"      VARCHAR(100),
        "session_started_at"  TIMESTAMPTZ,
        "created_at"          TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_refresh_tokens_user_id"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_refresh_tokens_user_id"    ON "refresh_tokens"("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_refresh_tokens_family_id"  ON "refresh_tokens"("family_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_refresh_tokens_expires_at" ON "refresh_tokens"("expires_at")`,
    );

    // Login histories
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

    await queryRunner.query(
      `CREATE INDEX "idx_login_histories_user_id"    ON "login_histories"("user_id", "logged_in_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_login_histories_family_id"  ON "login_histories"("family_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_login_histories_expired_at" ON "login_histories"("expired_at")`,
    );

    // Password histories
    await queryRunner.query(`
      CREATE TABLE "password_histories" (
        "id"            BIGSERIAL    PRIMARY KEY,
        "user_id"       BIGINT       NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "password_hash" VARCHAR(255) NOT NULL,
        "created_at"    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_password_histories_user_id_created_at"
        ON "password_histories"("user_id", "created_at" DESC)
    `);

  }

  /**
   * Reverts the migration: drops all auth-related tables and the users table in dependency order.
   *
   * @param queryRunner - TypeORM query runner used to execute SQL statements
   * @returns Promise that resolves when all statements have executed
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "password_histories"`);
    await queryRunner.query(`DROP TABLE "login_histories"`);
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE "verification_tokens"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
