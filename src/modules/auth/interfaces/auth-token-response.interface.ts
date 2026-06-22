/**
 * Tokens returned by `CreateTokenProvider` after successful authentication.
 * The `refreshToken` is also written to an HTTP-only cookie by `SigninProvider`.
 */
export interface AuthTokenResponse {
  token: {
    accessToken: string;
    refreshToken: string;
  };
}
