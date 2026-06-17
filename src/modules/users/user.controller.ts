import { ModuleName } from '@/common/enums';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { UserPayload } from '@/modules/auth/interfaces';
import { UpdateUserDto, UserListQueryDto } from '@/modules/users/dtos';
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
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseBoolPipe,
  ParseFilePipe,
  ParseIntPipe,
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

  @Get()
  @ListUsersSwaggerDocs()
  async list(@Query() query: UserListQueryDto, @CurrentUser() currentUser: UserPayload) {
    const result = await this.userService.list(query, currentUser);
    return this.successResponse.ok({ module: ModuleName.User, key: 'users-list', ...result });
  }

  @Get(':id')
  @FindOneUserSwaggerDocs()
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.userService.findOne(id);
    return this.successResponse.ok({ module: ModuleName.User, key: 'user-detail', ...result });
  }

  @Patch(':id')
  @UpdateUserSwaggerDocs()
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    const result = await this.userService.update(id, dto);
    return this.successResponse.ok({ module: ModuleName.User, key: 'update-user', ...result });
  }

  @Delete(':id')
  @DeleteUserSwaggerDocs()
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('force', new ParseBoolPipe({ optional: true })) force: boolean = false,
    @CurrentUser() currentUser: UserPayload,
  ) {
    await this.userService.remove(id, currentUser, force);
    return this.successResponse.ok({
      module: ModuleName.User,
      key: force ? 'hard-delete-user' : 'soft-delete-user',
    });
  }

  @Patch(':id/restore')
  @RestoreUserSwaggerDocs()
  async restore(@Param('id', ParseIntPipe) id: number) {
    const result = await this.userService.restore(id);
    return this.successResponse.ok({ module: ModuleName.User, key: 'restore-user', ...result });
  }

  @Patch(':id/activate')
  @ActivateUserSwaggerDocs()
  async activate(@Param('id', ParseIntPipe) id: number) {
    const result = await this.userService.activate(id);
    return this.successResponse.ok({ module: ModuleName.User, key: 'activate-user', ...result });
  }

  @Patch(':id/deactivate')
  @DeactivateUserSwaggerDocs()
  async deactivate(@Param('id', ParseIntPipe) id: number) {
    const result = await this.userService.deactivate(id);
    return this.successResponse.ok({ module: ModuleName.User, key: 'deactivate-user', ...result });
  }

  @Patch(':id/avatar')
  @UploadAvatarSwaggerDocs()
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: MulterFile,
  ) {
    const result = await this.userService.uploadAvatar(id, file);
    return this.successResponse.ok({ module: ModuleName.User, key: 'upload-avatar', ...result });
  }
}
