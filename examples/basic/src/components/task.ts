/**
 * Task component - defines what the AI should do.
 */

import { createPromptComponent } from '@promptise/core';
import { z } from 'zod';

export const taskComponent = createPromptComponent({
  key: 'task',
  schema: z.object({
    task: z.string().describe('The main task or objective'),
  }),
  template: 'Task: {{task}}',
});
