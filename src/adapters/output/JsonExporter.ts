/**
 * Output Adapter: JSON Exporter
 * Implements IReporter for JSON file output
 */

import { writeFile } from 'node:fs/promises';
import type { IReporter, AnalysisReport } from '../../application/ports/IReporter.js';

export class JsonExporter implements IReporter {
  constructor(private readonly outputPath: string = './tech-debt-report.json') {}

  async generate(report: AnalysisReport): Promise<void> {
    const jsonReport = {
      version: '1.0.0',
      generatedAt: report.metadata.timestamp.toISOString(),
      score: {
        overall: report.score.overall,
        categories: report.score.categories.map(cat => ({
          name: cat.name,
          score: cat.score,
          weight: cat.weight,
          description: cat.description,
        })),
      },
      findings: report.findings.map(finding => ({
        ruleId: finding.ruleId,
        severity: finding.severity,
        message: finding.message,
        filePath: finding.filePath,
        location: finding.location ? {
          startLine: finding.location.startLine,
          endLine: finding.location.endLine,
          startColumn: finding.location.startColumn,
          endColumn: finding.location.endColumn,
        } : undefined,
        suggestion: finding.suggestion,
      })),
      metadata: {
        filesAnalyzed: report.metadata.filesAnalyzed,
        durationMs: report.metadata.duration,
        timestamp: report.metadata.timestamp.toISOString(),
      },
    };

    await writeFile(this.outputPath, JSON.stringify(jsonReport, null, 2), 'utf-8');
    console.log(`💾 JSON report saved to: ${this.outputPath}`);
  }
}
