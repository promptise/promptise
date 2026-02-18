import { Promptise } from '@promptise/core';
import { quickPrompt } from '../../src/shared/compositions/quick-prompt.ts';

export default new Promptise({
  compositions: [quickPrompt],
});
