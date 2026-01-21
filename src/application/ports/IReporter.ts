/**
 * Application Port: Reporter Interface
 * Output adapter interface for reporting analysis results
 */

import type { Score } from '../../domain/entities/Score.js';
import type { Finding } from '../../domain/entities/Finding.js';

export interface AnalysisReport {
  score: Score;
  findings: Finding[];
  metadata: {
    filesAnalyzed: number;
    duration: number;
    timestamp: Date;
  };
}

export interface IReporter {
  /**
   * Generate and output a report
   * 
   * @param report - The analysis report data
   */
  generate(report: AnalysisReport): Promise<void>;
}
