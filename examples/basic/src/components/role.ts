/**
 * Role component - defines who the AI assistant is.
 */

import { createPromptComponent } from '@promptise/core';
import { z } from 'zod';

export const roleComponent = createPromptComponent({
  key: 'role',
  schema: z.object({
    role: z.string().describe('The role or persona of the AI assistant'),
  }),
  template: 'You are a {{role}}.',
});
