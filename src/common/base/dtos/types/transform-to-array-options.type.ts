/** Options controlling how {@link TransformToArray} normalises an incoming value into `T[]`. */
export type TransformToArrayOptions<T> = {
  allowJsonString?: boolean;
  wrapSingle?: boolean;
  emptyAsUndefined?: boolean;
  itemGuard?: (v: unknown) => v is T;
};
