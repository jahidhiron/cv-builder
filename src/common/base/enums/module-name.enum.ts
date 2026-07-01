/** Identifies the module/domain a response or log entry originates from. */
export enum ModuleName {
  App = 'app',
  Common = 'common',
  Shared = 'shared',
  Health = 'healths',
  Auth = 'auth',
  Role = 'roles',
  Permission = 'permissions',
  User = 'users',
  RateLimit = 'rate-limit',
  ErrorTracking = 'error-tracking',
  ActivityLog = 'activity-log',
}
