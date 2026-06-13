export type ExampleItem = {
  summary?: string;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
  data?: unknown;
};
