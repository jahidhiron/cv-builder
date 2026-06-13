import { UserPayload } from '@/modules/auth/interfaces';
import {
  ChangePasswordProvider,
  ForgotPasswordProvider,
  GoogleSigninProvider,
  LogoutProvider,
  RefreshTokenProvider,
  ResendVerificationProvider,
  ResetPasswordProvider,
  SigninProvider,
  SignupProvider,
  VerifyEmailProvider,
} from '@/modules/auth/providers';
import { Injectable } from '@nestjs/common';
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

@Injectable()
export class AuthService {
  constructor(
    private readonly signupProvider: SignupProvider,
    private readonly signinProvider: SigninProvider,
    private readonly googleSigninProvider: GoogleSigninProvider,
    private readonly refreshTokenProvider: RefreshTokenProvider,
    private readonly logoutProvider: LogoutProvider,
    private readonly verifyEmailProvider: VerifyEmailProvider,
    private readonly resendVerificationProvider: ResendVerificationProvider,
    private readonly forgotPasswordProvider: ForgotPasswordProvider,
    private readonly resetPasswordProvider: ResetPasswordProvider,
    private readonly changePasswordProvider: ChangePasswordProvider,
  ) {}

  signup(dto: SignupDto) {
    return this.signupProvider.execute(dto);
  }

  signin(dto: SigninDto) {
    return this.signinProvider.execute(dto);
  }

  googleSignin(dto: GoogleSigninDto) {
    return this.googleSigninProvider.execute(dto);
  }

  refreshToken(dto: RefreshTokenDto, cookieToken?: string) {
    const token = dto.refreshToken ?? cookieToken ?? '';
    return this.refreshTokenProvider.execute(token);
  }

  logout(user: UserPayload, dto: LogoutQueryDto, rawRefreshToken?: string) {
    return this.logoutProvider.execute(user, dto, rawRefreshToken);
  }

  verifyEmail(dto: VerifyEmailDto) {
    return this.verifyEmailProvider.execute(dto);
  }

  resendVerification(dto: ResendVerificationDto) {
    return this.resendVerificationProvider.execute(dto);
  }

  forgotPassword(dto: ForgotPasswordDto) {
    return this.forgotPasswordProvider.execute(dto);
  }

  resetPassword(dto: ResetPasswordDto) {
    return this.resetPasswordProvider.execute(dto);
  }

  changePassword(dto: ChangePasswordDto, user: UserPayload) {
    return this.changePasswordProvider.execute(dto, user);
  }
}
