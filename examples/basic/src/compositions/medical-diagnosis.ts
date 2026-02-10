/**
 * Medical diagnosis composition.
 *
 * Demonstrates XML wrappers for structured component formatting.
 */

import { createPromptComposition } from '@promptise/core';
import { roleComponent } from '../components/role.ts';
import { taskComponent } from '../components/task.ts';
import { contextComponent } from '../components/context.ts';
import { rulesComponent } from '../components/rules.ts';

export const medicalDiagnosis = createPromptComposition({
  id: 'medical-diagnosis',
  description: 'Prompt for medical diagnosis assistance',
  components: [roleComponent, contextComponent, taskComponent, rulesComponent],
  componentWrapper: 'xml',
});
