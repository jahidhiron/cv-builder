import { LoginHistory } from '@/modules/auth/entities/login-history.entity';
import { AuthHistoryPayload } from '@/modules/auth/interfaces';
import { LoginHistoryRepository } from '@/modules/auth/repositories';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { FindOptionsWhere } from 'typeorm';

@Injectable({ scope: Scope.REQUEST })
export class CreateAuthHistoryProvider {
  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly loginHistoryRepo: LoginHistoryRepository,
  ) {}

  async execute(payload: AuthHistoryPayload, updateAll = false): Promise<void> {
    const ip = (this.request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      ?? this.request.socket?.remoteAddress
      ?? null;
    const userAgent = this.request.headers['user-agent'] ?? null;

    if (payload.loggedInAt) {
      await this.loginHistoryRepo.create({
        userId: payload.userId,
        sessionId: payload.sessionId,
        familyId: payload.familyId ?? null,
        loggedInAt: payload.loggedInAt,
        expiredAt: payload.expiredAt ?? null,
        ip,
        userAgent,
      } as Partial<LoginHistory>);
      return;
    }

    if (payload.loggedOutAt) {
      const where: FindOptionsWhere<LoginHistory> = updateAll
        ? { userId: payload.userId, loggedOutAt: undefined }
        : { userId: payload.userId, sessionId: payload.sessionId, loggedOutAt: undefined };

      await this.loginHistoryRepo.updateMany(where, { loggedOutAt: payload.loggedOutAt });
    }
  }
}
