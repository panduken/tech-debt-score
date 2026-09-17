import { describe, expect, it } from 'vitest';
import { FindingBuilder } from '../../src/domain/entities/Finding.js';
import { MetricBuilder } from '../../src/domain/entities/Metric.js';
import { ScoreCalculator } from '../../src/domain/entities/Score.js';
import { ComplexityRule } from '../../src/domain/rules/ComplexityRule.js';
import { SizeRule } from '../../src/domain/rules/SizeRule.js';
import { TypeSafetyRule } from '../../src/domain/rules/TypeSafetyRule.js';
import { DuplicationRule } from '../../src/domain/rules/DuplicationRule.js';
import { CircularDependencyRule } from '../../src/domain/rules/CircularDependencyRule.js';

const metric = (name: string, value: number, context = 'example') => new MetricBuilder()
  .withName(name).withValue(value).withFilePath('src/example.ts').withContext(context).build();

describe('ScoreCalculator', () => {
  it('calculates weighted scores', () => expect(ScoreCalculator.calculateOverall([
    { name: 'A', score: 80, weight: 0.25 }, { name: 'B', score: 100, weight: 0.75 },
  ])).toBe(95));
  it('normalizes and clamps values', () => {
    expect(ScoreCalculator.normalize(50, 0, 100)).toBe(50);
    expect(ScoreCalculator.normalize(-1, 0, 100)).toBe(100);
    expect(ScoreCalculator.normalize(101, 0, 100, true)).toBe(100);
  });
});

describe('entity builders', () => {
  it('build valid entities', () => {
    expect(metric('file-length', 10).value).toBe(10);
    expect(new FindingBuilder().withRuleId('size').withSeverity('medium').withMessage('Large file')
      .withFilePath('src/example.ts').build()).toMatchObject({ ruleId: 'size', severity: 'medium' });
  });
  it('reject incomplete entities', () => {
    expect(() => new MetricBuilder().withName('x').withValue(1).build()).toThrow();
    expect(() => new FindingBuilder().withRuleId('x').build()).toThrow();
  });
});

describe('domain rules', () => {
  it('finds complexity and nesting violations', () => {
    const findings = new ComplexityRule().evaluate([
      metric('cyclomatic-complexity', 11, 'complex'), metric('nesting-depth', 7, 'nested'),
    ]);
    expect(findings).toHaveLength(2);
    expect(findings.map(f => f.severity)).toEqual(['medium', 'high']);
  });
  it('finds size violations', () => expect(new SizeRule().evaluate([
    metric('file-length', 301), metric('function-length', 51, 'fn'), metric('parameter-count', 6, 'fn'),
  ])).toHaveLength(3));
  it('finds any usage and applies density scoring', () => {
    const rule = new TypeSafetyRule(); const findings = rule.evaluate([metric('any-usage', 2, 'fn')]);
    expect(findings).toHaveLength(1); expect(rule.calculateScore(findings, { totalFiles: 2 })).toBe(97);
  });
  it('finds duplication and circular dependencies', () => {
    expect(new DuplicationRule().evaluate([metric('code-duplication', 1)])).toHaveLength(1);
    expect(new CircularDependencyRule().evaluate([metric('circular-dependency', 3)])).toHaveLength(1);
  });
});
