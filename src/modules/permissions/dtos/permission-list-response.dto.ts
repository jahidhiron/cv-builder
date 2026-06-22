import { MetaDto } from '@/common/base/dtos';
import { PermissionDto } from '@/modules/permissions/dtos/permission.dto';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Paginated response envelope for the list-permissions endpoint.
 *
 * Wraps the current page of permission records together with pagination
 * metadata so clients can implement cursor- or page-based navigation.
 */
export class PermissionListResponseDto {
  /** The permissions on the current page. */
  @ApiProperty({ type: [PermissionDto] })
  items!: PermissionDto[];

  /** Pagination metadata (current page, limit, total count, etc.). */
  @ApiProperty({ type: MetaDto })
  meta!: MetaDto;
}
