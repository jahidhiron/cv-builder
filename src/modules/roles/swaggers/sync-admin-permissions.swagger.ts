import { HTTP_STATUS } from '@/shared/response/constants';
import { SwaggerApiSuccessResponse } from '@/common/swagger';
import { HttpMethod } from '@/common/swagger/enums';
import { ModuleName } from '@/common/base/enums';
import { ForbiddenResponse, InternalServerErrorResponse, NotFoundResponse, UnauthorizedResponse } from '@/common/swagger';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

export class SyncAdminPermissionsResponseDto {
  totalDiscovered!: number;
  created!: number;
  assigned!: number;
}

/** Applies Swagger documentation decorators for the sync-admin-permissions endpoint. */
export function SyncAdminPermissionsSwaggerDocs() {
  const path = `${ModuleName.Role}/sync-admin-permissions`;
  const method = HttpMethod.POST;

  return applyDecorators(
    ApiOperation({
      summary: 'Sync all route permissions to the Admin role',
      description:
        'Scans every registered private route, upserts missing permission records, and assigns all permissions to the Admin role. Safe to run multiple times — already-existing permissions and assignments are skipped.',
    }),

    SwaggerApiSuccessResponse(SyncAdminPermissionsResponseDto, {
      method,
      status: HTTP_STATUS.CREATED.context,
      statusCode: HTTP_STATUS.CREATED.status,
      path,
      message: 'Admin permissions synced successfully',
    }),

    UnauthorizedResponse({ path, method }),
    ForbiddenResponse({ path, method }),
    NotFoundResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}