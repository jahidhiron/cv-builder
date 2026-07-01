import { ModuleName } from '@/common/base/enums';
import { Serialize } from '@/common/interceptors';
import { AuthType } from '@/modules/auth/enums';
import type { UserPayload } from '@/modules/auth/interfaces';
import {
  ChangePasswordSwaggerDocs,
  ForgotPasswordSwaggerDocs,
  GoogleSigninSwaggerDocs,
  LogoutSwaggerDocs,
  RefreshTokenSwaggerDocs,
  ResendVerificationSwaggerDocs,
  ResetPasswordSwaggerDocs,
  SigninSwaggerDocs,
  SignupSwaggerDocs,
  VerifyEmailSwaggerDocs,
} from '@/modules/auth/swaggers';
import { CookieService } from '@/shared/cookie';
import {
  CHANGE_PASSWORD_RATE_LIMIT,
  FORGOT_PASSWORD_RATE_LIMIT,
  GOOGLE_SIGNIN_RATE_LIMIT,
  LIST_SESSIONS_RATE_LIMIT,
  REFRESH_TOKEN_RATE_LIMIT,
  RESEND_VERIFICATION_RATE_LIMIT,
  RESET_PASSWORD_RATE_LIMIT,
  REVOKE_SESSION_RATE_LIMIT,
  RateLimit,
  RateLimitGuard,
  SIGNIN_RATE_LIMIT,
  SIGNUP_RATE_LIMIT,
  VERIFY_EMAIL_RATE_LIMIT,
} from '@/shared/rate-limit';
import { SuccessResponse } from '@/shared/response';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Auth } from './decorators/auth.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { SkipPermissions } from './decorators/skip-permissions.decorator';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  GoogleSigninDto,
  LogoutQueryDto,
  RefreshTokenDto,
  ResendVerificationDto,
  ResetPasswordDto,
  SigninDto,
  SignupDto,
  SignupResponseDto,
  VerifyEmailDto,
} from './dtos';

/**
 * AuthController handles all authentication-related HTTP endpoints under `/auth`.
 *
 * Permission checks are skipped globally for this controller via `@SkipPermissions()`
 * because auth routes must be accessible before a user has an established identity.
 * Individual endpoints that require a valid JWT opt-in through the default `@Auth()`
 * decorator (e.g. `change-password`, `sessions`, `logout`), while public endpoints
 * explicitly declare `@Auth(AuthType.None)`.
 */
