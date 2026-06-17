import { MetaDto } from '@/common/dtos';
import { PermissionDto } from '@/modules/permissions/dtos/permission.dto';
import { ApiProperty } from '@nestjs/swagger';

export class PermissionListResponseDto {
  @ApiProperty({ type: [PermissionDto] })
  items!: PermissionDto[];

  @ApiProperty({ type: MetaDto })
  meta!: MetaDto;
}
