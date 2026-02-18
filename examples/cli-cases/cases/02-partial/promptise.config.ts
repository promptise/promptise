import { Promptise } from '@promptise/core';
import { securityReview } from '../../src/shared/compositions/security-review.ts';

export default new Promptise({
  compositions: [
    {
      composition: securityReview,
      fixtures: {
        partial: {
          role: 'senior application security engineer',
          task: 'Review authentication flow for bypass risks',
        },
      },
    },
  ],
});
