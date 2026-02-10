/**
 * Simple prompt composition.
 *
 * Demonstrates basic composition without wrappers.
 */

import { createPromptComposition } from '@promptise/core';
import { roleComponent } from '../components/role.ts';
import { taskComponent } from '../components/task.ts';

export const simplePrompt = createPromptComposition({
  id: 'simple-prompt',
  description: 'Basic prompt structure',
  components: [roleComponent, taskComponent],
});
