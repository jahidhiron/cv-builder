import { PermissionDto } from '@/modules/permissions/dtos/permission.dto';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Standard response envelope for single-permission endpoints.
 *
 * Returned by the create, update, and find-one actions.
 * The outer `permission` key keeps the response shape consistent
 * with other resource envelopes in the API.
 */
export class PermissionResponseDto {
  /** The permission data returned by the operation. */
  @ApiProperty({ type: PermissionDto })
  permission!: PermissionDto;
}
