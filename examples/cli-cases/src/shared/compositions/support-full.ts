import { createPromptComposition } from '@promptise/core';
import { roleComponent } from '../components/role.ts';
import { contextComponent } from '../components/context.ts';
import { taskComponent } from '../components/task.ts';
import { rulesComponent } from '../components/rules.ts';

export const supportFull = createPromptComposition({
  id: 'support-full',
  description: 'Support flow with complete structured inputs',
  components: [roleComponent, contextComponent, taskComponent, rulesComponent],
  componentWrapper: 'xml',
});
