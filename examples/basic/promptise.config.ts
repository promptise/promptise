/**
 * Promptise configuration for basic example.
 *
 * This file registers compositions for CLI preview generation.
 */

import { Promptise } from '@promptise/core';
import { medicalDiagnosis } from './src/compositions/medical-diagnosis.ts';
import { codeReview } from './src/compositions/code-review.ts';
import { simplePrompt } from './src/compositions/simple-prompt.ts';

export default new Promptise({
  defaultCost: {
    inputTokenPrice: 0.000005,
    outputTokenPrice: 0.000015,
    currency: 'USD',
  },
  compositions: [
    // CASE 1: Complete fixture (all required fields provided)
    {
      composition: medicalDiagnosis,
      fixtures: {
        complete: {
          role: 'general practitioner',
          context: 'Patient presenting with fever and headache',
          task: 'Provide differential diagnosis',
          rules: [
            'Consider common conditions first',
            'Ask clarifying questions if needed',
            'Recommend when to seek emergency care',
          ],
        },
      },
    },
    // CASE 2: Partial fixture (some required fields missing)
    {
      composition: codeReview,
      fixtures: {
        partial: {
          role: 'senior security engineer',
          task: 'Review code for security vulnerabilities',
          // Missing `rules` on purpose to demonstrate partial fixtures.
        },
      },
    },
    // CASE 3: Placeholder (no fixtures - CLI generates placeholder fixture automatically)
    simplePrompt,
  ],
});
