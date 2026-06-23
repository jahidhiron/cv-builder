import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the `server_errors` table for 500-level error tracking.
 *
 * Each unique error is identified by a SHA-256 `fingerprint` (error class +
 * message + top stack frame). Repeated occurrences increment `occurrence_count`
 * atomically via an ON CONFLICT upsert rather than inserting duplicate rows.
 *
 * `status` tracks the administrator review lifecycle:
 *   pending    — new, not yet reviewed (default)
 *   in_progress — being actively investigated
 *   resolved   — fixed and deployed
 *   wont_fix   — acknowledged but deliberately left unfixed
 *   ignored    — suppressed; occurrences are counted but no alerts are sent
 *   duplicate  — identified as a duplicate of another tracked error
 *
 * A first-occurrence email alert is dispatched only when a brand-new fingerprint
 * is inserted (occurrence_count = 1, status = pending). The ON CONFLICT UPDATE
 * intentionally excludes `status` so administrator decisions are preserved.
 */
export class CreateServerErrorsSchema1749600000003 implements MigrationInterface {
  name = 'CreateServerErrorsSchema1749600000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "server_errors" (
        "id"               BIGSERIAL     PRIMARY KEY,
        "fingerprint"      VARCHAR(64)   NOT NULL,
        "error_name"       VARCHAR(255)  NOT NULL,
        "message"          TEXT          NOT NULL,
        "method"           VARCHAR(10)   NOT NULL,
        "path"             TEXT          NOT NULL,
        "stack"            TEXT,
        "status"           VARCHAR(20)   NOT NULL DEFAULT 'pending',
        "occurrence_count" INT           NOT NULL DEFAULT 1,
        "first_seen_at"    TIMESTAMPTZ   NOT NULL,
        "last_seen_at"     TIMESTAMPTZ   NOT NULL,
        "email_sent_at"    TIMESTAMPTZ,
        CONSTRAINT "chk_server_errors_status"
          CHECK ("status" IN ('pending','in_progress','resolved','wont_fix','ignored','duplicate'))
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_server_errors_fingerprint" ON "server_errors"("fingerprint")`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_server_errors_status" ON "server_errors"("status")`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_server_errors_last_seen_at" ON "server_errors"("last_seen_at" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "server_errors"`);
  }
}
