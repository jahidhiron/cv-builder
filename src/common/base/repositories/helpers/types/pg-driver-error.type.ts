/** Shape of the driver-level error attached to a TypeORM `QueryFailedError`. */
export type PgDriverError = {
  code?: string;
  detail?: string;
  constraint?: string;
  sqlMessage?: string;
  message?: string;
};
