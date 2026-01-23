import { resolve } from 'node:path';
import { AnalysisService } from '../../application/services/AnalysisService.js';
import { FileSystemReader } from '../../adapters/input/FileSystemReader.js';
import { TypeScriptParser } from '../../adapters/input/TypeScriptParser.js';
import { TerminalReporter } from '../../adapters/output/TerminalReporter.js';
import { JsonExporter } from '../../adapters/output/JsonExporter.js';
import type { IReporter, AnalysisReport } from '../../application/ports/IReporter.js';

import { ComplexityRule } from '../../domain/rules/ComplexityRule.js';
import { SizeRule } from '../../domain/rules/SizeRule.js';
import { TypeSafetyRule } from '../../domain/rules/TypeSafetyRule.js';
import { DuplicationRule } from '../../domain/rules/DuplicationRule.js';
import { CircularDependencyRule } from '../../domain/rules/CircularDependencyRule.js';
import { DEFAULT_CONFIG } from '../../application/config/AnalysisConfig.js';
import type { AnalysisConfig } from '../../application/config/AnalysisConfig.js';

// Helper to broadcast to multiple reporters
class CompositeReporter implements IReporter {
  constructor(private reporters: IReporter[]) {}
  
  async generate(report: AnalysisReport): Promise<void> {
    await Promise.all(this.reporters.map(r => r.generate(report)));
  }
}

export async function analyzeCommand(rootPath: string, jsonOutputPath?: string): Promise<void> {
  console.log('🚀 Starting technical debt analysis...\n');

  // Wiring: Create all adapters and services (dependency injection)
  const fileReader = new FileSystemReader();
  const parser = new TypeScriptParser();
  
  // Use both terminal and JSON reporters
  const reporter = new CompositeReporter([
    new TerminalReporter(),
    new JsonExporter(jsonOutputPath)
  ]);
  
  const rules = [
    // ... rules

    new ComplexityRule(),
    new SizeRule(),
    new TypeSafetyRule(),
    new DuplicationRule(),
    new CircularDependencyRule(),
  ];

  const analysisService = new AnalysisService(
    fileReader,
    parser,
    rules,
    reporter
  );

  // Build configuration
  // Smart pattern detection:
  // - If scanning CWD, default to looking in 'src/'
  // - If scanning a specific directory (e.g. ./src), look for files inside it
  const isCwd = resolve(rootPath) === process.cwd();
  
  const defaultPatterns = isCwd 
    ? DEFAULT_CONFIG.patterns 
    : ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'];

  const config: AnalysisConfig = {
    rootPath,
    ...DEFAULT_CONFIG,
    patterns: defaultPatterns,
  };

  // Execute analysis
  await analysisService.analyze(config);
  
  console.log('✅ Analysis complete!\n');
}
