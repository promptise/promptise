import { createPromptComposition } from '@promptise/core';
import { sensitiveComponent } from '../components/sensitive.ts';

export const fragilePrompt = createPromptComposition({
  id: 'fragile-prompt',
  description: 'Prompt that intentionally fails with placeholder values',
  components: [sensitiveComponent],
});
