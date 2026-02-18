import { Promptise } from '@promptise/core';
import { securityReview } from '../../src/shared/compositions/security-review.ts';

export default new Promptise({
  compositions: [
    {
      composition: securityReview,
      fixtures: {
        known: {
          role: 'secure code reviewer',
          task: 'Review CSRF handling in update profile endpoint',
          rules: ['Validate anti-CSRF token usage', 'Verify origin checks'],
        },
      },
    },
  ],
});
