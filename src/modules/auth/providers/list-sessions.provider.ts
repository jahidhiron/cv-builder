import { UserPayload } from '@/modules/auth/interfaces';
import { RedisService } from '@/shared/redis/redis.service';
import { Injectable, Scope } from '@nestjs/common';

export interface SessionInfo {
  sessionId: string;
  familyId: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  isCurrent: boolean;
}

/**
 * Returns metadata for every active Redis session belonging to the authenticated user.
 * Token values are intentionally excluded from the response.
 */
@Injectable({ scope: Scope.REQUEST })
export class ListSessionsProvider {
  constructor(private readonly redisService: RedisService) {}

  async execute(user: UserPayload): Promise<SessionInfo[]> {
    const keys = await this.redisService.keys(`auth:${user.id}:*`);
    const sessions: SessionInfo[] = [];

    for (const key of keys) {
      // key format: auth:<userId>:<familyId>:<sessionId>
      const parts = key.split(':');
      if (parts.length < 4) continue;

      const familyId = parts[2];
      const sessionId = parts[3];

      const data = await this.redisService.hgetall<{
        ip?: string;
        userAgent?: string;
        createdAt?: string;
      }>(key);

      sessions.push({
        sessionId,
        familyId,
        ip: data?.ip ?? '',
        userAgent: data?.userAgent ?? '',
        createdAt: data?.createdAt ?? '',
        isCurrent: sessionId === user.sessionId,
      });
    }

    return sessions;
  }
}
