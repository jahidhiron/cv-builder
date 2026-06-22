export const ServiceNames = {
  CV_BUILDER_SYNC: 'CV_BUILDER_SYNC',
} as const;

export type ServiceName = (typeof ServiceNames)[keyof typeof ServiceNames];
