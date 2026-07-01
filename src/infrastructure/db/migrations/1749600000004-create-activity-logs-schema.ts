import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the request and activity log tables.
 *
 * request_logs           — one row per HTTP request; anchor for all per-request data.
 * user_activity_logs     — what the user did (signup, signin, etc.); linked to request_logs.
 * system_activity_logs   — which class/function was called; linked to request_logs.
 */
export class CreateActivityLogsSchema1749600000004 implements MigrationInterface {
  name = 'CreateActivityLogsSchema1749600000004';

  /**
   * Applies the migration: creates the request and activity log tables with indexes.
   *
   * @param queryRunner - TypeORM query runner used to execute SQL statements
   * @returns Promise that resolves when all statements have executed
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── request_logs ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "request_logs" (
        "id"           BIGSERIAL    PRIMARY KEY,
        "request_id"   VARCHAR(36)  NOT NULL,
        "method"       VARCHAR(10)  NOT NULL,
        "endpoint"     VARCHAR(256) NOT NULL,
        "ip"           VARCHAR(64),
        "user_agent"   VARCHAR(512),
        "user_id"      BIGINT,
        "body"         JSONB,
        "query_params" JSONB,
        "path_params"  JSONB,
        "status_code"  SMALLINT,
        "duration_ms"  INT,
        "created_at"   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_request_logs_request_id"  ON "request_logs"("request_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_request_logs_user_id"     ON "request_logs"("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_request_logs_endpoint"    ON "request_logs"("endpoint")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_request_logs_status_code" ON "request_logs"("status_code")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_request_logs_created_at"  ON "request_logs"("created_at" DESC)`,
    );

    // ── user_activity_logs ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "user_activity_logs" (
        "id"              BIGSERIAL     PRIMARY KEY,
        "user_id"         BIGINT,
        "action"          VARCHAR(128)  NOT NULL,
        "status"          VARCHAR(16)   NOT NULL DEFAULT 'success',
        "metadata"        JSONB,
        "request_log_id"  BIGINT,
        "created_at"      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        CONSTRAINT "chk_user_activity_logs_status"
          CHECK ("status" IN ('success','failed','pending')),
        CONSTRAINT "fk_user_activity_logs_request_log"
          FOREIGN KEY ("request_log_id") REFERENCES "request_logs"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_user_activity_logs_user_id"        ON "user_activity_logs"("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_user_activity_logs_action"         ON "user_activity_logs"("action")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_user_activity_logs_created_at"     ON "user_activity_logs"("created_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_user_activity_logs_request_log_id" ON "user_activity_logs"("request_log_id")`,
    );

    // ── system_activity_logs ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "system_activity_logs" (
        "id"             BIGSERIAL     PRIMARY KEY,
        "module"         VARCHAR(64)   NOT NULL,
        "class_name"     VARCHAR(128)  NOT NULL,
        "fn"             VARCHAR(128)  NOT NULL,
        "status"         VARCHAR(16)   NOT NULL DEFAULT 'success',
        "duration_ms"    INT,
        "executed_at"    TIMESTAMPTZ,
        "user_id"        BIGINT,
        "input"          JSONB,
        "output"         JSONB,
        "error"          TEXT,
        "request_log_id" BIGINT,
        "created_at"     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        CONSTRAINT "chk_system_activity_logs_status"
          CHECK ("status" IN ('success','failed','pending')),
        CONSTRAINT "fk_system_activity_logs_request_log"
          FOREIGN KEY ("request_log_id") REFERENCES "request_logs"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_system_activity_logs_module"         ON "system_activity_logs"("module")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_system_activity_logs_user_id"        ON "system_activity_logs"("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_system_activity_logs_executed_at"    ON "system_activity_logs"("executed_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_system_activity_logs_created_at"     ON "system_activity_logs"("created_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_system_activity_logs_request_log_id" ON "system_activity_logs"("request_log_id")`,
    );
  }

  /**
   * Reverts the migration: drops all activity log tables in dependency order.
   *
   * @param queryRunner - TypeORM query runner used to execute SQL statements
   * @returns Promise that resolves when all statements have executed
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "system_activity_logs"`);
    await queryRunner.query(`DROP TABLE "user_activity_logs"`);
    await queryRunner.query(`DROP TABLE "request_logs"`);
  }
}
