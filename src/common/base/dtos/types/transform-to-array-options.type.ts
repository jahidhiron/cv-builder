export type TransformToArrayOptions<T> = {
  allowJsonString?: boolean;
  wrapSingle?: boolean;
  emptyAsUndefined?: boolean;
  itemGuard?: (v: unknown) => v is T;
};
