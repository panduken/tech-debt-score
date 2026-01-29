/**
 * Domain Rule: Complexity Rule
 * Evaluates cyclomatic complexity and nesting depth
 */

import { BaseRule } from '../entities/Rule.js';
import type { Metric } from '../entities/Metric.js';
import type { Finding } from '../entities/Finding.js';
import { FindingBuilder } from '../entities/Finding.js';

export class ComplexityRule extends BaseRule {
  // Thresholds (configurable in future versions)
  private readonly COMPLEXITY_THRESHOLD = 10;
  private readonly NESTING_THRESHOLD = 4;

  constructor() {
    super(
      'complexity',
      'Complexity Rule',
      'Evaluates cyclomatic complexity and nesting depth to identify overly complex code'
    );
  }

  evaluate(metrics: Metric[]): Finding[] {
    const findings: Finding[] = [];

    // Filter for complexity-related metrics
    const complexityMetrics = metrics.filter(
      m => m.name === 'cyclomatic-complexity' || m.name === 'nesting-depth'
    );

    for (const metric of complexityMetrics) {
      if (metric.name === 'cyclomatic-complexity' && metric.value > this.COMPLEXITY_THRESHOLD) {
        const builder = new FindingBuilder()
          .withRuleId(this.id)
          .withSeverity(metric.value > 20 ? 'high' : 'medium')
          .withMessage(
            `High cyclomatic complexity (${metric.value}) in ${metric.context || 'function'}`
          )
          .withFilePath(metric.filePath)
          .withSuggestion('Consider breaking this function into smaller, more focused functions');
        
        if (metric.location) {
          builder.withLocation(metric.location);
        }
        
        findings.push(builder.build());
      }

      if (metric.name === 'nesting-depth' && metric.value > this.NESTING_THRESHOLD) {
        const builder = new FindingBuilder()
          .withRuleId(this.id)
          .withSeverity(metric.value > 6 ? 'high' : 'medium')
          .withMessage(
            `Deep nesting (${metric.value} levels) in ${metric.context || 'function'}`
          )
          .withFilePath(metric.filePath)
          .withSuggestion('Reduce nesting by using early returns or extracting functions');
        
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

    // Penalty based on severity
    const rawPenalty = findings.reduce((sum, finding) => {
      switch (finding.severity) {
        case 'high': return sum + 10;
        case 'medium': return sum + 5;
        case 'low': return sum + 2;
        default: return sum;
      }
    }, 0);

    // Normalize by project size if context is available
    let finalPenalty = rawPenalty;
    if (context && context.totalFiles > 0) {
      // Density: Penalty points per file
      const density = rawPenalty / context.totalFiles;
      
      // Scaling: 
      // If every file has medium complexity (5 pts), density is 5.
      // We want that to be maybe 50% score? So multiply by 10.
      // If every file has high complexity (10 pts), density 10 -> score 0?
      finalPenalty = density * 10;
    }

    // Cap the penalty and invert to get score
    const score = Math.max(0, 100 - finalPenalty);
    return Math.round(score * 100) / 100;
  }
}
