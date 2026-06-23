import { ServerErrorStatus } from '@/modules/error-tracking/enums/server-error-status.enum';
import { ServerErrorRepository } from '@/modules/error-tracking/repositories/server-error.repository';
import { Injectable } from '@nestjs/common';
import type { UpsertErrorParams } from './interfaces/upsert-error.interface';

/**
 * Atomically inserts a new server-error fingerprint record or increments its
 * occurrence counter when the fingerprint already exists.
 *
 * Returns the post-upsert `occurrenceCount`. A value of `1` means the
 * fingerprint is brand-new (status will be `pending`). The `status` column is
 * set to `pending` only on INSERT and is intentionally excluded from the
 * ON CONFLICT UPDATE so that administrator-managed statuses are preserved
 * across repeated occurrences.
 */
@Injectable()
export class UpsertServerErrorProvider {
  constructor(private readonly repo: ServerErrorRepository) {}

  async execute(params: UpsertErrorParams): Promise<number> {
    const rows = await this.repo.rawQuery<{ occurrence_count: number }>(
      `INSERT INTO server_errors
         (fingerprint, error_name, message, method, path, stack, status,
          occurrence_count, first_seen_at, last_seen_at, email_sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, $8, 1, $7, $7, NULL)
       ON CONFLICT (fingerprint) DO UPDATE
         SET occurrence_count = server_errors.occurrence_count + 1,
             last_seen_at     = EXCLUDED.last_seen_at,
             stack            = EXCLUDED.stack
       RETURNING occurrence_count`,
      [
        params.fingerprint,
        params.errorName,
        params.message,
        params.method,
        params.path,
        params.stack,
        params.now,
        ServerErrorStatus.Pending,
      ],
    );

    return rows[0]?.occurrence_count ?? 1;
  }
}
