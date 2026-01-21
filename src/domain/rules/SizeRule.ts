/**
 * Domain Rule: Size Rule
 * Evaluates file and function size metrics
 */

import { BaseRule } from '../entities/Rule.js';
import type { Metric } from '../entities/Metric.js';
import type { Finding } from '../entities/Finding.js';
import { FindingBuilder } from '../entities/Finding.js';

export class SizeRule extends BaseRule {
  // Thresholds (configurable in future versions)
  private readonly MAX_FILE_LINES = 300;
  private readonly MAX_FUNCTION_LINES = 50;
  private readonly MAX_PARAMETERS = 5;

  constructor() {
    super(
      'size',
      'Size Rule',
      'Evaluates file and function size to identify overly large code units'
    );
  }

  evaluate(metrics: Metric[]): Finding[] {
    const findings: Finding[] = [];

    const sizeMetrics = metrics.filter(
      m => m.name === 'file-length' || m.name === 'function-length' || m.name === 'parameter-count'
    );

    for (const metric of sizeMetrics) {
      if (metric.name === 'file-length' && metric.value > this.MAX_FILE_LINES) {
        findings.push(
          new FindingBuilder()
            .withRuleId(this.id)
            .withSeverity(metric.value > 500 ? 'high' : 'medium')
            .withMessage(`Large file (${metric.value} lines)`)
            .withFilePath(metric.filePath)
            .withSuggestion('Consider splitting this file into smaller, more focused modules')
            .build()
        );
      }

      if (metric.name === 'function-length' && metric.value > this.MAX_FUNCTION_LINES) {
        const builder = new FindingBuilder()
          .withRuleId(this.id)
          .withSeverity(metric.value > 100 ? 'high' : 'medium')
          .withMessage(
            `Large function (${metric.value} lines) in ${metric.context || 'unknown'}`
          )
          .withFilePath(metric.filePath)
          .withSuggestion('Break this function into smaller, single-purpose functions');
        
        if (metric.location) {
          builder.withLocation(metric.location);
        }
        
        findings.push(builder.build());
      }

      if (metric.name === 'parameter-count' && metric.value > this.MAX_PARAMETERS) {
        const builder = new FindingBuilder()
          .withRuleId(this.id)
          .withSeverity('medium')
          .withMessage(
            `Too many parameters (${metric.value}) in ${metric.context || 'function'}`
          )
          .withFilePath(metric.filePath)
          .withSuggestion('Consider using an options object or builder pattern');
        
        if (metric.location) {
          builder.withLocation(metric.location);
        }
        
        findings.push(builder.build());
      }
    }

    return findings;
  }

  calculateScore(findings: Finding[]): number {
    if (findings.length === 0) return 100;

    const penalty = findings.reduce((sum, finding) => {
      switch (finding.severity) {
        case 'high': return sum + 8;
        case 'medium': return sum + 4;
        case 'low': return sum + 2;
        default: return sum;
      }
    }, 0);

    const score = Math.max(0, 100 - penalty);
    return Math.round(score * 100) / 100;
  }
}
