import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsInt, IsPositive } from 'class-validator';

export class AssignPermissionsDto {
  @ApiProperty({ example: [1, 2, 3], description: 'IDs of permissions to assign' })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @IsPositive({ each: true })
  permissionIds!: number[];
}
