export interface ServerErrorAlertData {
  errorName: string;
  message: string;
  method: string;
  path: string;
  stack: string | null;
  occurredAt: Date;
}

export interface ServerErrorAlertOptions {
  companyName: string;
  supportEmail: string;
  logoUrl: string;
}
