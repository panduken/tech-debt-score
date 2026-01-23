#!/usr/bin/env node
/**
 * CLI Entry Point
 * Command-line interface for tech-debt-score
 * 
 * NO BUSINESS LOGIC HERE - just argument parsing and delegation
 */

import { analyzeCommand } from './commands/analyze.js';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  // Parse arguments
  let rootPath = process.cwd();
  let jsonOutputPath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;

    if (arg === '--json' || arg === '-j') {
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith('-')) {
        jsonOutputPath = nextArg;
        i++; // Skip next arg
      }
    } else if (!arg.startsWith('-')) {
      rootPath = arg;
    }
  }
  
  try {
    await analyzeCommand(rootPath, jsonOutputPath);
    process.exit(0);
  } catch (error) {
    console.error('❌ Analysis failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
┌─────────────────────────────────────────────┐
│  tech-debt-score - Quantify Technical Debt  │
│  Built by developers, for developers        │
└─────────────────────────────────────────────┘

Usage:
  tech-debt-score [path]

Arguments:
  path              Path to analyze (default: current directory)

Options:
  -h, --help        Show this help message

Examples:
  tech-debt-score                    # Analyze current directory
  tech-debt-score ./my-project       # Analyze specific directory
  tech-debt-score /path/to/code      # Analyze absolute path

Options:
  -h, --help            Show this help message
  -j, --json <file>     Output JSON report to specific file


For more information, visit:
https://github.com/panduken/tech-debt-score
  `);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
