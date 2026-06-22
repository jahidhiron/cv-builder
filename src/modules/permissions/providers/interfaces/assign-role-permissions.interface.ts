import type { AssignPermissionsDto } from '@/modules/permissions/dtos';

export interface AssignRolePermissionsParams {
  roleId: number;
  dto: AssignPermissionsDto;
}
