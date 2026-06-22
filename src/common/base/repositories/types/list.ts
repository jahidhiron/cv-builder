export type List<T, K extends string = 'collection'> = {
  [key in K]: T[];
};
