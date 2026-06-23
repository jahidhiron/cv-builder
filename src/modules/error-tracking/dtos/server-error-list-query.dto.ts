import { IsSortableColumn } from '@/common/base/dtos/decorators/is-sortable-column.decorator';
import { ListOptionsDto } from '@/common/base/dtos/list-options.dto';
import { SERVER_ERROR_SORTABLE_COLUMNS } from '@/modules/error-tracking/constants/server-error.constant';
import { ServerErrorStatus } from '@/modules/error-tracking/enums/server-error-status.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import type { SortByDto } from '@/common/base/dtos/sort-by.dto';

/**
 * Query parameters for the paginated server-error list endpoint.
 *
 * Extends {@link ListOptionsDto} with an optional `status` filter so
 * administrators can quickly scope the view to a specific lifecycle state.
 * Sortable columns are restricted to {@link SERVER_ERROR_SORTABLE_COLUMNS}.
 */
export class ServerErrorListQueryDto extends ListOptionsDto {
  @ApiPropertyOptional({ enum: ServerErrorStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(ServerErrorStatus)
  status?: ServerErrorStatus;

  @IsSortableColumn([...SERVER_ERROR_SORTABLE_COLUMNS])
  declare sortBy?: SortByDto[];
}
