import { createPromptComponent } from '@promptise/core';
import { z } from 'zod';

export const rulesComponent = createPromptComponent({
  key: 'rules',
  schema: z.object({
    rules: z.array(z.string()).describe('List of constraints'),
  }),
  template: ({ input }) => {
    const lines = input.rules.map((rule) => `- ${rule}`).join('\n');
    return `Rules:\n${lines}`;
  },
});
