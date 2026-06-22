import { PartialType } from '@nestjs/swagger';
import { CreateRoleDto } from './create-role.dto';

/** Request body for partially updating an existing role. All fields from {@link CreateRoleDto} are optional. */
export class UpdateRoleDto extends PartialType(CreateRoleDto) {}
