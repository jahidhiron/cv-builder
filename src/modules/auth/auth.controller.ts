import { ModuleName } from '@/common/enums';
import { AuthType } from '@/modules/auth/enums';
import type { UserPayload } from '@/modules/auth/interfaces';
import { CookieService } from '@/shared/cookie';
import { SuccessResponse } from '@/shared/response';
import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Auth } from './decorators/auth.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
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
  VerifyEmailDto,
} from './dtos';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly successResponse: SuccessResponse,
    private readonly cookieService: CookieService,
  ) {}

  @Auth(AuthType.None)
  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    const user = await this.authService.signup(dto);
    return this.successResponse.created({ module: ModuleName.Auth, key: 'signup', user });
  }

  @Auth(AuthType.None)
  @Post('signin')
  async signin(
    @Body() dto: SigninDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signin(dto);
    this.cookieService.setAuth(res, { accessToken: result.token.accessToken, refreshToken: result.token.refreshToken });
    return this.successResponse.ok({ module: ModuleName.Auth, key: 'signin', user: result.user });
  }

  @Auth(AuthType.None)
  @Post('google')
  async googleSignin(
    @Body() dto: GoogleSigninDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.googleSignin(dto);
    this.cookieService.setAuth(res, { accessToken: result.token.accessToken, refreshToken: result.token.refreshToken });
    return this.successResponse.ok({ module: ModuleName.Auth, key: 'signin', user: result.user });
  }

  @Auth(AuthType.None)
  @Post('refresh-token')
  async refreshToken(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookieToken: string | undefined = (req as { cookies?: Record<string, string> }).cookies
      ?.refreshToken;
    const result = await this.authService.refreshToken(dto, cookieToken);
    this.cookieService.setAuth(res, { accessToken: result.token.accessToken, refreshToken: result.token.refreshToken });
    return this.successResponse.ok({ module: ModuleName.Auth, key: 'refresh-token' });
  }

  @Auth(AuthType.None)
  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.authService.verifyEmail(dto);
    return this.successResponse.ok({ module: ModuleName.Auth, key: 'email-verified' });
  }

  @Auth(AuthType.None)
  @Post('resend-verification')
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.authService.resendVerification(dto);
    return this.successResponse.ok({ module: ModuleName.Auth, key: 'verification-sent' });
  }

  @Auth(AuthType.None)
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto);
    return this.successResponse.ok({ module: ModuleName.Auth, key: 'forgot-password-token' });
  }

  @Auth(AuthType.None)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto);
    return this.successResponse.ok({ module: ModuleName.Auth, key: 'password-reset' });
  }

  @Patch('change-password')
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: UserPayload,
  ) {
    await this.authService.changePassword(dto, user);
    return this.successResponse.ok({ module: ModuleName.Auth, key: 'change-password' });
  }

  @Get('logout')
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
