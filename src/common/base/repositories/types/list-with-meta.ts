import { Meta } from '../interfaces';

/** A paginated collection keyed by `K` (default `'collection'`) alongside its `meta`. */
export type ListWithMeta<T, K extends string = 'collection'> = {
  [key in K]: T[];
} & {
  meta: Meta;
};
