import { Promptise } from '@promptise/core';
import { supportFull } from '../../src/shared/compositions/support-full.ts';

export default new Promptise({
  defaultCost: {
    inputTokenPrice: 0.000005,
    outputTokenPrice: 0.000015,
    currency: 'USD',
  },
  compositions: [
    {
      composition: supportFull,
      fixtures: {
        complete: {
          role: 'customer support specialist',
          context: 'Customer cannot reset password after MFA change',
          task: 'Provide a concise troubleshooting plan',
          rules: [
            'Ask for OS and browser before assumptions',
            'Prioritize account recovery safety',
            'End with next steps if issue persists',
          ],
        },
      },
    },
  ],
});
