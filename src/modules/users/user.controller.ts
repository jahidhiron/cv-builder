import { ModuleName } from '@/common/base/enums';
import { Serialize } from '@/common/interceptors';
import { ParseIdPipe } from '@/common/pipes';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { RequirePermissions } from '@/modules/auth/decorators/require-permissions.decorator';
import type { UserPayload } from '@/modules/auth/interfaces';
import {
  CreateUserDto,
  UpdateUserDto,
  UserListQueryDto,
  UserListResponseDto,
  UserResponseDto,
} from '@/modules/users/dtos';
import { AvatarFilePipe } from '@/modules/users/pipes';
import {
  ActivateUserSwaggerDocs,
  CreateUserSwaggerDocs,
  DeactivateUserSwaggerDocs,
  DeleteUserSwaggerDocs,
  FindOneUserSwaggerDocs,
  ListUsersSwaggerDocs,
  RestoreUserSwaggerDocs,
  UpdateMeSwaggerDocs,
  UpdateUserSwaggerDocs,
  UploadAvatarSwaggerDocs,
} from '@/modules/users/swaggers';
import { GetMeSwaggerDocs } from '@/modules/users/swaggers/get-me.swagger';
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
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

/**
 * UserController handles all user-management HTTP endpoints under `/users`.
 *
 * Endpoints are split by actor intent:
 * - `GET/PATCH /users/me` — any authenticated user managing their own profile.
 * - `GET/PATCH/DELETE /users/:id` — super-admin operations on any account.
 * - State transitions (`activate`, `deactivate`, `restore`) are kept as
 *   dedicated sub-routes for clean RBAC and audit-trail separation.
 */
