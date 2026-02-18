import { createPromptComponent } from '@promptise/core';
import { z } from 'zod';

export const taskComponent = createPromptComponent({
  key: 'task',
  schema: z.object({
    task: z.string().describe('Requested task'),
  }),
  template: 'Task: {{task}}',
});
