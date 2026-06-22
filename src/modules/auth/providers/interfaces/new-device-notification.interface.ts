export interface NewDeviceNotificationParams {
  userId: number;
  familyId: string;
  email: string;
  name: string;
  ip: string | null;
  userAgent: string | null;
}
