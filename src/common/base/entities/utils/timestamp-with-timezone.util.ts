/**
 * Constructs a `Date` object whose UTC value represents the same calendar moment
 * as `date` in the server's local timezone.
 *
 * PostgreSQL's `timestamptz` stores values in UTC. When TypeORM serialises a plain
 * `new Date()`, it uses the UTC epoch directly, which can differ from the local wall
 * clock by the timezone offset. This utility compensates for that offset so that the
 * stored value equals the local time, not UTC.
 *
 * @param date - Source date (defaults to `now`).
 * @returns Adjusted `Date` representing the same local calendar moment.
 */
export const timestampWithTimezone = (date: Date = new Date()): Date => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  const timezoneOffset = date.getTimezoneOffset(); // in minutes
  const timezoneOffsetMs = timezoneOffset * 60 * 1000;

  // Construct a new Date object with the same year, month, day, hours, minutes, seconds
  const localDate = new Date(year, month, day, hours, minutes, seconds);

  // Adjust by timezone offset to match the "formatted" local time
  return new Date(localDate.getTime() - timezoneOffsetMs);
};
