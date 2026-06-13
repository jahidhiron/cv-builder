import { HttpMethod } from '@/common/enums';
import { ExampleItem } from '@/common/swagger/types/example-item.type';

export type SingleExampleArgs = {
  path: string;
  method: HttpMethod;
  message?: string;
  data?: unknown;
  errors?: ExampleItem['errors'];
};
