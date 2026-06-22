import { UserPayload } from '@/modules/auth/interfaces';
import {
  ChangePasswordProvider,
  ForgotPasswordProvider,
  GoogleSigninProvider,
  ListSessionsProvider,
  LogoutProvider,
  RefreshTokenProvider,
  ResendVerificationProvider,
  ResetPasswordProvider,
  RevokeSessionProvider,
  SessionInfo,
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

/**
 * Facade service for the authentication domain.
 *
 * Each public method delegates directly to a dedicated provider that encapsulates
 * the business logic for that operation. The service itself holds no state and
 * contains no business rules — its sole responsibility is wiring controllers to
 * the correct provider.
 */
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
    private readonly listSessionsProvider: ListSessionsProvider,
    private readonly revokeSessionProvider: RevokeSessionProvider,
  ) {}

  /** Register a new user with email and password. */
  signup(dto: SignupDto) {
    return this.signupProvider.execute(dto);
  }

  /** Authenticate a user with email and password and issue JWT tokens. */
  signin(dto: SigninDto) {
    return this.signinProvider.execute(dto);
  }

  /** Authenticate or register a user via Google OAuth id token. */
  googleSignin(dto: GoogleSigninDto) {
    return this.googleSigninProvider.execute(dto);
  }

  /** Issue a new access/refresh token pair from the body token or cookie. */
  refreshToken(dto: RefreshTokenDto, cookieToken?: string) {
    return this.refreshTokenProvider.execute(dto.refreshToken ?? cookieToken ?? '');
  }

  /** Revoke tokens and clear auth cookies for the authenticated user. */
  logout(user: UserPayload, dto: LogoutQueryDto, rawRefreshToken?: string) {
    return this.logoutProvider.execute(user, dto, rawRefreshToken);
  }

  /** Verify the email-verification token sent to the user's inbox. */
  verifyEmail(dto: VerifyEmailDto) {
    return this.verifyEmailProvider.execute(dto);
  }

  /** Resend the email-verification link to the supplied address. */
  resendVerification(dto: ResendVerificationDto) {
    return this.resendVerificationProvider.execute(dto);
  }

  /** Initiate the password-reset flow by emailing a reset link. */
  forgotPassword(dto: ForgotPasswordDto) {
    return this.forgotPasswordProvider.execute(dto);
  }

  /** Consume the password-reset token and set a new password. */
  resetPassword(dto: ResetPasswordDto) {
    return this.resetPasswordProvider.execute(dto);
  }

  /** Change the password for an already-authenticated user. */
  changePassword(dto: ChangePasswordDto, user: UserPayload) {
    return this.changePasswordProvider.execute(dto, user);
  }

  /** List all active sessions for the authenticated user. */
  listSessions(user: UserPayload): Promise<SessionInfo[]> {
    return this.listSessionsProvider.execute(user);
  }

  /** Revoke a specific session by sessionId for the authenticated user. */
  revokeSession(user: UserPayload, sessionId: string): Promise<void> {
    return this.revokeSessionProvider.execute(user, sessionId);
  }
}
