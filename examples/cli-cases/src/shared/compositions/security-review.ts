import { createPromptComposition } from '@promptise/core';
import { roleComponent } from '../components/role.ts';
import { taskComponent } from '../components/task.ts';
import { rulesComponent } from '../components/rules.ts';

export const securityReview = createPromptComposition({
  id: 'security-review',
  description: 'Security review prompt with markdown wrappers',
  components: [roleComponent, taskComponent, rulesComponent],
  componentWrapper: 'markdown',
});
