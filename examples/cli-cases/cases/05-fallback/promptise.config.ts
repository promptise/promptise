import { Promptise } from '@promptise/core';
import { fragilePrompt } from '../../src/shared/compositions/fragile-prompt.ts';

export default new Promptise({
  compositions: [
    {
      composition: fragilePrompt,
      fixtures: {
        empty: {},
      },
    },
  ],
});
