export interface ResendVerificationEmailData {
  email: string;
  name: string;
  token: string;
}

export interface ResendVerificationEmailOptions {
  clientBaseUrl: string;
  companyName: string;
}
