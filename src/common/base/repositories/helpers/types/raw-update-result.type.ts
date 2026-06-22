// Shape returned by a raw UPDATE/DELETE/INSERT ... RETURNING query on PostgreSQL.
type RawUpdateResultSingle = { rowCount: number };

// What rawQuery might give you
export type RawUpdateResult = RawUpdateResultSingle | RawUpdateResultSingle[];
