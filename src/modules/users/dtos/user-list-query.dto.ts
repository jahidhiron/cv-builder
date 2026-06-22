import { IsSortableColumn } from '@/common/base/dtos/decorators/is-sortable-column.decorator';
import { ListOptionsDto } from '@/common/base/dtos/list-options.dto';
import { USER_SORTABLE_COLUMNS } from '@/modules/users/constants/user.constant';
import type { SortByDto } from '@/common/base/dtos/sort-by.dto';

/** Query parameters for paginating, searching, and sorting the user list. */
export class UserListQueryDto extends ListOptionsDto {
  @IsSortableColumn([...USER_SORTABLE_COLUMNS])
  declare sortBy?: SortByDto[];
}