@ApiTags('Users')
@ApiBearerAuth()
@Controller(ModuleName.User)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly successResponse: SuccessResponse,
  ) {}

  /**
   * Returns a paginated list of all users. Super-admin only.
   *
   * @param query - Validated query parameters (page, limit, search, sort).
   * @returns Paginated user list serialized as `UserListResponseDto`.
   */
  @Serialize(UserListResponseDto)
  @Get()
  @RequirePermissions('users:list')
  @ListUsersSwaggerDocs()
  async list(@Query() query: UserListQueryDto) {
    const result = await this.userService.list(query);
    return this.successResponse.ok({ module: ModuleName.User, key: 'users-list', ...result });
  }

  /**
   * Creates a new user account. Super-admin only.
   * When `password` is omitted, a secure random password is generated and
   * returned in the response as `plainPassword`.
   *
   * @param dto - Validated admin create payload.
   * @returns The newly created user and, when auto-generated, the plain-text password.
   * @throws {ConflictException} When the email is already registered.
   * @throws {NotFoundException} When the provided `roleId` does not exist.
   */
  @Serialize(UserResponseDto)
  @Post()
  @CreateUserSwaggerDocs()
  async create(@Body() dto: CreateUserDto) {
    const result = await this.userService.createUser(dto);
    return this.successResponse.created({ module: ModuleName.User, key: 'create-user', ...result });
  }

  /**
   * Returns the profile of the currently authenticated user.
   *
   * @param currentUser - JWT-extracted payload of the authenticated user.
   * @returns The caller's user record serialized as `UserResponseDto`.
   */
  @Serialize(UserResponseDto)
  @Get('me')
  @GetMeSwaggerDocs()
  @RequirePermissions('users:me')
  async me(@CurrentUser() currentUser: UserPayload) {
    const result = await this.userService.findOne({ id: currentUser.id, isDeleted: false });
    return this.successResponse.ok({ module: ModuleName.User, key: 'user-detail', ...result });
  }

  /**
   * Updates the profile of the currently authenticated user.
   *
   * @param currentUser - JWT-extracted payload of the authenticated user.
   * @param dto         - Fields to update.
   * @returns The updated user record serialized as `UserResponseDto`.
   */
  @Serialize(UserResponseDto)
  @Patch('me')
  @RequirePermissions('users:update-me')
  @UpdateMeSwaggerDocs()
  async updateMe(@CurrentUser() currentUser: UserPayload, @Body() dto: UpdateUserDto) {
    const result = await this.userService.update({ id: currentUser.id, isDeleted: false }, dto);
    return this.successResponse.ok({ module: ModuleName.User, key: 'update-user', ...result });
  }

  /**
   * Returns a single user by ID. Super-admin only.
   *
   * @param id - User ID parsed and validated by `ParseIdPipe`.
   * @returns The matched user record serialized as `UserResponseDto`.
   * @throws {NotFoundException} When no non-deleted user with `id` exists.
   */
  @Serialize(UserResponseDto)
  @Get(':id')
  @RequirePermissions('users:detail')
  @FindOneUserSwaggerDocs()
  async findOne(@Param('id', ParseIdPipe) id: number) {
    const result = await this.userService.findOne({ id });
    return this.successResponse.ok({ module: ModuleName.User, key: 'user-detail', ...result });
  }

  /**
   * Updates any user's profile fields by ID. Super-admin only.
   *
   * @param id  - User ID parsed and validated by `ParseIdPipe`.
   * @param dto - Fields to update.
   * @returns The updated user record serialized as `UserResponseDto`.
   * @throws {NotFoundException} When no user with `id` exists.
   */
  @Serialize(UserResponseDto)
  @Patch(':id')
  @RequirePermissions('users:update')
  @UpdateUserSwaggerDocs()
  async update(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdateUserDto) {
    const result = await this.userService.update({ id }, dto);
    return this.successResponse.ok({ module: ModuleName.User, key: 'update-user', ...result });
  }

  /**
   * Deletes a user by ID. Super-admin only.
   * Soft-deletes by default; pass `?force=true` for a permanent hard-delete.
   *
   * @param id          - User ID parsed and validated by `ParseIdPipe`.
   * @param force       - When `true`, permanently removes the row.
   * @param currentUser - JWT-extracted payload used to prevent self-deletion.
   * @returns 200 OK success response.
   * @throws {ForbiddenException} When the actor attempts to delete their own account.
   * @throws {NotFoundException}  When no user with `id` exists.
   */
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

  /**
   * Restores a previously soft-deleted user. Super-admin only.
   *
   * @param id - User ID parsed and validated by `ParseIdPipe`.
   * @returns The restored user record serialized as `UserResponseDto`.
   * @throws {NotFoundException}   When no user with `id` exists.
   * @throws {BadRequestException} When the matched record is not currently soft-deleted.
   */
  @Serialize(UserResponseDto)
  @Patch(':id/restore')
  @RequirePermissions('users:restore')
  @RestoreUserSwaggerDocs()
  async restore(@Param('id', ParseIdPipe) id: number) {
    const result = await this.userService.restore(id);
    return this.successResponse.ok({ module: ModuleName.User, key: 'restore-user', ...result });
  }

  /**
   * Sets `isActive = true` for the user. Super-admin only.
   *
   * @param id - User ID parsed and validated by `ParseIdPipe`.
   * @returns The updated user record serialized as `UserResponseDto`.
   * @throws {NotFoundException} When no user with `id` exists.
   * @throws {ConflictException} When the user is already active.
   */
  @Serialize(UserResponseDto)
  @Patch(':id/activate')
  @RequirePermissions('users:activate')
  @ActivateUserSwaggerDocs()
  async activate(@Param('id', ParseIdPipe) id: number) {
    const result = await this.userService.activate(id);
    return this.successResponse.ok({ module: ModuleName.User, key: 'activate-user', ...result });
  }

  /**
   * Sets `isActive = false` for the user. Super-admin only.
   *
   * @param id - User ID parsed and validated by `ParseIdPipe`.
   * @returns The updated user record serialized as `UserResponseDto`.
   * @throws {NotFoundException} When no user with `id` exists.
   * @throws {ConflictException} When the user is already inactive.
   */
  @Serialize(UserResponseDto)
  @Patch(':id/deactivate')
  @RequirePermissions('users:deactivate')
  @DeactivateUserSwaggerDocs()
  async deactivate(@Param('id', ParseIdPipe) id: number) {
    const result = await this.userService.deactivate(id);
    return this.successResponse.ok({ module: ModuleName.User, key: 'deactivate-user', ...result });
  }

  /**
   * Replaces the avatar for a given user.
   * Accepts a multipart `avatar` field validated by `AvatarFilePipe`.
   *
   * @param id   - User ID parsed and validated by `ParseIdPipe`.
   * @param file - Validated image file.
   * @returns The updated user record (including new `avatarUrl`) serialized as `UserResponseDto`.
   * @throws {NotFoundException} When no user with `id` exists.
   */
  @Serialize(UserResponseDto)
  @Patch(':id/avatar')
  @RequirePermissions('users:upload-avatar')
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
