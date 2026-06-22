import { ModuleName } from '@/common/base/enums';
import { BaseCreateProvider } from '@/common/base/providers/base-create.provider';
import { clientAgent, clientIp } from '@/common/utils';
import { LoginHistory } from '@/modules/auth/entities/login-history.entity';
import { AuthHistoryPayload } from '@/modules/auth/interfaces';
import { LoginHistoryRepository } from '@/modules/auth/repositories';
import { ErrorResponse } from '@/shared/response';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { FindOptionsWhere, IsNull } from 'typeorm';
import type { DeepPartial } from 'typeorm';

/**
 * Records login and logout events in the `login_history` table.
 *
 * - `execute(payload)` — inserts a new row for sign-in events. Inherits from
 *   `BaseCreateProvider`; IP and user-agent are resolved in `buildPayload`.
 * - `logout(payload, updateAll?)` — bulk-updates open sessions with a
 *   `loggedOutAt` timestamp. Pass `updateAll = true` to close every open
 *   session for the user (used by the "logout from all devices" flow).
 */
@Injectable({ scope: Scope.REQUEST })
export class CreateAuthHistoryProvider extends BaseCreateProvider<LoginHistory, AuthHistoryPayload> {
  constructor(
    @Inject(REQUEST) private readonly request: Request,
    repo: LoginHistoryRepository,
    errorResponse: ErrorResponse,
  ) {
    super(ModuleName.Auth, repo, errorResponse);
  }

  protected override buildPayload(dto: AuthHistoryPayload): DeepPartial<LoginHistory> {
    return {
      userId: dto.userId,
      sessionId: dto.sessionId,
      familyId: dto.familyId ?? null,
      loggedInAt: dto.loggedInAt,
      expiredAt: dto.expiredAt ?? null,
      ip: clientIp(this.request),
      userAgent: clientAgent(this.request),
    } as DeepPartial<LoginHistory>;
  }

  /**
   * @param payload   - Logout data: must contain `loggedOutAt`.
   * @param updateAll - When `true`, closes every open session for the user.
   */
  async logout(payload: AuthHistoryPayload, updateAll = false): Promise<void> {
    const where: FindOptionsWhere<LoginHistory> = updateAll
      ? { userId: payload.userId, loggedOutAt: IsNull() }
      : { userId: payload.userId, sessionId: payload.sessionId, loggedOutAt: IsNull() };

    await this.repo.updateMany(where, { loggedOutAt: payload.loggedOutAt });
  }
}
