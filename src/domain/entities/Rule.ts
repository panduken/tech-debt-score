/**
 * Domain Entity: Rule
 * Represents an evaluation rule that processes metrics and generates findings
 */

import type { Metric } from './Metric.js';
import type { Finding } from './Finding.js';

export interface ScoreContext {
  totalFiles: number;
}

export interface Rule {
  /**
   * Unique identifier for this rule
   */
  id: string;

  /**
   * Human-readable name
   */
  name: string;

  /**
   * Description of what this rule evaluates
   */
  description: string;

  /**
   * Evaluate metrics and produce findings
   */
  evaluate(metrics: Metric[]): Finding[];

  /**
   * Calculate a score (0-100) based on findings
   * where 100 = no issues, 0 = maximum issues
   */
  calculateScore(findings: Finding[], context?: ScoreContext): number;
}

/**
 * Abstract base class for rules
 */
export abstract class BaseRule implements Rule {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string
  ) {}

  abstract evaluate(metrics: Metric[]): Finding[];
  abstract calculateScore(findings: Finding[], context?: ScoreContext): number;
}
