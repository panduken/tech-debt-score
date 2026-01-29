/**
 * Domain Rule: Code Duplication Rule
 * Detects duplicate code blocks using token-based similarity
 */

import { BaseRule } from '../entities/Rule.js';
import type { Metric } from '../entities/Metric.js';
import type { Finding } from '../entities/Finding.js';
import { FindingBuilder } from '../entities/Finding.js';

export class DuplicationRule extends BaseRule {
  // Thresholds
  private readonly MIN_DUPLICATE_TOKENS = 50; // Minimum tokens to consider as duplication
  private readonly SIMILARITY_THRESHOLD = 0.95; // 95% similarity

  constructor() {
    super(
      'duplication',
      'Code Duplication Rule',
      'Detects duplicate or highly similar code blocks across the codebase'
    );
  }

  evaluate(metrics: Metric[]): Finding[] {
    const findings: Finding[] = [];

    // Group metrics by type
    const duplicationMetrics = metrics.filter(m => m.name === 'code-duplication');

    for (const metric of duplicationMetrics) {
      if (metric.value > 0) {
        const severity = metric.value > 5 ? 'high' : metric.value > 2 ? 'medium' : 'low';
        
        const builder = new FindingBuilder()
          .withRuleId(this.id)
          .withSeverity(severity)
          .withMessage(
            `Found ${metric.value} duplicate code block(s) in ${metric.context || 'file'}`
          )
          .withFilePath(metric.filePath)
          .withSuggestion('Extract duplicate code into reusable functions or modules');
        
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

    // Each duplication finding reduces score
    const rawPenalty = findings.reduce((sum, finding) => {
      switch (finding.severity) {
        case 'high': return sum + 15;
        case 'medium': return sum + 8;
        case 'low': return sum + 4;
        default: return sum;
      }
    }, 0);

    let finalPenalty = rawPenalty;
    if (context && context.totalFiles > 0) {
      const density = rawPenalty / context.totalFiles;
      // If every file has low duplication (4pts), density 4.
      // 4 * 8 = 32 penalty (Score 68). Reasonable.
      finalPenalty = density * 8;
    }

    const score = Math.max(0, 100 - finalPenalty);
    return Math.round(score * 100) / 100;
  }
}
