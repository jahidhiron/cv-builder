import { ActivityLogModule } from '@/modules/activity-log/activity-log.module';
import { ConfigModule } from '@/config';
import {
  ApplyTokenProvider,
  ChangePasswordProvider,
  CheckPasswordHistoryProvider,
  CleanupRefreshTokenProvider,
  CreateAuthHistoryProvider,
  CreateRefreshTokenProvider,
  CreateTokenProvider,
  FindOneTokenProvider,
  ForgotPasswordProvider,
  GoogleSigninProvider,
  InvalidatePreviousTokenProvider,
  ListSessionsProvider,
  LogoutProvider,
  NewDeviceNotificationProvider,
  RefreshTokenProvider,
  ResendVerificationProvider,
  ResetPasswordProvider,
  RevokeRefreshTokenProvider,
  RevokeSessionProvider,
  SigninProvider,
  SignupProvider,
  UpdateLoginHistoryExpiryProvider,
  UpdateRefreshTokenProvider,
  VerifyEmailProvider,
  VerifyRefreshTokenProvider,
  VerifyTokenProvider,
} from '@/modules/auth/providers';
import { SavePasswordHistoryProvider } from '@/modules/auth/providers/save-password-history.provider';
import {
  LoginHistoryRepository,
  PasswordHistoryRepository,
  RefreshTokenRepository,
  VerificationTokenRepository,
} from '@/modules/auth/repositories';
import { PermissionModule } from '@/modules/permissions/permission.module';
import { RoleModule } from '@/modules/roles/role.module';
import { UserModule } from '@/modules/users/user.module';
import { SharedModule } from '@/shared';
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard, JwtAuthGuard } from './guards';

/**
 * AuthModule wires together all authentication and authorization concerns:
 * JWT issuance/validation, refresh-token lifecycle, verification emails,
 * password history enforcement, session management, and OAuth (Google).
 *
 * Exported symbols (`AuthService`, `AuthGuard`, `JwtAuthGuard`) are consumed
 * by other feature modules that need to protect their routes or inspect the
 * current user identity. `JwtService` is available globally via `SharedModule`.
 */
@Module({
  imports: [
    SharedModule,
    RoleModule,
    UserModule,
    PermissionModule,
    ConfigModule,
    ActivityLogModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    // Guards
    AuthGuard,
    JwtAuthGuard,
    // Repositories
    VerificationTokenRepository,
    RefreshTokenRepository,
    LoginHistoryRepository,
    PasswordHistoryRepository,
    // Token infrastructure
    InvalidatePreviousTokenProvider,
    FindOneTokenProvider,
    ApplyTokenProvider,
    CreateTokenProvider,
    VerifyTokenProvider,
    CreateRefreshTokenProvider,
    VerifyRefreshTokenProvider,
    UpdateRefreshTokenProvider,
    UpdateLoginHistoryExpiryProvider,
    CleanupRefreshTokenProvider,
    RevokeRefreshTokenProvider,
    CreateAuthHistoryProvider,
    // Business logic
    SignupProvider,
    SigninProvider,
    GoogleSigninProvider,
    NewDeviceNotificationProvider,
    RefreshTokenProvider,
    LogoutProvider,
    VerifyEmailProvider,
    ResendVerificationProvider,
    ForgotPasswordProvider,
    ResetPasswordProvider,
    ChangePasswordProvider,
    CheckPasswordHistoryProvider,
    SavePasswordHistoryProvider,
    ListSessionsProvider,
    RevokeSessionProvider,
  ],
  exports: [AuthService, AuthGuard, JwtAuthGuard],
})
export class AuthModule {}
