import { ModuleName } from '@/common/base/enums';
import { Serialize } from '@/common/interceptors';
import { ParseIdPipe } from '@/common/pipes';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { UserPayload } from '@/modules/auth/interfaces';
import { UpdateUserDto, UserListQueryDto, UserListResponseDto, UserResponseDto } from '@/modules/users/dtos';
import { AvatarFilePipe } from '@/modules/users/pipes';
import {
  ActivateUserSwaggerDocs,
  DeactivateUserSwaggerDocs,
  DeleteUserSwaggerDocs,
  FindOneUserSwaggerDocs,
  ListUsersSwaggerDocs,
  RestoreUserSwaggerDocs,
  UpdateUserSwaggerDocs,
  UploadAvatarSwaggerDocs,
} from '@/modules/users/swaggers';
import { UserService } from '@/modules/users/user.service';
import { SuccessResponse } from '@/shared/response';
import type { MulterFile } from '@/shared/storage';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  Patch,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@Controller(ModuleName.User)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly successResponse: SuccessResponse,
  ) {}

  @Serialize(UserListResponseDto)
  @Get()
  @ListUsersSwaggerDocs()
  async list(@Query() query: UserListQueryDto) {
    const result = await this.userService.list(query);
    return this.successResponse.ok({ module: ModuleName.User, key: 'users-list', ...result });
  }

  @Serialize(UserResponseDto)
  @Get(':id')
  @FindOneUserSwaggerDocs()
  async findOne(@Param('id', ParseIdPipe) id: number) {
    const result = await this.userService.findOne(id);
    return this.successResponse.ok({ module: ModuleName.User, key: 'user-detail', ...result });
  }

  @Serialize(UserResponseDto)
  @Patch(':id')
  @UpdateUserSwaggerDocs()
  async update(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdateUserDto) {
    const result = await this.userService.update(id, dto);
    return this.successResponse.ok({ module: ModuleName.User, key: 'update-user', ...result });
  }

  @Delete(':id')
  @DeleteUserSwaggerDocs()
  async remove(
    @Param('id', ParseIdPipe) id: number,
    @Query('force', new ParseBoolPipe({ optional: true })) force: boolean = false,
    @CurrentUser() currentUser: UserPayload,
  ) {
    await this.userService.remove(id, currentUser, force);
    return this.successResponse.ok({
      module: ModuleName.User,
      key: force ? 'hard-delete-user' : 'soft-delete-user',
    });
  }

  @Serialize(UserResponseDto)
  @Patch(':id/restore')
  @RestoreUserSwaggerDocs()
  async restore(@Param('id', ParseIdPipe) id: number) {
    const result = await this.userService.restore(id);
    return this.successResponse.ok({ module: ModuleName.User, key: 'restore-user', ...result });
  }

  @Serialize(UserResponseDto)
  @Patch(':id/activate')
  @ActivateUserSwaggerDocs()
  async activate(@Param('id', ParseIdPipe) id: number) {
    const result = await this.userService.activate(id);
    return this.successResponse.ok({ module: ModuleName.User, key: 'activate-user', ...result });
  }

  @Serialize(UserResponseDto)
  @Patch(':id/deactivate')
  @DeactivateUserSwaggerDocs()
  async deactivate(@Param('id', ParseIdPipe) id: number) {
    const result = await this.userService.deactivate(id);
    return this.successResponse.ok({ module: ModuleName.User, key: 'deactivate-user', ...result });
  }

  @Serialize(UserResponseDto)
  @Patch(':id/avatar')
  @UploadAvatarSwaggerDocs()
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @Param('id', ParseIdPipe) id: number,
    @UploadedFile(new AvatarFilePipe())
    file: MulterFile,
  ) {
    const result = await this.userService.uploadAvatar(id, file);
    return this.successResponse.ok({ module: ModuleName.User, key: 'upload-avatar', ...result });
  }
}
