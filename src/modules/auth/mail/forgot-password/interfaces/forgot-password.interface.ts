export interface ForgotPasswordEmailData {
  email: string;
  name: string;
  token: string;
}

export interface ForgotPasswordEmailOptions {
  clientBaseUrl: string;
  companyName: string;
}
