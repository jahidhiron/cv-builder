import { ConfigModule } from '@/config';
import {
  ChangePasswordProvider,
  CleanupRefreshTokenProvider,
  CreateAuthHistoryProvider,
  CreateRefreshTokenProvider,
  CreateTokenProvider,
  ForgotPasswordProvider,
  GoogleSigninProvider,
  LogoutProvider,
  RefreshTokenProvider,
  ResendVerificationProvider,
  ResetPasswordProvider,
  SigninProvider,
  SignupProvider,
  UpdateRefreshTokenProvider,
  VerifyEmailProvider,
  VerifyRefreshTokenProvider,
  VerifyTokenProvider,
} from '@/modules/auth/providers';
import {
  LoginHistoryRepository,
  RefreshTokenRepository,
  VerificationTokenRepository,
} from '@/modules/auth/repositories';
import { RoleModule } from '@/modules/roles/role.module';
import { UserModule } from '@/modules/users/user.module';
import { SharedModule } from '@/shared';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard, JwtAuthGuard } from './guards';

@Module({
  imports: [
    SharedModule,
    RoleModule,
    UserModule,
    ConfigModule,
    JwtModule.register({}),
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
    // Token infrastructure
    CreateTokenProvider,
    VerifyTokenProvider,
    CreateRefreshTokenProvider,
    VerifyRefreshTokenProvider,
    UpdateRefreshTokenProvider,
    CleanupRefreshTokenProvider,
    CreateAuthHistoryProvider,
    // Business logic
    SignupProvider,
    SigninProvider,
    GoogleSigninProvider,
    RefreshTokenProvider,
    LogoutProvider,
    VerifyEmailProvider,
    ResendVerificationProvider,
    ForgotPasswordProvider,
    ResetPasswordProvider,
    ChangePasswordProvider,
  ],
  exports: [AuthService, AuthGuard, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
