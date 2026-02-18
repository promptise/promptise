import { createPromptComponent } from '@promptise/core';
import { z } from 'zod';

export const contextComponent = createPromptComponent({
  key: 'context',
  schema: z.object({
    context: z.string().describe('Context information'),
  }),
  template: 'Context: {{context}}',
});
