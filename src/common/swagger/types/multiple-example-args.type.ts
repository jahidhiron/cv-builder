import { HttpMethod } from '@/common/enums';
import { ExampleItem } from '@/common/swagger/types/example-item.type';

export type MultipleExamplesArgs = {
  path: string;
  method: HttpMethod;
  examples: Record<string, ExampleItem>;
};
