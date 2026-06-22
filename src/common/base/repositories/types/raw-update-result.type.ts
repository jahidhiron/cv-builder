import { Meta } from '../interfaces';

export type ListWithMeta<T, K extends string = 'collection'> = {
  [key in K]: T[];
} & {
  meta: Meta;
};
