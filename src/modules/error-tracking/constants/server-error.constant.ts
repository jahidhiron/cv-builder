/** Columns that the {@link ServerErrorListQueryDto} allows clients to sort by. */
export const SERVER_ERROR_SORTABLE_COLUMNS = [
  'id',
  'errorName',
  'status',
  'occurrenceCount',
  'firstSeenAt',
  'lastSeenAt',
] as const;
