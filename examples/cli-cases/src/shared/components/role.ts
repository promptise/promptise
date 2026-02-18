import { createPromptComponent } from '@promptise/core';
import { z } from 'zod';

export const roleComponent = createPromptComponent({
  key: 'role',
  schema: z.object({
    role: z.string().describe('Assistant role'),
  }),
  template: 'You are a {{role}}.',
});
