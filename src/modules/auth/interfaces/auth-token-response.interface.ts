export interface AuthTokenResponse {
  token: {
    accessToken: string;
    refreshToken: string;
  };
}
