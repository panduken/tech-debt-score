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
  
  // Very simple CLI for v1 - just run analysis
  // Future: Use commander or yargs for better CLI handling
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const rootPath = args[0] ?? process.cwd();
  
  try {
    await analyzeCommand(rootPath);
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

For more information, visit:
https://github.com/panduken/tech-debt-score
  `);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
