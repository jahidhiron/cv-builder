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
  SigninProvider,
  SignupProvider,
  VerifyEmailProvider,
} from '@/modules/auth/providers';
import type { SessionInfo } from '@/modules/auth/providers/interfaces';
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

  /**
   * @param dto - Signup payload containing email, password, and profile fields.
   * @returns The newly created user record.
   */
  signup(dto: SignupDto) {
    return this.signupProvider.execute(dto);
  }

  /**
   * @param dto - Email and password credentials.
   * @returns `{ user, token: { accessToken, refreshToken } }`.
   */
  signin(dto: SigninDto) {
    return this.signinProvider.execute(dto);
  }

  /**
   * @param dto - Google OAuth id token payload.
   * @returns `{ user, token: { accessToken, refreshToken } }`.
   */
  googleSignin(dto: GoogleSigninDto) {
    return this.googleSigninProvider.execute(dto);
  }

  /**
   * @param dto         - Optional body containing `refreshToken`.
   * @param cookieToken - Raw refresh JWT read from the HTTP-only cookie (fallback).
   * @returns `{ token: { accessToken, refreshToken } }`.
   */
  refreshToken(dto: RefreshTokenDto, cookieToken?: string) {
    return this.refreshTokenProvider.execute(dto.refreshToken ?? cookieToken ?? '');
  }

  /**
   * @param user            - Authenticated user's JWT payload.
   * @param dto             - Query options; `type` is `'current'` or `'all'`.
   * @param rawRefreshToken - Raw refresh JWT from the cookie (fallback when not in Redis).
   * @returns Resolves when the logout is complete.
   */
  logout(user: UserPayload, dto: LogoutQueryDto, rawRefreshToken?: string) {
    return this.logoutProvider.execute(user, dto, rawRefreshToken);
  }

  /**
   * @param dto - Payload containing the `email` and one-time `token`.
   * @returns Resolves when the email has been verified.
   */
  verifyEmail(dto: VerifyEmailDto) {
    return this.verifyEmailProvider.execute(dto);
  }

  /**
   * @param dto - Payload containing the `email` address to re-verify.
   * @returns Resolves when the verification email has been dispatched (or silently when ineligible).
   */
  resendVerification(dto: ResendVerificationDto) {
    return this.resendVerificationProvider.execute(dto);
  }

  /**
   * @param dto - Payload containing the account `email` address.
   * @returns Resolves when the reset email has been dispatched (or silently when ineligible).
   */
  forgotPassword(dto: ForgotPasswordDto) {
    return this.forgotPasswordProvider.execute(dto);
  }

  /**
   * @param dto - Contains `email`, one-time `token`, and the new `password`.
   * @returns Resolves when the password has been reset.
   */
  resetPassword(dto: ResetPasswordDto) {
    return this.resetPasswordProvider.execute(dto);
  }

  /**
   * @param dto  - Contains `oldPassword` and `newPassword`.
   * @param user - Authenticated user's JWT payload.
   * @returns Resolves when the password has been changed.
   */
  changePassword(dto: ChangePasswordDto, user: UserPayload) {
    return this.changePasswordProvider.execute(dto, user);
  }

  /**
   * @param user - Authenticated user's JWT payload.
   * @returns `{ sessions }` — metadata for every active session.
   */
  listSessions(user: UserPayload): Promise<{ sessions: SessionInfo[] }> {
    return this.listSessionsProvider.execute(user);
  }

  /**
   * @param user      - Authenticated user's JWT payload.
   * @param sessionId - The session identifier to revoke.
   * @returns Resolves when the session has been fully revoked.
   */
  revokeSession(user: UserPayload, sessionId: string): Promise<void> {
    return this.revokeSessionProvider.execute(user, sessionId);
  }
}
