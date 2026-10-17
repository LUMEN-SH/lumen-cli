import { z } from 'zod';

export const {{nameCamel}}Schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
});

export type {{Name}}FormValues = z.infer<typeof {{nameCamel}}Schema>;
