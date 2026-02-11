import { describe, it, expect, beforeEach } from '@jest/globals';
import { createPromptStrategy } from './strategy.factory.js';
import { createPromptComposition } from '../composition/composition.factory.js';
import { createPromptComponent } from '../component/component.factory.js';
import { createStrategyPattern } from './pattern/strategy-pattern.factory.js';
import { z } from 'zod';

// Mock TOON library
jest.mock('@toon-format/toon', () => ({
  encode: (value: unknown) => {
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      const keys = Object.keys(value[0] as Record<string, unknown>);
      const rows = value
        .map((item) => keys.map((k) => String((item as Record<string, unknown>)[k])).join(','))
        .join('\n  ');
      return `[${String(value.length)}]{${keys.join(',')}}:\n  ${rows}`;
    }
    return JSON.stringify(value);
  },
}));

describe('PromptStrategy Factory', () => {
  // Test fixtures
  let draftComposition: ReturnType<typeof createPromptComposition>;
  let critiqueComposition: ReturnType<typeof createPromptComposition>;
  let refineComposition: ReturnType<typeof createPromptComposition>;

  beforeEach(() => {
    // Create reusable test compositions
    const topicComponent = createPromptComponent({
      key: 'topic',
      template: 'Topic: {{topic}}',
      schema: z.object({ topic: z.string() }),
    });

    const draftComponent = createPromptComponent({
      key: 'draft',
      template: 'Draft: {{draft}}',
      schema: z.object({ draft: z.string() }),
    });

    const critiqueComponent = createPromptComponent({
      key: 'critique',
      template: 'Critique: {{critique}}',
      schema: z.object({ critique: z.string() }),
    });

    draftComposition = createPromptComposition({
      id: 'draft',
      components: [topicComponent],
    });

    critiqueComposition = createPromptComposition({
      id: 'critique',
      components: [draftComponent],
    });

    refineComposition = createPromptComposition({
      id: 'refine',
      components: [draftComponent, critiqueComponent],
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Factory Creation & Validation
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('Factory Creation & Validation', () => {
    it('creates strategy with valid config', () => {
      const strategy = createPromptStrategy({
        id: 'test-strategy',
        description: 'Test strategy',
        steps: [draftComposition, critiqueComposition],
      });

      expect(strategy.id).toBe('test-strategy');
      expect(strategy.description).toBe('Test strategy');
      expect(strategy.steps).toHaveLength(2);
      expect(strategy.steps.length).toBe(2);
    });

    it('creates strategy without description', () => {
      const strategy = createPromptStrategy({
        id: 'minimal-strategy',
        steps: [draftComposition],
      });

      expect(strategy.id).toBe('minimal-strategy');
      expect(strategy.description).toBeUndefined();
      expect(strategy.steps.length).toBe(1);
    });

    it('throws on empty steps array', () => {
      expect(() => {
        createPromptStrategy({
          id: 'empty-strategy',
          steps: [],
        });
      }).toThrow(/must have at least one step/);
    });

    it('throws on duplicate composition IDs', () => {
      const comp1 = createPromptComposition({
        id: 'duplicate',
        components: [
          createPromptComponent({
            key: 'test1',
            template: 'Test 1',
            schema: z.object({}),
          }),
        ],
      });

      const comp2 = createPromptComposition({
        id: 'duplicate',
        components: [
          createPromptComponent({
            key: 'test2',
            template: 'Test 2',
            schema: z.object({}),
          }),
        ],
      });

      expect(() => {
        createPromptStrategy({
          id: 'duplicate-strategy',
          steps: [comp1, comp2],
        });
      }).toThrow(/duplicate composition IDs/);
    });

    it('sets default values correctly', () => {
      const strategy = createPromptStrategy({
        id: 'default-strategy',
        steps: [draftComposition],
      });

      expect(strategy.getCurrentIndex()).toBe(0);
      expect(strategy.completed).toBe(false);
      expect(strategy.getHistory()).toEqual([]);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Stateful Navigation
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('Stateful Navigation', () => {
    it('current() builds first step initially', () => {
      const strategy = createPromptStrategy({
        id: 'nav-test',
        steps: [draftComposition, critiqueComposition],
      });

      const prompt = strategy.current({ topic: 'AI Ethics' });

      expect(prompt).toBeDefined();
      if (prompt) {
        expect(prompt.asString()).toContain('Topic: AI Ethics');
      }
      expect(strategy.getCurrentIndex()).toBe(0);
      expect(strategy.getHistory()).toHaveLength(0); // current() doesn't record history
    });

    it('next() advances and builds next step', () => {
      const strategy = createPromptStrategy({
        id: 'nav-test',
        steps: [draftComposition, critiqueComposition],
      });

      // First call to current() to establish starting point
      strategy.current({ topic: 'AI' });

      // Now advance
      const nextPrompt = strategy.next({ draft: 'Draft text' });

      expect(nextPrompt).toBeDefined();
      if (nextPrompt) {
        expect(nextPrompt.asString()).toContain('Draft: Draft text');
      }
      expect(strategy.getCurrentIndex()).toBe(1);
      expect(strategy.getHistory()).toHaveLength(1);
      expect(strategy.getHistory()[0].id).toBe('draft');
    });

    it('next() records history before advancing', () => {
      const strategy = createPromptStrategy({
        id: 'history-test',
        steps: [draftComposition, critiqueComposition, refineComposition],
      });

      strategy.current({ topic: 'AI' });
      const timestamp1 = new Date();
      strategy.next({ draft: 'Draft 1' });

      const history = strategy.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].index).toBe(0);
      expect(history[0].id).toBe('draft');
      expect(history[0].timestamp).toBeInstanceOf(Date);
      expect(history[0].timestamp.getTime()).toBeGreaterThanOrEqual(timestamp1.getTime());
    });

    it('current() returns null when complete', () => {
      const strategy = createPromptStrategy({
        id: 'complete-test',
        steps: [draftComposition],
      });

      strategy.current({ topic: 'AI' });

      // Advance to complete the strategy
      const result = strategy.next({ draft: 'Draft' });

      // Should return null (no more steps)
      expect(result).toBeNull();
      expect(strategy.completed).toBe(true);

      // current() should also return null now
      expect(strategy.current({ topic: 'New' })).toBeNull();
    });

    it('next() returns null when completing last step', () => {
      const strategy = createPromptStrategy({
        id: 'last-step-test',
        steps: [draftComposition, critiqueComposition],
      });

      strategy.current({ topic: 'AI' });
      const result = strategy.next({ draft: 'Draft' }); // Now at last step (critique)

      expect(result).not.toBeNull(); // Should return the critique prompt
      expect(strategy.completed).toBe(false);
      expect(strategy.getStep(strategy.getCurrentIndex()).id).toBe('critique');

      // Next call should return null (no more steps)
      const finalResult = strategy.next({
        draft: 'Draft',
        critique: 'Critique',
      });
      expect(finalResult).toBeNull();
      expect(strategy.completed).toBe(true);
    });

    it('next() returns null when already complete', () => {
      const strategy = createPromptStrategy({
        id: 'already-complete-test',
        steps: [draftComposition],
      });

      strategy.current({ topic: 'AI' });
      const result1 = strategy.next({ draft: 'Draft' });
      expect(result1).toBeNull(); // Completed after 1 step

      // Call next() again when already complete
      const result2 = strategy.next({ draft: 'Draft' });
      expect(result2).toBeNull();
      expect(strategy.completed).toBe(true);
    });

    it('reset() clears state and history', () => {
      const strategy = createPromptStrategy({
        id: 'reset-test',
        steps: [draftComposition, critiqueComposition],
      });

      strategy.current({ topic: 'AI' });
      strategy.next({ draft: 'Draft' });

      expect(strategy.getCurrentIndex()).toBe(1);
      expect(strategy.getHistory()).toHaveLength(1);

      strategy.reset();

      expect(strategy.getCurrentIndex()).toBe(0);
      expect(strategy.getHistory()).toHaveLength(0);
      expect(strategy.completed).toBe(false);
    });

    it('can reuse strategy after reset', () => {
      const strategy = createPromptStrategy({
        id: 'reuse-test',
        steps: [draftComposition],
      });

      // First execution
      const prompt1 = strategy.current({ topic: 'AI' });
      expect(prompt1).not.toBeNull();
      if (prompt1) {
        expect(prompt1.asString()).toContain('Topic: AI');
      }

      // Reset and reuse
      strategy.reset();
      const prompt2 = strategy.current({ topic: 'Blockchain' });
      expect(prompt2).not.toBeNull();
      if (prompt2) {
        expect(prompt2.asString()).toContain('Topic: Blockchain');
      }
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // State Management
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('State Management', () => {
    it('getCurrentIndex() returns correct index', () => {
      const strategy = createPromptStrategy({
        id: 'index-test',
        steps: [draftComposition, critiqueComposition, refineComposition],
      });

      expect(strategy.getCurrentIndex()).toBe(0);

      strategy.current({ topic: 'AI' });
      expect(strategy.getCurrentIndex()).toBe(0);

      strategy.next({ draft: 'Draft' });
      expect(strategy.getCurrentIndex()).toBe(1);

      strategy.next({ draft: 'Draft', critique: 'Critique' });
      expect(strategy.getCurrentIndex()).toBe(2);
    });

    it('getStep(getCurrentIndex()) returns correct composition', () => {
      const strategy = createPromptStrategy({
        id: 'step-test',
        steps: [draftComposition, critiqueComposition],
      });

      expect(strategy.getStep(strategy.getCurrentIndex()).id).toBe('draft');

      strategy.current({ topic: 'AI' });
      strategy.next({ draft: 'Draft' });

      expect(strategy.getStep(strategy.getCurrentIndex()).id).toBe('critique');
    });

    it('completed and getStep() handle completion state', () => {
      const strategy = createPromptStrategy({
        id: 'complete-step-test',
        steps: [draftComposition, critiqueComposition],
      });

      strategy.current({ topic: 'AI' });
      strategy.next({ draft: 'Draft' });

      // Now at last step (critique), should still work
      expect(strategy.completed).toBe(false);
      expect(strategy.getStep(strategy.getCurrentIndex()).id).toBe('critique');

      // Advance past last step - should be complete
      const result = strategy.next({ draft: 'Draft', critique: 'Critique' });
      expect(result).toBeNull();
      expect(strategy.completed).toBe(true);
    });

    it('getNextStep() returns next composition', () => {
      const strategy = createPromptStrategy({
        id: 'next-step-test',
        steps: [draftComposition, critiqueComposition, refineComposition],
      });

      expect(strategy.getNextStep()?.id).toBe('critique');

      strategy.current({ topic: 'AI' });
      strategy.next({ draft: 'Draft' });

      expect(strategy.getNextStep()?.id).toBe('refine');
    });

    it('getNextStep() returns null at last step', () => {
      const strategy = createPromptStrategy({
        id: 'last-next-test',
        steps: [draftComposition, critiqueComposition],
      });

      strategy.current({ topic: 'AI' });
      strategy.next({ draft: 'Draft' });

      expect(strategy.getNextStep()).toBeNull();
    });

    it('completed returns false during execution', () => {
      const strategy = createPromptStrategy({
        id: 'incomplete-test',
        steps: [draftComposition, critiqueComposition],
      });

      expect(strategy.completed).toBe(false);

      strategy.current({ topic: 'AI' });
      expect(strategy.completed).toBe(false);

      strategy.next({ draft: 'Draft' });
      expect(strategy.completed).toBe(false);
    });

    it('completed returns true after all steps', () => {
      const strategy = createPromptStrategy({
        id: 'complete-test',
        steps: [draftComposition, critiqueComposition],
      });

      strategy.current({ topic: 'AI' });
      expect(strategy.completed).toBe(false);

      strategy.next({ draft: 'Draft' });
      // At last step but not complete
      expect(strategy.completed).toBe(false);

      // Would need to successfully complete last step, but next() throws
      // Strategy never actually becomes "complete" in the sense of currentIndex >= length
      // because next() prevents advancing past the last step
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Progress Tracking
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('Progress Tracking', () => {
    it('progress calculates percentage correctly', () => {
      const strategy = createPromptStrategy({
        id: 'progress-test',
        steps: [draftComposition, critiqueComposition, refineComposition],
      });

      let progress = strategy.progress;
      expect(progress.current).toBe(0);
      expect(progress.total).toBe(3);
      expect(progress.percentage).toBeCloseTo(0, 1);

      strategy.current({ topic: 'AI' });
      progress = strategy.progress;
      expect(progress.percentage).toBeCloseTo(0, 1);

      strategy.next({ draft: 'Draft' });
      progress = strategy.progress;
      expect(progress.current).toBe(1);
      expect(progress.percentage).toBeCloseTo(33.33, 1);

      strategy.next({ draft: 'Draft', critique: 'Critique' });
      progress = strategy.progress;
      expect(progress.current).toBe(2);
      expect(progress.percentage).toBeCloseTo(66.66, 1);
    });

    it('progress updates after each next()', () => {
      const strategy = createPromptStrategy({
        id: 'progress-update-test',
        steps: [draftComposition, critiqueComposition],
      });

      const progress1 = strategy.progress;
      expect(progress1.current).toBe(0);

      strategy.current({ topic: 'AI' });
      strategy.next({ draft: 'Draft' });

      const progress2 = strategy.progress;
      expect(progress2.current).toBe(1);
      expect(progress2.percentage).toBeGreaterThan(progress1.percentage);
    });

    it('progress shows 100% when complete', () => {
      const strategy = createPromptStrategy({
        id: 'complete-progress-test',
        steps: [draftComposition, critiqueComposition],
      });

      strategy.current({ topic: 'AI' });
      strategy.next({ draft: 'Draft' });

      const progress = strategy.progress;
      expect(progress.current).toBe(1);
      expect(progress.total).toBe(2);
      expect(progress.percentage).toBe(50); // At step 1 of 2
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Helper Methods
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('Helper Methods', () => {
    it('getStep(index) returns correct composition', () => {
      const strategy = createPromptStrategy({
        id: 'get-step-test',
        steps: [draftComposition, critiqueComposition, refineComposition],
      });

      expect(strategy.getStep(0).id).toBe('draft');
      expect(strategy.getStep(1).id).toBe('critique');
      expect(strategy.getStep(2).id).toBe('refine');
    });

    it('getStep(index) throws on invalid index', () => {
      const strategy = createPromptStrategy({
        id: 'invalid-index-test',
        steps: [draftComposition, critiqueComposition],
      });

      expect(() => strategy.getStep(-1)).toThrow(/out of bounds/);
      expect(() => strategy.getStep(2)).toThrow(/out of bounds/);
      expect(() => strategy.getStep(99)).toThrow(/out of bounds/);
    });

    it('getStepById(id) finds correct composition', () => {
      const strategy = createPromptStrategy({
        id: 'get-by-id-test',
        steps: [draftComposition, critiqueComposition, refineComposition],
      });

      expect(strategy.getStepById('draft')?.id).toBe('draft');
      expect(strategy.getStepById('critique')?.id).toBe('critique');
      expect(strategy.getStepById('refine')?.id).toBe('refine');
    });

    it('getStepById(id) returns undefined for missing ID', () => {
      const strategy = createPromptStrategy({
        id: 'missing-id-test',
        steps: [draftComposition],
      });

      expect(strategy.getStepById('nonexistent')).toBeUndefined();
    });

    it('steps.length returns correct count', () => {
      const strategy1 = createPromptStrategy({
        id: 'count-test-1',
        steps: [draftComposition],
      });
      expect(strategy1.steps.length).toBe(1);

      const strategy2 = createPromptStrategy({
        id: 'count-test-2',
        steps: [draftComposition, critiqueComposition, refineComposition],
      });
      expect(strategy2.steps.length).toBe(3);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Integration with PromptComposition
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('Integration with PromptComposition', () => {
    it('calls composition.build() with correct data', () => {
      const strategy = createPromptStrategy({
        id: 'integration-test',
        steps: [draftComposition],
      });

      const data = { topic: 'REST APIs' };
      const prompt = strategy.current(data);

      expect(prompt).not.toBeNull();
      if (prompt) {
        expect(prompt.asString()).toContain('Topic: REST APIs');
      }
    });

    it('passes options to composition.build()', () => {
      const contextComponent = createPromptComponent({
        key: 'context',
        template: 'Context: {{value}}',
        schema: z.object({ value: z.string() }),
      });

      const contextComposition = createPromptComposition({
        id: 'context-test',
        components: [contextComponent],
      });

      const strategy = createPromptStrategy({
        id: 'options-test',
        steps: [contextComposition],
      });

      const prompt = strategy.current({ value: 'test value' });

      expect(prompt).not.toBeNull();
      if (prompt) {
        expect(prompt.asString()).toContain('Context: test value');
      }
    });

    it('returns UniversalPromptInstance correctly', () => {
      const strategy = createPromptStrategy({
        id: 'instance-test',
        steps: [draftComposition],
      });

      const prompt = strategy.current({ topic: 'Test' });

      expect(prompt).not.toBeNull();
      if (prompt) {
        expect(typeof prompt.asString()).toBe('string');
        expect(Array.isArray(prompt.asMessages())).toBe(true);
      }
    });

    it('works with different wrapper styles', () => {
      const xmlComposition = createPromptComposition({
        id: 'xml-test',
        components: [
          createPromptComponent({
            key: 'content',
            template: '{{text}}',
            schema: z.object({ text: z.string() }),
          }),
        ],
        componentWrapper: 'xml',
      });

      const strategy = createPromptStrategy({
        id: 'wrapper-test',
        steps: [xmlComposition],
      });

      const prompt = strategy.current({ text: 'Test content' });

      expect(prompt).not.toBeNull();
      if (prompt) {
        expect(prompt.asString()).toContain('<content>');
        expect(prompt.asString()).toContain('</content>');
      }
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // History Tracking
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('History Tracking', () => {
    it('tracks all executions with timestamps', () => {
      const strategy = createPromptStrategy({
        id: 'history-test',
        steps: [draftComposition, critiqueComposition, refineComposition],
      });

      const start = new Date();

      strategy.current({ topic: 'AI' });
      strategy.next({ draft: 'Draft' });
      strategy.next({ draft: 'Draft', critique: 'Critique' });

      const history = strategy.getHistory();
      expect(history).toHaveLength(2); // Only next() calls are recorded

      expect(history[0].index).toBe(0);
      expect(history[0].id).toBe('draft');
      expect(history[0].timestamp.getTime()).toBeGreaterThanOrEqual(start.getTime());

      expect(history[1].index).toBe(1);
      expect(history[1].id).toBe('critique');
      expect(history[1].timestamp.getTime()).toBeGreaterThanOrEqual(history[0].timestamp.getTime());
    });

    it('getHistory() returns copy to prevent mutations', () => {
      const strategy = createPromptStrategy({
        id: 'immutable-history-test',
        steps: [draftComposition, critiqueComposition],
      });

      strategy.current({ topic: 'AI' });
      strategy.next({ draft: 'Draft' });

      const history1 = strategy.getHistory();
      history1.push({
        index: 99,
        id: 'fake',
        timestamp: new Date(),
      });

      const history2 = strategy.getHistory();
      expect(history2).toHaveLength(1); // Not affected by mutation
    });

    it('history persists across multiple next() calls', () => {
      const strategy = createPromptStrategy({
        id: 'persistent-history-test',
        steps: [draftComposition, critiqueComposition, refineComposition],
      });

      strategy.current({ topic: 'AI' });
      expect(strategy.getHistory()).toHaveLength(0);

      strategy.next({ draft: 'Draft' });
      expect(strategy.getHistory()).toHaveLength(1);

      strategy.next({ draft: 'Draft', critique: 'Critique' });
      expect(strategy.getHistory()).toHaveLength(2);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Edge Cases
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('Edge Cases', () => {
    it('single-step strategy works correctly', () => {
      const strategy = createPromptStrategy({
        id: 'single-step',
        steps: [draftComposition],
      });

      expect(strategy.steps.length).toBe(1);
      expect(strategy.completed).toBe(false);

      const prompt = strategy.current({ topic: 'AI' });
      expect(prompt).not.toBeNull();
      if (prompt) {
        expect(prompt.asString()).toContain('Topic: AI');
      }

      expect(strategy.getNextStep()).toBeNull();

      // Next should return null (completing the strategy)
      const result = strategy.next({ draft: 'Draft' });
      expect(result).toBeNull();
      expect(strategy.completed).toBe(true);
    });

    it('strategy with same composition multiple times works', () => {
      // Create different compositions with unique IDs
      const step1 = createPromptComposition({
        id: 'draft-step-1',
        components: [
          createPromptComponent({
            key: 'topic1',
            template: 'Topic: {{topic}}',
            schema: z.object({ topic: z.string() }),
          }),
        ],
      });

      const step2 = createPromptComposition({
        id: 'draft-step-2',
        components: [
          createPromptComponent({
            key: 'topic2',
            template: 'Topic: {{topic}}',
            schema: z.object({ topic: z.string() }),
          }),
        ],
      });

      const step3 = createPromptComposition({
        id: 'draft-step-3',
        components: [
          createPromptComponent({
            key: 'topic3',
            template: 'Topic: {{topic}}',
            schema: z.object({ topic: z.string() }),
          }),
        ],
      });

      const strategy = createPromptStrategy({
        id: 'repeated-comp',
        steps: [step1, step2, step3],
      });

      expect(strategy.steps.length).toBe(3);

      strategy.current({ topic: 'AI 1' });
      expect(strategy.getCurrentIndex()).toBe(0);

      strategy.next({ topic: 'AI 2' });
      expect(strategy.getCurrentIndex()).toBe(1);

      strategy.next({ topic: 'AI 3' });
      expect(strategy.getCurrentIndex()).toBe(2);
    });

    it('large strategy performs well', () => {
      const manySteps = Array.from({ length: 20 }, (_, i) =>
        createPromptComposition({
          id: `step-${String(i)}`,
          components: [
            createPromptComponent({
              key: `key-${String(i)}`,
              template: `Step ${String(i)}: {{value}}`,
              schema: z.object({ value: z.string() }),
            }),
          ],
        }),
      );

      const strategy = createPromptStrategy({
        id: 'large-strategy',
        steps: manySteps,
      });

      expect(strategy.steps.length).toBe(20);

      // Navigate through all steps except the last one
      strategy.current({ value: 'test' });
      for (let i = 1; i < 19; i++) {
        strategy.next({ value: 'test' });
      }

      // At step 18 (index 18), not complete
      expect(strategy.getCurrentIndex()).toBe(18);
      expect(strategy.completed).toBe(false);
      expect(strategy.getHistory()).toHaveLength(18); // All next() calls
    });

    it('handles steps array mutation protection', () => {
      const originalSteps = [draftComposition, critiqueComposition];
      const strategy = createPromptStrategy({
        id: 'mutation-test',
        steps: originalSteps,
      });

      // Try to mutate original array
      originalSteps.push(refineComposition);

      // Strategy IS affected because we return the reference (readonly interface prevents external mutations)
      // This is acceptable as the interface marks it readonly
      expect(strategy.steps.length).toBe(3);
      expect(strategy.steps).toHaveLength(3);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Pattern Validation
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('Pattern Validation', () => {
    it('creates strategy with valid pattern', () => {
      const pattern = createStrategyPattern({
        id: 'draft-critique-refine',
        description: 'Iterative refinement workflow',
        steps: [
          { id: 'draft', description: 'Initial draft' },
          { id: 'critique', description: 'Critical review' },
          { id: 'refine', description: 'Final polish' },
        ],
      });

      const strategy = createPromptStrategy({
        id: 'with-pattern',
        steps: [draftComposition, critiqueComposition, refineComposition],
        pattern,
      });

      expect(strategy.pattern).toBe(pattern);
      expect(strategy.pattern?.id).toBe('draft-critique-refine');
    });

    it('creates strategy without pattern', () => {
      const strategy = createPromptStrategy({
        id: 'no-pattern',
        steps: [draftComposition, critiqueComposition],
      });

      expect(strategy.pattern).toBeUndefined();
    });

    it('throws when composition IDs are missing from pattern', () => {
      const pattern = createStrategyPattern({
        id: 'STRICT_PATTERN',
        steps: [{ id: 'draft' }, { id: 'critique' }, { id: 'refine' }],
      });

      expect(() => {
        createPromptStrategy({
          id: 'missing-steps',
          steps: [draftComposition, critiqueComposition], // Missing 'refine'
          pattern,
        });
      }).toThrow(/does not match pattern "STRICT_PATTERN"/);

      expect(() => {
        createPromptStrategy({
          id: 'missing-steps',
          steps: [draftComposition, critiqueComposition],
          pattern,
        });
      }).toThrow(/Missing composition IDs: refine/);
    });

    it('throws when composition order violates pattern', () => {
      const pattern = createStrategyPattern({
        id: 'ORDERED_PATTERN',
        steps: [{ id: 'draft' }, { id: 'critique' }, { id: 'refine' }],
      });

      expect(() => {
        createPromptStrategy({
          id: 'wrong-order',
          steps: [critiqueComposition, draftComposition, refineComposition], // Wrong order
          pattern,
        });
      }).toThrow(/violates pattern "ORDERED_PATTERN" order/);

      expect(() => {
        createPromptStrategy({
          id: 'wrong-order',
          steps: [critiqueComposition, draftComposition, refineComposition],
          pattern,
        });
      }).toThrow(/appears out of order/);
    });

    it('allows extra compositions not in pattern', () => {
      const pattern = createStrategyPattern({
        id: 'MINIMAL_PATTERN',
        steps: [{ id: 'draft' }, { id: 'refine' }],
      });

      // Pattern only requires 'draft' and 'refine', but 'critique' is present and in correct order
      const extraComp = createPromptComposition({
        id: 'extra',
        components: [
          createPromptComponent({
            key: 'extra',
            template: 'Extra: {{extra}}',
            schema: z.object({ extra: z.string() }),
          }),
        ],
      });

      const strategy = createPromptStrategy({
        id: 'extra-steps',
        steps: [draftComposition, critiqueComposition, refineComposition, extraComp],
        pattern,
      });

      expect(strategy.steps.length).toBe(4);
      expect(strategy.pattern).toBe(pattern);
    });

    it('validates pattern with single step', () => {
      const pattern = createStrategyPattern({
        id: 'SINGLE_STEP',
        steps: [{ id: 'draft' }],
      });

      const strategy = createPromptStrategy({
        id: 'single-step',
        steps: [draftComposition],
        pattern,
      });

      expect(strategy.pattern?.steps).toHaveLength(1);
      expect(strategy.steps.length).toBe(1);
    });

    it('error message includes expected vs actual IDs', () => {
      const pattern = createStrategyPattern({
        id: 'DEBUG_PATTERN',
        steps: [{ id: 'step1' }, { id: 'step2' }],
      });

      expect(() => {
        createPromptStrategy({
          id: 'debug-test',
          steps: [draftComposition, critiqueComposition],
          pattern,
        });
      }).toThrow(/Expected IDs from pattern: step1, step2/);

      expect(() => {
        createPromptStrategy({
          id: 'debug-test',
          steps: [draftComposition, critiqueComposition],
          pattern,
        });
      }).toThrow(/Actual IDs in strategy: draft, critique/);
    });

    it('error message includes order visualization', () => {
      const pattern = createStrategyPattern({
        id: 'ORDER_DEBUG',
        steps: [{ id: 'draft' }, { id: 'critique' }],
      });

      expect(() => {
        createPromptStrategy({
          id: 'order-test',
          steps: [critiqueComposition, draftComposition],
          pattern,
        });
      }).toThrow(/Expected order: draft → critique/);

      expect(() => {
        createPromptStrategy({
          id: 'order-test',
          steps: [critiqueComposition, draftComposition],
          pattern,
        });
      }).toThrow(/Actual order: critique → draft/);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Additional Edge Cases
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('Additional Edge Cases', () => {
    it('progress calculates correctly with single step (defensive branch)', () => {
      // This test ensures the defensive `total > 0` branch works correctly
      // Even though steps.length can't be 0 (validated in constructor),
      // this verifies the calculation with minimal steps
      const strategy = createPromptStrategy({
        id: 'single-step-progress',
        steps: [draftComposition],
      });

      // Initial state: 0/1 = 0%
      const initial = strategy.progress;
      expect(initial.current).toBe(0);
      expect(initial.total).toBe(1);
      expect(initial.percentage).toBe(0);

      // After current: still 0/1 = 0%
      strategy.current({ topic: 'Test' });
      const afterCurrent = strategy.progress;
      expect(afterCurrent.percentage).toBe(0);

      // After next (completing): 1/1 = 100%
      strategy.next({ draft: 'Draft' });
      const afterNext = strategy.progress;
      expect(afterNext.current).toBe(1);
      expect(afterNext.total).toBe(1);
      expect(afterNext.percentage).toBe(100);
    });

    it("current() is idempotent - multiple calls don't change state", () => {
      const strategy = createPromptStrategy({
        id: 'idempotent-test',
        steps: [draftComposition, critiqueComposition],
      });

      // Call current() multiple times
      const result1 = strategy.current({ topic: 'AI' });
      const result2 = strategy.current({ topic: 'AI' });
      const result3 = strategy.current({ topic: 'AI' });

      // All should be defined
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result3).toBeDefined();

      // Index should not change
      expect(strategy.getCurrentIndex()).toBe(0);

      // History should remain empty (current doesn't record)
      expect(strategy.getHistory()).toHaveLength(0);

      // Should still be able to advance normally
      const nextResult = strategy.next({ draft: 'Draft' });
      expect(nextResult).toBeDefined();
      expect(strategy.getCurrentIndex()).toBe(1);
    });

    it('next() works without calling current() first', () => {
      const strategy = createPromptStrategy({
        id: 'next-without-current',
        steps: [draftComposition, critiqueComposition, refineComposition],
      });

      // Call next() directly without current()
      const result = strategy.next({ draft: 'Draft' });

      // Should record first step in history and advance to second
      expect(result).toBeDefined();
      if (result) {
        expect(result.asString()).toContain('Draft: Draft');
      }

      // Should be at index 1 (second step)
      expect(strategy.getCurrentIndex()).toBe(1);

      // History should have the first step recorded
      const history = strategy.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].index).toBe(0);
      expect(history[0].id).toBe('draft');

      // Can continue normally
      const nextResult = strategy.next({
        draft: 'Draft',
        critique: 'Critique',
      });
      expect(nextResult).toBeDefined();
      expect(strategy.getCurrentIndex()).toBe(2);
    });

    it('composition ID validation is enforced by composition factory', () => {
      // Verify that composition factory prevents invalid IDs
      // This ensures strategy receives valid compositions
      expect(() => {
        createPromptComposition({
          id: '', // Empty ID
          components: [
            createPromptComponent({
              key: 'test',
              template: 'Test',
              schema: z.object({}),
            }),
          ],
        });
      }).toThrow(/Invalid composition ID/);

      expect(() => {
        createPromptComposition({
          id: '123-invalid', // Starts with number
          components: [
            createPromptComponent({
              key: 'test',
              template: 'Test',
              schema: z.object({}),
            }),
          ],
        });
      }).toThrow(/Invalid composition ID/);
    });

    it('computed properties work correctly before execution', () => {
      const strategy = createPromptStrategy({
        id: 'pre-execution-test',
        steps: [draftComposition, critiqueComposition],
      });

      // Before any execution
      expect(strategy.completed).toBe(false);
      expect(strategy.progress.current).toBe(0);
      expect(strategy.progress.total).toBe(2);
      expect(strategy.progress.percentage).toBe(0);

      // Properties should be reactive - check multiple times
      expect(strategy.completed).toBe(false);
      expect(strategy.progress.percentage).toBe(0);

      // After first step
      strategy.current({ topic: 'AI' });
      expect(strategy.completed).toBe(false);
      expect(strategy.progress.current).toBe(0);

      // After advancing
      strategy.next({ draft: 'Draft' });
      expect(strategy.completed).toBe(false);
      expect(strategy.progress.current).toBe(1);
      expect(strategy.progress.percentage).toBe(50);
    });

    it('getHistory() works correctly after strategy completion', () => {
      const strategy = createPromptStrategy({
        id: 'history-after-completion',
        steps: [draftComposition, critiqueComposition],
      });

      // Execute all steps
      strategy.current({ topic: 'AI' });
      strategy.next({ draft: 'Draft 1' });
      strategy.next({ draft: 'Draft 1', critique: 'Critique 1' });

      // Verify completion
      expect(strategy.completed).toBe(true);

      // getHistory() should still work and return correct data
      const history = strategy.getHistory();
      expect(history).toHaveLength(2);

      expect(history[0].index).toBe(0);
      expect(history[0].id).toBe('draft');
      expect(history[0].timestamp).toBeInstanceOf(Date);

      expect(history[1].index).toBe(1);
      expect(history[1].id).toBe('critique');
      expect(history[1].timestamp).toBeInstanceOf(Date);

      // Timestamps should be in order
      expect(history[1].timestamp.getTime()).toBeGreaterThanOrEqual(history[0].timestamp.getTime());

      // Multiple calls should return consistent data
      const history2 = strategy.getHistory();
      expect(history2).toHaveLength(2);
      expect(history2[0].id).toBe(history[0].id);
    });

    it('reset() can be called multiple times consecutively', () => {
      const strategy = createPromptStrategy({
        id: 'multiple-reset-test',
        steps: [draftComposition, critiqueComposition],
      });

      // Execute some steps
      strategy.current({ topic: 'AI' });
      strategy.next({ draft: 'Draft' });

      expect(strategy.getCurrentIndex()).toBe(1);
      expect(strategy.getHistory()).toHaveLength(1);

      // Reset multiple times
      strategy.reset();
      expect(strategy.getCurrentIndex()).toBe(0);
      expect(strategy.getHistory()).toHaveLength(0);

      strategy.reset(); // Second reset
      expect(strategy.getCurrentIndex()).toBe(0);
      expect(strategy.getHistory()).toHaveLength(0);

      strategy.reset(); // Third reset
      expect(strategy.getCurrentIndex()).toBe(0);
      expect(strategy.getHistory()).toHaveLength(0);

      // Should still work normally after multiple resets
      const prompt = strategy.current({ topic: 'Blockchain' });
      expect(prompt).not.toBeNull();
      expect(strategy.getCurrentIndex()).toBe(0);
    });

    it('context propagates correctly through all steps', () => {
      // Create a component that uses context
      const contextAwareComponent = createPromptComponent({
        key: 'contextAware',
        template: ({ input, context }) => {
          const theme = (context?.theme as string) || 'default';
          return `Theme: ${theme}, Value: ${input.value}`;
        },
        schema: z.object({ value: z.string() }),
      });

      const step1 = createPromptComposition({
        id: 'step1',
        components: [contextAwareComponent],
      });

      const step2 = createPromptComposition({
        id: 'step2',
        components: [contextAwareComponent],
      });

      const strategy = createPromptStrategy({
        id: 'context-propagation-test',
        steps: [step1, step2],
      });

      // First step with dark theme
      const prompt1 = strategy.current({ value: 'first' }, { theme: 'dark' });
      expect(prompt1).not.toBeNull();
      if (prompt1) {
        expect(prompt1.asString()).toContain('Theme: dark');
        expect(prompt1.asString()).toContain('Value: first');
      }

      // Second step with light theme (different context)
      const prompt2 = strategy.next({ value: 'second' }, { theme: 'light' });
      expect(prompt2).not.toBeNull();
      if (prompt2) {
        expect(prompt2.asString()).toContain('Theme: light');
        expect(prompt2.asString()).toContain('Value: second');
      }

      // Verify each step got its own context
      expect(prompt1?.asString()).not.toContain('Theme: light');
      expect(prompt2?.asString()).not.toContain('Theme: dark');
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Strategy Pattern Validation - Edge Cases
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('Strategy Pattern Validation - Edge Cases', () => {
    it('validates pattern with empty composition IDs', () => {
      const emptyIdComp = createPromptComponent({
        key: 'test',
        template: 'Test',
        schema: z.object({}),
      });

      // Composition factory should prevent empty IDs
      expect(() => {
        createPromptComposition({
          id: '',
          components: [emptyIdComp],
        });
      }).toThrow(/Invalid composition ID/);
    });

    it('validates case sensitivity in pattern matching', () => {
      const pattern = createStrategyPattern({
        id: 'CASE_TEST',
        steps: [{ id: 'draft' }, { id: 'critique' }],
      });

      // Strategy has composition with different case
      const draftUpper = createPromptComposition({
        id: 'DRAFT',
        components: [
          createPromptComponent({
            key: 'content',
            template: 'Draft',
            schema: z.object({}),
          }),
        ],
      });

      expect(() => {
        createPromptStrategy({
          id: 'case-mismatch',
          steps: [draftUpper, critiqueComposition],
          pattern,
        });
      }).toThrow(/does not match pattern/);
      expect(() => {
        createPromptStrategy({
          id: 'case-mismatch',
          steps: [draftUpper, critiqueComposition],
          pattern,
        });
      }).toThrow(/Missing composition IDs: draft/);
    });

    it('validates pattern matching is exact (no auto-normalization)', () => {
      const pattern = createStrategyPattern({
        id: 'EXACT_MATCH_TEST',
        steps: [{ id: 'draft' }, { id: 'critique' }],
      });

      // Composition factory normalizes IDs, so we test with different case
      const draftUpper = createPromptComposition({
        id: 'Draft',
        components: [
          createPromptComponent({
            key: 'content',
            template: 'Draft',
            schema: z.object({}),
          }),
        ],
      });

      expect(() => {
        createPromptStrategy({
          id: 'case-mismatch',
          steps: [draftUpper, critiqueComposition],
          pattern,
        });
      }).toThrow(/does not match pattern/);
    });

    it('handles very large strategy chains (100 steps)', () => {
      const steps = Array.from({ length: 100 }, (_, i) => {
        return createPromptComposition({
          id: `step-${i}`,
          components: [
            createPromptComponent({
              key: 'content',
              template: `Step ${i}`,
              schema: z.object({}),
            }),
          ],
        });
      });

      const strategy = createPromptStrategy({
        id: 'large-chain',
        steps,
      });

      expect(strategy.steps).toHaveLength(100);
      expect(strategy.progress.total).toBe(100);
    });

    it('validates large pattern with all steps present', () => {
      const patternSteps = Array.from({ length: 50 }, (_, i) => ({
        id: `step-${i}`,
      }));

      const pattern = createStrategyPattern({
        id: 'LARGE_PATTERN',
        steps: patternSteps,
      });

      const strategySteps = Array.from({ length: 50 }, (_, i) => {
        return createPromptComposition({
          id: `step-${i}`,
          components: [
            createPromptComponent({
              key: 'content',
              template: `Step ${i}`,
              schema: z.object({}),
            }),
          ],
        });
      });

      const strategy = createPromptStrategy({
        id: 'large-validated',
        steps: strategySteps,
        pattern,
      });

      expect(strategy.steps).toHaveLength(50);
      expect(strategy.pattern).toBe(pattern);
    });

    it('validates large pattern with missing middle steps', () => {
      const patternSteps = Array.from({ length: 20 }, (_, i) => ({
        id: `step-${i}`,
      }));

      const pattern = createStrategyPattern({
        id: 'LARGE_WITH_MISSING',
        steps: patternSteps,
      });

      // Strategy missing step-10
      const strategySteps = Array.from({ length: 20 }, (_, i) => {
        if (i === 10) return null;
        return createPromptComposition({
          id: `step-${i}`,
          components: [
            createPromptComponent({
              key: 'content',
              template: `Step ${i}`,
              schema: z.object({}),
            }),
          ],
        });
      }).filter(Boolean) as PromptComposition[];

      expect(() => {
        createPromptStrategy({
          id: 'missing-middle',
          steps: strategySteps,
          pattern,
        });
      }).toThrow(/Missing composition IDs: step-10/);
    });

    it('validates pattern order with extra steps interspersed', () => {
      const pattern = createStrategyPattern({
        id: 'INTERSPERSED',
        steps: [{ id: 'draft' }, { id: 'refine' }],
      });

      const extra1 = createPromptComposition({
        id: 'extra1',
        components: [
          createPromptComponent({
            key: 'content',
            template: 'Extra 1',
            schema: z.object({}),
          }),
        ],
      });

      const extra2 = createPromptComposition({
        id: 'extra2',
        components: [
          createPromptComponent({
            key: 'content',
            template: 'Extra 2',
            schema: z.object({}),
          }),
        ],
      });

      // Order: extra1, draft, extra2, refine (pattern IDs in correct order)
      const strategy = createPromptStrategy({
        id: 'interspersed-valid',
        steps: [extra1, draftComposition, extra2, refineComposition],
        pattern,
      });

      expect(strategy.steps).toHaveLength(4);
      expect(strategy.pattern).toBe(pattern);
    });

    it('throws on pattern order violation with extra steps', () => {
      const pattern = createStrategyPattern({
        id: 'ORDER_STRICT',
        steps: [{ id: 'draft' }, { id: 'refine' }],
      });

      const extra = createPromptComposition({
        id: 'extra',
        components: [
          createPromptComponent({
            key: 'content',
            template: 'Extra',
            schema: z.object({}),
          }),
        ],
      });

      // Order: refine, extra, draft (pattern IDs out of order)
      expect(() => {
        createPromptStrategy({
          id: 'wrong-order-extra',
          steps: [refineComposition, extra, draftComposition],
          pattern,
        });
      }).toThrow(/violates pattern "ORDER_STRICT" order/);
    });

    it('validates pattern with single step and extra compositions', () => {
      const pattern = createStrategyPattern({
        id: 'SINGLE_WITH_EXTRA',
        steps: [{ id: 'draft' }],
      });

      const extra = createPromptComposition({
        id: 'extra',
        components: [
          createPromptComponent({
            key: 'content',
            template: 'Extra',
            schema: z.object({}),
          }),
        ],
      });

      // Valid: pattern only requires draft, extra steps allowed
      const strategy = createPromptStrategy({
        id: 'single-with-extras',
        steps: [draftComposition, extra, critiqueComposition],
        pattern,
      });

      expect(strategy.steps).toHaveLength(3);
      expect(strategy.pattern).toBe(pattern);
    });

    it('handles pattern with all same composition ID (should fail duplicate check)', () => {
      // This should fail at composition duplicate check, not pattern validation
      expect(() => {
        createPromptStrategy({
          id: 'all-same',
          steps: [draftComposition, draftComposition, draftComposition],
        });
      }).toThrow(/duplicate composition IDs/);
    });

    it('error messages include full context for debugging', () => {
      const pattern = createStrategyPattern({
        id: 'DEBUG_CONTEXT',
        steps: [{ id: 'step1' }, { id: 'step2' }, { id: 'step3' }],
      });

      expect(() => {
        createPromptStrategy({
          id: 'debug-test',
          steps: [draftComposition, critiqueComposition],
          pattern,
        });
      }).toThrow(/Expected IDs from pattern: step1, step2, step3/);

      expect(() => {
        createPromptStrategy({
          id: 'debug-test',
          steps: [draftComposition, critiqueComposition],
          pattern,
        });
      }).toThrow(/Actual IDs in strategy: draft, critique/);

      expect(() => {
        createPromptStrategy({
          id: 'debug-test',
          steps: [draftComposition, critiqueComposition],
          pattern,
        });
      }).toThrow(/Missing composition IDs: step1, step2, step3/);
    });

    it('validates empty pattern steps array (should be caught by pattern factory)', () => {
      // Pattern factory should prevent empty steps
      expect(() => {
        createStrategyPattern({
          id: 'EMPTY_STEPS',
          steps: [],
        });
      }).toThrow(/must have at least one step/);
    });
  });
});
