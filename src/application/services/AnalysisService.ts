/**
 * Application Service: Analysis Service
 * Orchestrates the entire code analysis workflow
 */

import type { IFileReader } from '../ports/IFileReader.js';
import type { IParser } from '../ports/IParser.js';
import type { IReporter, AnalysisReport } from '../ports/IReporter.js';
import type { AnalysisConfig } from '../config/AnalysisConfig.js';
import type { Rule } from '../../domain/entities/Rule.js';
import type { Metric } from '../../domain/entities/Metric.js';
import type { Finding } from '../../domain/entities/Finding.js';
import type { CategoryScore, Score } from '../../domain/entities/Score.js';
import { ScoreCalculator } from '../../domain/entities/Score.js';

export class AnalysisService {
  constructor(
    private readonly fileReader: IFileReader,
    private readonly parser: IParser,
    private readonly rules: Rule[],
    private readonly reporter: IReporter
  ) {}

  /**
   * Run the complete analysis workflow
   */
  async analyze(config: AnalysisConfig): Promise<AnalysisReport> {
    const startTime = Date.now();

    // 1. Scan for files
    console.log('📁 Scanning files...');
    const filePaths = await this.fileReader.scan(
      config.rootPath,
      config.patterns,
      config.ignore
    );

    if (filePaths.length === 0) {
      console.log('   ❌ No files found matching patterns.');
      console.log(`      Root: ${config.rootPath}`);
      console.log(`      Patterns: ${config.patterns.join(', ')}`);
      console.log('      Check your directory structure and ensure files exist.');
    } else {
      console.log(`   Found ${filePaths.length} files`);
    }

    // 2. Read and parse files
    console.log('🔍 Parsing files...');
    const allMetrics: Metric[] = [];
    const fileContents = new Map<string, string>();
    
    let supportedFilesCount = 0;
    for (const filePath of filePaths) {
      try {
        const fileResult = await this.fileReader.read(filePath);
        fileContents.set(filePath, fileResult.content);
        
        if (this.parser.supports(filePath)) {
          supportedFilesCount++;
          const parseResult = await this.parser.parse(filePath, fileResult.content);
          if (parseResult.success) {
            allMetrics.push(...parseResult.metrics);
          } else {
            console.warn(`   ⚠️  Failed to parse ${filePath}: ${parseResult.error}`);
          }
        }
      } catch (err) {
        console.warn(`   ⚠️  Error reading ${filePath}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    
    if (filePaths.length > 0 && supportedFilesCount === 0) {
      console.log('   ⚠️  None of the found files are supported by the parser (.ts, .js, etc)');
    }
    
    console.log(`   Extracted ${allMetrics.length} metrics from ${supportedFilesCount} files`);

    // 3. Analyze dependencies and duplication
    console.log('🔗 Analyzing dependencies and duplication...');
    const additionalMetrics = await this.analyzeAdvancedMetrics(fileContents);
    allMetrics.push(...additionalMetrics);
    console.log(`   Added ${additionalMetrics.length} advanced metrics`);

    // 4. Apply rules and collect findings
    console.log('📊 Applying rules...');
    const allFindings: Finding[] = [];
    const rawCategoryScores: CategoryScore[] = [];

    for (const rule of this.rules) {
      const findings = rule.evaluate(allMetrics);
      allFindings.push(...findings);
      
      const score = rule.calculateScore(findings);
      rawCategoryScores.push({
        name: rule.name,
        score,
        weight: this.getCategoryWeight(rule.id, config),
        description: rule.description,
      });
    }
    console.log(`   Generated ${allFindings.length} findings`);

    // Normalize weights to sum to 1.0 (in case not all categories are active)
    const categoryScores = this.normalizeWeights(rawCategoryScores);

    // 5. Calculate overall score
    console.log('🎯 Calculating score...');
    const overallScore = ScoreCalculator.calculateOverall(categoryScores);

    const finalScore: Score = {
      overall: overallScore,
      categories: categoryScores,
      timestamp: new Date(),
      metadata: {
        filesAnalyzed: filePaths.length,
        totalMetrics: allMetrics.length,
        totalFindings: allFindings.length,
      },
    };

    // 6. Prepare report
    const duration = Date.now() - startTime;
    const report: AnalysisReport = {
      score: finalScore,
      findings: allFindings,
      metadata: {
        filesAnalyzed: filePaths.length,
        duration,
        timestamp: new Date(),
      },
    };

    // 7. Generate output
    console.log('📋 Generating report...');
    await this.reporter.generate(report);

    return report;
  }

  /**
   * Analyze dependencies and code duplication
   */
  private async analyzeAdvancedMetrics(fileContents: Map<string, string>): Promise<Metric[]> {
    const { DependencyAnalyzer } = await import('./DependencyAnalyzer.js');
    const { DuplicationDetector } = await import('./DuplicationDetector.js');
    
    const depAnalyzer = new DependencyAnalyzer();
    const dupDetector = new DuplicationDetector();
    const metrics: Metric[] = [];

    // Analyze all files
    for (const [filePath, content] of fileContents.entries()) {
      if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || 
          filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
        depAnalyzer.analyzeDependencies(filePath, content);
        dupDetector.analyzeFile(filePath, content);
      }
    }

    // Detect circular dependencies
    const circularDeps = depAnalyzer.detectCircularDependencies();
    metrics.push(...circularDeps);

    // Detect code duplication
    const duplicates = dupDetector.detectDuplicates();
    metrics.push(...duplicates);

    return metrics;
  }

  private getCategoryWeight(ruleId: string, config: AnalysisConfig): number {
    const weights = config.weights ?? {
      complexity: 0.30,
      size: 0.25,
      typeSafety: 0.20,
      codeQuality: 0.15,
      structure: 0.10,
    };

    switch (ruleId) {
      case 'complexity':
        return weights.complexity;
      case 'size':
        return weights.size;
      case 'type-safety':
        return weights.typeSafety;
      case 'duplication':
        return weights.codeQuality;
      case 'circular-dependency':
        return weights.structure;
      default:
        return 0.05; // Default weight for unknown categories
    }
  }

  /**
   * Normalize weights so they sum to 1.0
   * This handles cases where not all categories are active
   */
  private normalizeWeights(categories: CategoryScore[]): CategoryScore[] {
    const totalWeight = categories.reduce((sum, cat) => sum + cat.weight, 0);
    
    if (totalWeight === 0) {
      // If all weights are 0, distribute evenly
      const evenWeight = 1.0 / categories.length;
      return categories.map(cat => ({
        ...cat,
        weight: evenWeight,
      }));
    }

    // Normalize proportionally
    return categories.map(cat => ({
      ...cat,
      weight: cat.weight / totalWeight,
    }));
  }
}
