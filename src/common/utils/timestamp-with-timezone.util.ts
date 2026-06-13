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
