import { Promptise } from '@promptise/core';
import { supportFull } from '../../src/shared/compositions/support-full.ts';

export default new Promptise({
  compositions: [
    {
      composition: supportFull,
      fixtures: {
        complete: {
          role: 'support analyst',
          context: 'Sandbox user cannot receive verification email',
          task: 'Provide triage checklist',
          rules: ['Confirm account status', 'Check spam and SPF records'],
        },
      },
    },
  ],
});
