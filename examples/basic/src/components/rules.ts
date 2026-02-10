/**
 * Rules component - defines constraints or guidelines.
 */

import { createPromptComponent } from '@promptise/core';
import { z } from 'zod';

export const rulesComponent = createPromptComponent({
  key: 'rules',
  schema: z.object({
    rules: z.array(z.string()).describe('List of rules or constraints'),
  }),
  template: ({ input }) => {
    const formattedRules = input.rules.map((rule: string) => `- ${rule}`).join('\n');
    return `Rules:\n${formattedRules}`;
  },
});
