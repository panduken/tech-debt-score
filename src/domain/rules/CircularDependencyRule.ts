/**
 * Domain Rule: Circular Dependency Rule
 * Detects circular dependencies between modules
 */

import { BaseRule } from '../entities/Rule.js';
import type { Metric } from '../entities/Metric.js';
import type { Finding } from '../entities/Finding.js';
import { FindingBuilder } from '../entities/Finding.js';

export class CircularDependencyRule extends BaseRule {
  constructor() {
    super(
      'circular-dependency',
      'Circular Dependency Rule',
      'Detects circular dependencies between modules that can cause maintenance issues'
    );
  }

  evaluate(metrics: Metric[]): Finding[] {
    const findings: Finding[] = [];

    // Find circular dependency metrics
    const circularDepMetrics = metrics.filter(m => m.name === 'circular-dependency');

    for (const metric of circularDepMetrics) {
      if (metric.value > 0) {
        // Extract cycle information from context
        const cycleLength = metric.value;
        const severity = cycleLength >= 4 ? 'high' : cycleLength >= 3 ? 'medium' : 'low';
        
        findings.push(
          new FindingBuilder()
            .withRuleId(this.id)
            .withSeverity(severity)
            .withMessage(
              `Circular dependency detected: ${metric.context || 'module cycle'} (${cycleLength} files in cycle)`
            )
            .withFilePath(metric.filePath)
            .withSuggestion('Refactor to break the circular dependency by introducing interfaces or dependency injection')
            .build()
        );
      }
    }

    return findings;
  }

  calculateScore(findings: Finding[], context?: { totalFiles: number }): number {
    if (findings.length === 0) return 100;

    // Circular dependencies are serious
    // Calculate raw penalty
    const rawPenalty = findings.reduce((sum, finding) => {
      switch (finding.severity) {
        case 'high': return sum + 20; // Very bad
        case 'medium': return sum + 12;
        case 'low': return sum + 6;
        default: return sum;
      }
    }, 0);

    // Normalize by project size if context is available
    let finalPenalty = rawPenalty;
    if (context && context.totalFiles > 0) {
      // Density: Penalty points per file
      const density = rawPenalty / context.totalFiles;
      
      // Scaling: 1 circular dep per 10 files is bad (density 2.0 -> score drop 40?)
      // Let's say density of 5 (1 high severity per 4 files) = 100% deduction
      finalPenalty = density * 20; 
    }

    const score = Math.max(0, 100 - finalPenalty);
    return Math.round(score * 100) / 100;
  }
}
