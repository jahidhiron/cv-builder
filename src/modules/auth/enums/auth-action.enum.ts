export enum AuthAction {
  SignupSuccess = 'signup.success',
  SignupFailed = 'signup.failed',

  SigninSuccess = 'signin.success',
  SigninFailed = 'signin.failed',

  LogoutSuccess = 'logout.success',
  LogoutAll = 'logout.all',

  VerifyEmailSuccess = 'verify-email.success',
  VerifyEmailFailed = 'verify-email.failed',
  ResendVerificationSuccess = 'resend-verification.success',

  ForgotPasswordSuccess = 'forgot-password.success',
  ResetPasswordSuccess = 'reset-password.success',
  ResetPasswordFailed = 'reset-password.failed',

  ChangePasswordSuccess = 'change-password.success',
  ChangePasswordFailed = 'change-password.failed',

  SessionRevoked = 'session.revoked',

  GoogleSigninSuccess = 'google-signin.success',
  GoogleSigninFailed = 'google-signin.failed',
}
