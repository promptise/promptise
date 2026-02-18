import { createPromptComponent } from '@promptise/core';
import { z } from 'zod';

export const sensitiveComponent = createPromptComponent({
  key: 'sensitive',
  schema: z.object({
    sensitive: z.string().describe('Sensitive input that cannot be placeholder based'),
  }),
  template: ({ input }) => {
    if (input.sensitive.includes('{{')) {
      throw new Error('sensitive input cannot contain unresolved placeholders');
    }
    return `Sensitive input: ${input.sensitive}`;
  },
});
