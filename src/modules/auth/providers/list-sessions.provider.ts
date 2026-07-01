import { ModuleName } from '@/common/base/enums';
import { SystemLog } from '@/modules/activity-log/decorators';
import type { UserPayload } from '@/modules/auth/interfaces';
import type { SessionInfo } from '@/modules/auth/providers/interfaces';
import { RedisService } from '@/shared/redis/redis.service';
import { Injectable, Scope } from '@nestjs/common';

/**
 * Returns metadata for every active Redis session belonging to the authenticated user.
 * Token values are intentionally excluded from the response.
 */
@Injectable({ scope: Scope.REQUEST })
export class ListSessionsProvider {
  constructor(private readonly redisService: RedisService) {}

  /**
   * Lists all active sessions for the authenticated user.
   *
   * Steps:
   * 1. **Key scan** — retrieves all Redis keys matching `auth:<userId>:*`.
   * 2. **Metadata extraction** — for each key, parses `familyId` and `sessionId`
   *    from the key segments and reads `ip`, `userAgent`, and `createdAt` from
   *    the hash. Keys with fewer than 4 segments are skipped as malformed.
   * 3. **Current session flag** — marks the session whose `sessionId` matches
   *    the caller's JWT payload as `isCurrent: true`.
   *
   * Token values (`accessToken`, `refreshToken`) are intentionally excluded from
   * the response to avoid leaking credentials through the list endpoint.
   *
   * @param user - The authenticated user extracted from the JWT.
   * @returns `{ sessions }` — metadata for every active session.
   */
  @SystemLog(ModuleName.Auth)
  async execute(user: UserPayload): Promise<{ sessions: SessionInfo[] }> {
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

    return { sessions };
  }
}
