import { createPromptComposition } from '@promptise/core';
import { roleComponent } from '../components/role.ts';
import { taskComponent } from '../components/task.ts';

export const quickPrompt = createPromptComposition({
  id: 'quick-prompt',
  description: 'Minimal prompt used for placeholder-only generation',
  components: [roleComponent, taskComponent],
});
