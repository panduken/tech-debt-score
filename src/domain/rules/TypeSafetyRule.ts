/**
 * Domain Rule: Type Safety Rule
 * Evaluates TypeScript type safety indicators
 */

import { BaseRule } from '../entities/Rule.js';
import type { Metric } from '../entities/Metric.js';
import type { Finding } from '../entities/Finding.js';
import { FindingBuilder } from '../entities/Finding.js';

export class TypeSafetyRule extends BaseRule {
  constructor() {
    super(
      'type-safety',
      'Type Safety Rule',
      'Evaluates TypeScript type safety by detecting usage of the `any` type'
    );
  }

  evaluate(metrics: Metric[]): Finding[] {
    const findings: Finding[] = [];

    const anyUsageMetrics = metrics.filter(m => m.name === 'any-usage');

    for (const metric of anyUsageMetrics) {
      if (metric.value > 0) {
        const builder = new FindingBuilder()
          .withRuleId(this.id)
          .withSeverity(metric.value > 5 ? 'high' : 'medium')
          .withMessage(
            `Found ${metric.value} usage(s) of 'any' type in ${metric.context || 'code'}`
          )
          .withFilePath(metric.filePath)
          .withSuggestion('Replace `any` with specific types or use `unknown` for better type safety');
        
        if (metric.location) {
          builder.withLocation(metric.location);
        }
        
        findings.push(builder.build());
      }
    }

    return findings;
  }

  calculateScore(findings: Finding[], context?: { totalFiles: number }): number {
    if (findings.length === 0) return 100;

    // Each 'any' usage reduces the score
    const totalAnyUsages = findings.reduce((sum, finding) => {
      // Extract count from message (hacky, but works for v1)
      const match = finding.message.match(/Found (\d+) usage/);
      return sum + (match ? parseInt(match[1] ?? '0', 10) : 1);
    }, 0);

    // Each 'any' costs 3 points
    const rawPenalty = totalAnyUsages * 3;
    
    let finalPenalty = rawPenalty;
    if (context && context.totalFiles > 0) {
      const density = rawPenalty / context.totalFiles;
      // Density of 3 (1 'any' per file) -> 3 * 1 = 3 penalty (97 score).
      // Density of 100 (complete lack of types) -> 100 penalty.
      finalPenalty = density * 1;
    } else {
      finalPenalty = Math.min(100, rawPenalty);
    }

    const score = Math.max(0, 100 - finalPenalty);
    return Math.round(score * 100) / 100;
  }
}
