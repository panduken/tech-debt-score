/**
 * Output Adapter: Terminal Reporter
 * Implements IReporter for console output
 */

import type { IReporter, AnalysisReport } from '../../application/ports/IReporter.js';

export class TerminalReporter implements IReporter {
  async generate(report: AnalysisReport): Promise<void> {
    console.log('\n');
    console.log('═'.repeat(60));
    console.log('  TECHNICAL DEBT SCORE REPORT');
    console.log('═'.repeat(60));
    console.log('\n');

    // Overall Score
    const scoreColor = this.getScoreColor(report.score.overall);
    console.log(`📊 Overall Score: ${scoreColor}${report.score.overall.toFixed(1)}/100${this.reset()}`);
    console.log(this.getScoreLabel(report.score.overall));
    console.log('\n');

    // Category Breakdown
    console.log('📈 Category Breakdown:');
    console.log('─'.repeat(60));
    for (const category of report.score.categories) {
      const bar = this.createBar(category.score);
      const weight = (category.weight * 100).toFixed(0);
      console.log(`  ${category.name.padEnd(20)} ${bar} ${category.score.toFixed(1)} (${weight}%)`);
    }
    console.log('\n');

    // Summary Statistics
    console.log('📋 Analysis Summary:');
    console.log('─'.repeat(60));
    console.log(`  Files Analyzed:    ${report.metadata.filesAnalyzed}`);
    console.log(`  Total Findings:    ${report.findings.length}`);
    console.log(`  Duration:          ${(report.metadata.duration / 1000).toFixed(2)}s`);
    console.log(`  Timestamp:         ${report.metadata.timestamp.toISOString()}`);
    console.log('\n');

    // Top Issues
    if (report.findings.length > 0) {
      console.log('⚠️  Top Issues:');
      console.log('─'.repeat(60));
      const topFindings = report.findings
        .sort((a, b) => {
          const severityOrder = { high: 0, medium: 1, low: 2 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        })
        .slice(0, 10);

      for (const finding of topFindings) {
        const icon = finding.severity === 'high' ? '🔴' : finding.severity === 'medium' ? '🟡' : '🟢';
        console.log(`  ${icon} ${finding.message}`);
        console.log(`     ${finding.filePath}${finding.location ? `:${finding.location.startLine}` : ''}`);
      }
      console.log('\n');
    }

    console.log('═'.repeat(60));
    console.log('\n');
  }

  private createBar(score: number, length = 20): string {
    const filled = Math.round((score / 100) * length);
    const empty = length - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
  }

  private getScoreColor(score: number): string {
    // ANSI color codes (placeholder - could use chalk library)
    if (score >= 80) return '\x1b[32m'; // Green
    if (score >= 60) return '\x1b[33m'; // Yellow
    return '\x1b[31m'; // Red
  }

  private reset(): string {
    return '\x1b[0m';
  }

  private getScoreLabel(score: number): string {
    if (score >= 90) return '   ✨ Excellent - Very low technical debt';
    if (score >= 80) return '   ✅ Good - Manageable technical debt';
    if (score >= 60) return '   ⚠️  Fair - Moderate technical debt';
    if (score >= 40) return '   ❗ Poor - High technical debt';
    return '   🚨 Critical - Very high technical debt';
  }
}
