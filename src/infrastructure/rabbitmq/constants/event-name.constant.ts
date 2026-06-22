export const EventNames = {} as const;

export type EventName = (typeof EventNames)[keyof typeof EventNames];
