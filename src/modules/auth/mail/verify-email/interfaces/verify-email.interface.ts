export interface VerifyEmailData {
  email: string;
  name: string;
  token: string;
}

export interface VerifyEmailOptions {
  clientBaseUrl: string;
}
