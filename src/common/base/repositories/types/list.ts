/** A flat, unpaginated collection keyed by `K` (default `'collection'`). */
export type List<T, K extends string = 'collection'> = {
  [key in K]: T[];
};