@ApiTags('Auth')
@SkipPermissions()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly successResponse: SuccessResponse,
    private readonly cookieService: CookieService,
  ) {}

  /**
   * Registers a new user account.
   *
   * @param dto - Signup payload containing email, password, and profile fields.
   * @returns The newly created user record serialized as `SignupResponseDto`.
   */
  @Serialize(SignupResponseDto)
  @Auth(AuthType.None)
  @Post('signup')
  @RateLimit(SIGNUP_RATE_LIMIT)
  @UseGuards(RateLimitGuard)
  @SignupSwaggerDocs()
  async signup(@Body() dto: SignupDto) {
    const result = await this.authService.signup(dto);
    return this.successResponse.created({ module: ModuleName.Auth, key: 'signup', ...result });
  }

  /**
   * Authenticates a user with email and password.
   * On success, writes `accessToken` and `refreshToken` into HTTP-only cookies.
   *
   * @param dto - Signin credentials.
   * @param res - Express response used to attach auth cookies.
   * @returns The authenticated user serialized as `SignupResponseDto`.
   */
  @Serialize(SignupResponseDto)
  @Auth(AuthType.None)
  @Post('signin')
  @RateLimit(SIGNIN_RATE_LIMIT)
  @UseGuards(RateLimitGuard)
  @SigninSwaggerDocs()
  async signin(@Body() dto: SigninDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.signin(dto);
    this.cookieService.setAuth(res, {
      accessToken: result.token.accessToken,
      refreshToken: result.token.refreshToken,
    });
    return this.successResponse.ok({ module: ModuleName.Auth, key: 'signin', ...result });
  }

  /**
   * Authenticates or registers a user via Google OAuth ID token.
   * On success, writes `accessToken` and `refreshToken` into HTTP-only cookies.
   *
   * @param dto - Google ID token payload.
   * @param res - Express response used to attach auth cookies.
   * @returns The authenticated user serialized as `SignupResponseDto`.
   */
  @Serialize(SignupResponseDto)
  @Auth(AuthType.None)
  @Post('google')
  @RateLimit(GOOGLE_SIGNIN_RATE_LIMIT)
  @UseGuards(RateLimitGuard)
  @GoogleSigninSwaggerDocs()
  async googleSignin(@Body() dto: GoogleSigninDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.googleSignin(dto);
    this.cookieService.setAuth(res, {
      accessToken: result.token.accessToken,
      refreshToken: result.token.refreshToken,
    });
    return this.successResponse.ok({ module: ModuleName.Auth, key: 'signin', ...result });
  }

  /**
   * Issues a new access/refresh token pair using an existing refresh token.
   * The refresh token is read from the request body first; if absent, falls back
   * to the `refreshToken` HTTP-only cookie set during sign-in.
   *
   * @param dto - Optional body containing `refreshToken`.
   * @param req - Express request used to read the cookie fallback.
   * @param res - Express response used to overwrite auth cookies with the new tokens.
   * @returns 200 OK with the new `{ token: { accessToken, refreshToken } }`.
   */
  @Auth(AuthType.None)
  @Post('refresh-token')
  @RateLimit(REFRESH_TOKEN_RATE_LIMIT)
  @UseGuards(RateLimitGuard)
  @RefreshTokenSwaggerDocs()
  async refreshToken(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookieToken: string | undefined = (req as { cookies?: Record<string, string> }).cookies
      ?.refreshToken;
    const result = await this.authService.refreshToken(dto, cookieToken);
    this.cookieService.setAuth(res, {
      accessToken: result.token.accessToken,
      refreshToken: result.token.refreshToken,
    });
    return this.successResponse.ok({ module: ModuleName.Auth, key: 'refresh-token', ...result });
  }

  /**
   * Confirms a user's email address using the one-time verification token
   * sent to their inbox during signup or via `resend-verification`.
   *
   * @param dto - Payload containing the verification token.
   * @returns 200 OK success response.
   */
  @Auth(AuthType.None)
  @Post('verify-email')
  @RateLimit(VERIFY_EMAIL_RATE_LIMIT)
  @UseGuards(RateLimitGuard)
  @VerifyEmailSwaggerDocs()
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.authService.verifyEmail(dto);
    return this.successResponse.ok({ module: ModuleName.Auth, key: 'email-verified' });
  }

  /**
   * Re-sends the email verification link to the provided address.
   * Rate-limited to prevent abuse.
   *
   * @param dto - Payload containing the email address to re-verify.
   * @returns 200 OK success response (always, regardless of whether the email exists).
   */
  @Auth(AuthType.None)
  @Post('resend-verification')
  @RateLimit(RESEND_VERIFICATION_RATE_LIMIT)
  @UseGuards(RateLimitGuard)
  @ResendVerificationSwaggerDocs()
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.authService.resendVerification(dto);
    return this.successResponse.ok({ module: ModuleName.Auth, key: 'verification-sent' });
  }

  /**
   * Initiates the password-reset flow by emailing a reset token to the user.
   * Always returns 200 regardless of whether the email exists to prevent
   * user-enumeration attacks.
   *
   * @param dto - Payload containing the account email address.
   * @returns 200 OK success response (always, regardless of whether the email exists).
   */
  @Auth(AuthType.None)
  @Post('forgot-password')
  @RateLimit(FORGOT_PASSWORD_RATE_LIMIT)
  @UseGuards(RateLimitGuard)
  @ForgotPasswordSwaggerDocs()
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto);
    return this.successResponse.ok({ module: ModuleName.Auth, key: 'forgot-password-token' });
  }

  /**
   * Completes the password-reset flow by validating the reset token and
   * persisting the new password.
   *
   * @param dto - Payload containing the reset token and the new password.
   * @returns 200 OK success response.
   */
  @Auth(AuthType.None)
  @Post('reset-password')
  @RateLimit(RESET_PASSWORD_RATE_LIMIT)
  @UseGuards(RateLimitGuard)
  @ResetPasswordSwaggerDocs()
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto);
    return this.successResponse.ok({ module: ModuleName.Auth, key: 'password-reset' });
  }

  /**
   * Allows an authenticated user to change their own password.
   * Validates the current password and enforces password-history policy
   * to prevent reuse of recent passwords.
   *
   * @param dto  - Payload containing the current password and the desired new password.
   * @param user - JWT-extracted payload of the currently authenticated user.
   * @returns 200 OK success response.
   */
  @Patch('change-password')
  @RateLimit(CHANGE_PASSWORD_RATE_LIMIT)
  @UseGuards(RateLimitGuard)
  @ChangePasswordSwaggerDocs()
  async changePassword(@Body() dto: ChangePasswordDto, @CurrentUser() user: UserPayload) {
    await this.authService.changePassword(dto, user);
    return this.successResponse.ok({ module: ModuleName.Auth, key: 'change-password' });
  }

  /**
   * Returns all active refresh-token sessions for the authenticated user.
   *
   * @param user - JWT-extracted payload of the currently authenticated user.
   * @returns List of active session records.
   */
  @Get('sessions')
  @RateLimit(LIST_SESSIONS_RATE_LIMIT)
  @UseGuards(RateLimitGuard)
  async listSessions(@CurrentUser() user: UserPayload) {
    const result = await this.authService.listSessions(user);
    return this.successResponse.ok({ module: ModuleName.Auth, key: 'list-sessions', ...result });
  }

  /**
   * Revokes a specific session (refresh token) belonging to the authenticated user.
   * Useful for remote sign-out from a particular device.
   *
   * @param sessionId - The `sessionId` from the session list to revoke.
   * @param user      - JWT-extracted payload of the currently authenticated user.
   * @returns 200 OK success response.
   */
  @Delete('sessions/:sessionId')
  @RateLimit(REVOKE_SESSION_RATE_LIMIT)
  @UseGuards(RateLimitGuard)
  async revokeSession(@Param('sessionId') sessionId: string, @CurrentUser() user: UserPayload) {
    await this.authService.revokeSession(user, sessionId);
    return this.successResponse.ok({ module: ModuleName.Auth, key: 'session-revoked' });
  }

  /**
   * Signs the user out by invalidating the refresh token and clearing auth cookies.
   * The refresh token is sourced from the request body or the `refreshToken` cookie.
   * Supports an optional query flag to log out all devices simultaneously.
   *
   * @param query - Query params controlling logout scope (`type: 'current' | 'all'`).
   * @param user  - JWT-extracted payload of the currently authenticated user.
   * @param req   - Express request used to read the cookie fallback.
   * @param res   - Express response used to clear auth cookies.
   * @returns 200 OK success response.
   */
  @Post('logout')
  @LogoutSwaggerDocs()
  async logout(
    @Query() query: LogoutQueryDto,
    @CurrentUser() user: UserPayload,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookieToken: string | undefined = (req as { cookies?: Record<string, string> }).cookies
      ?.refreshToken;
    await this.authService.logout(user, query, cookieToken);
    this.cookieService.clearAuth(res);
    return this.successResponse.ok({ module: ModuleName.Auth, key: 'logout' });
  }
}
