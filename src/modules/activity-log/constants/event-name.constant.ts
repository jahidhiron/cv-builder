export const EventNames = {
  LOG_ACTIVITY: 'log.activity',
} as const;

export type EventName = (typeof EventNames)[keyof typeof EventNames];
