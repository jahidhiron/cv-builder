import { PartialType } from '@nestjs/swagger';
import { CreatePermissionDto } from './create-permission.dto';

/**
 * Request body for partially updating an existing permission.
 *
 * All fields inherited from {@link CreatePermissionDto} are optional.
 * Only the supplied fields are changed; omitted fields retain their current values.
 * If `key` is provided it must still be globally unique across all permissions.
 */
export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}
