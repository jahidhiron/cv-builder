export interface NewDeviceEmailData {
  email: string;
  name: string;
  ip: string | null;
  userAgent: string | null;
}

export interface NewDeviceEmailOptions {
  companyName: string;
}
