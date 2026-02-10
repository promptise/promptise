/**
 * Context component - provides additional background information.
 */

import { createPromptComponent } from '@promptise/core';
import { z } from 'zod';

export const contextComponent = createPromptComponent({
  key: 'context',
  schema: z.object({
    context: z.string().describe('Background or contextual information'),
  }),
  template: 'Context: {{context}}',
});
