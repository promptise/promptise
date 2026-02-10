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
  compositions: [
    {
      composition: medicalDiagnosis,
      fixtures: {
        basic: {
          role: 'general practitioner',
          context: 'Patient presenting with fever and headache',
          task: 'Provide differential diagnosis',
          rules: [
            'Consider common conditions first',
            'Ask clarifying questions if needed',
            'Recommend when to seek emergency care',
          ],
        },
        icu: {
          role: 'intensive care specialist',
          context: 'ICU patient with septic shock, requiring vasopressor support',
          task: 'Optimize hemodynamic management and source control',
          rules: [
            'Follow surviving sepsis campaign guidelines',
            'Consider ARDS protective ventilation',
            'Monitor lactate clearance',
            'Initiate early goal-directed therapy',
          ],
        },
      },
    },
    {
      composition: codeReview,
      fixtures: {
        security: {
          role: 'senior security engineer',
          task: 'Review code for security vulnerabilities',
          rules: [
            'Check for SQL injection risks',
            'Verify input sanitization',
            'Look for authentication bypasses',
            'Identify sensitive data exposure',
          ],
        },
        performance: {
          role: 'performance optimization expert',
          task: 'Analyze code for performance bottlenecks',
          rules: [
            'Identify N+1 query problems',
            'Check for unnecessary loops',
            'Look for memory leaks',
            'Suggest caching opportunities',
          ],
        },
      },
    },
    {
      composition: simplePrompt,
      fixtures: {
        example: {
          role: 'helpful assistant',
          task: 'Answer the user question clearly and concisely',
        },
      },
    },
  ],
});
