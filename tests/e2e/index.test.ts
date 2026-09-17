import { describe, expect, it } from 'vitest';
import { TypeScriptParser } from '../../src/adapters/input/TypeScriptParser.js';

describe('TypeScript parser integration', () => {
  it('extracts AST metrics from a TypeScript file', async () => {
    const parser = new TypeScriptParser();
    const result = await parser.parse('sample.ts', `function calculate(value: any) {
      if (value) return value;
      return 0;
    }`);
    expect(parser.supports('sample.ts')).toBe(true);
    expect(result.success).toBe(true);
    expect(result.metrics.some(metric => metric.name === 'cyclomatic-complexity')).toBe(true);
    expect(result.metrics.some(metric => metric.name === 'any-usage')).toBe(true);
  });
});
