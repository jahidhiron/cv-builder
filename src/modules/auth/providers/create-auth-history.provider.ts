import { ModuleName } from '@/common/base/enums';
import { BaseCreateProvider } from '@/common/base/providers/base-create.provider';
import { clientAgent, clientIp } from '@/common/utils';
import { LoginHistory } from '@/modules/auth/entities/login-history.entity';
import type { AuthHistoryPayload } from '@/modules/auth/interfaces';
import { LoginHistoryRepository } from '@/modules/auth/repositories';
import { ErrorResponse } from '@/shared/response';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import type { DeepPartial } from 'typeorm';
import { FindOptionsWhere, IsNull } from 'typeorm';

/**
 * Records login and logout events in the `login_history` table.
 *
 * - `execute(payload)` — inserts a new row for sign-in events. Inherits from
 *   `BaseCreateProvider`; IP and user-agent are resolved in `buildPayload`.
 * - `logout(payload)` — stamps `loggedOutAt` on open sessions. Omit
 *   `payload.sessionId` to close every open session for the user (logout-all flow).
 * - `logoutByFamily(userId, familyId)` — closes all open sessions for a specific
 *   device family; called on sign-in when a new session replaces an existing one.
 */
@Injectable({ scope: Scope.REQUEST })
export class CreateAuthHistoryProvider extends BaseCreateProvider<
  LoginHistory,
  AuthHistoryPayload
> {
  constructor(
    @Inject(REQUEST) private readonly request: Request,
    repo: LoginHistoryRepository,
    errorResponse: ErrorResponse,
  ) {
    super(ModuleName.Auth, repo, errorResponse);
  }

  /**
   * Transforms the sign-in DTO into a persistable {@link LoginHistory} payload.
   *
   * IP address and User-Agent are resolved from the current request at build
   * time so callers do not need to pass them explicitly.
   *
   * @param dto     - Sign-in event data supplied by the caller.
   * @returns       The entity payload ready for insertion by the base provider.
   */
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
   * Stamps `loggedOutAt` on open login-history rows for the given user.
   *
   * When `payload.sessionId` is provided, only that session is closed.
   * When omitted, every open session for the user is closed (logout-all flow).
   *
   * @param payload             - Logout context; `loggedOutAt` must be set.
   * @param payload.userId      - ID of the user logging out.
   * @param payload.sessionId   - Session to close; omit to close all open sessions.
   * @param payload.loggedOutAt - Timestamp written to every affected row.
   * @returns                   Resolves when the UPDATE completes.
   */
  async logout(payload: AuthHistoryPayload): Promise<void> {
    const where: FindOptionsWhere<LoginHistory> = payload.sessionId
      ? { userId: payload.userId, sessionId: payload.sessionId, loggedOutAt: IsNull() }
      : { userId: payload.userId, loggedOutAt: IsNull() };

    await this.repo.updateMany(where, { loggedOutAt: payload.loggedOutAt });
  }

  /**
   * Stamps `loggedOutAt` on all open login-history rows for a given device family.
   * Called on sign-in when a new session replaces the existing one for the same device.
   *
   * @param userId   - Owner of the sessions to close.
   * @param familyId - Device fingerprint shared by all sessions for this device.
   * @returns        Resolves when the UPDATE completes.
   */
  async logoutByFamily(userId: number, familyId: string): Promise<void> {
    await this.repo.updateMany(
      { userId, familyId, loggedOutAt: IsNull() },
      { loggedOutAt: new Date() },
    );
  }
}
