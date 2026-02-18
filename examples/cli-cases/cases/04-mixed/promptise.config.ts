import { Promptise } from '@promptise/core';
import { supportFull } from '../../src/shared/compositions/support-full.ts';
import { securityReview } from '../../src/shared/compositions/security-review.ts';
import { quickPrompt } from '../../src/shared/compositions/quick-prompt.ts';

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
          role: 'support lead',
          context: 'Production rollout caused timeout spikes',
          task: 'Create incident response checklist',
          rules: [
            'Acknowledge severity and impact',
            'Prioritize safe rollback options',
            'List follow-up actions with owners',
          ],
        },
      },
    },
    {
      composition: securityReview,
      fixtures: {
        partial: {
          role: 'security reviewer',
          task: 'Analyze token refresh endpoint logic',
        },
      },
    },
    quickPrompt,
  ],
});
