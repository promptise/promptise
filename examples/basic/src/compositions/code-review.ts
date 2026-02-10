/**
 * Code review composition.
 *
 * Demonstrates Markdown wrappers and different review focus areas.
 */

import { createPromptComposition } from '@promptise/core';
import { roleComponent } from '../components/role.ts';
import { taskComponent } from '../components/task.ts';
import { rulesComponent } from '../components/rules.ts';

export const codeReview = createPromptComposition({
  id: 'code-review',
  description: 'Prompt for code review assistance',
  components: [roleComponent, taskComponent, rulesComponent],
  componentWrapper: 'markdown',
});
