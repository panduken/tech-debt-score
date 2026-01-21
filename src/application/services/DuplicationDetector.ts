/**
 * Application Service: Code Duplication Detector
 * Detects duplicate code blocks using token-based similarity
 */

import * as ts from 'typescript';
import type { Metric } from '../../domain/entities/Metric.js';
import { MetricBuilder } from '../../domain/entities/Metric.js';

interface CodeBlock {
  filePath: string;
  tokens: string;
  startLine: number;
  endLine: number;
  functionName?: string | undefined;
}

export class DuplicationDetector {
  private codeBlocks: CodeBlock[] = [];
  private readonly MIN_BLOCK_SIZE = 50; // Minimum token count

  /**
   * Analyze file for code blocks
   */
  analyzeFile(filePath: string, content: string): void {
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    // Extract function bodies as code blocks
    const visit = (node: ts.Node): void => {
      if (this.isFunctionNode(node)) {
        const block = this.extractCodeBlock(sourceFile, filePath, node);
        if (block && block.tokens.length >= this.MIN_BLOCK_SIZE) {
          this.codeBlocks.push(block);
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  /**
   * Detect duplicates across all analyzed files
   */
  detectDuplicates(): Metric[] {
    const metrics: Metric[] = [];
    const seen = new Set<number>();

    for (let i = 0; i < this.codeBlocks.length; i++) {
      if (seen.has(i)) continue;

      const block1 = this.codeBlocks[i];
      if (!block1) continue;

      let duplicateCount = 0;

      for (let j = i + 1; j < this.codeBlocks.length; j++) {
        if (seen.has(j)) continue;

        const block2 = this.codeBlocks[j];
        if (!block2) continue;

        const similarity = this.calculateSimilarity(block1.tokens, block2.tokens);

        if (similarity >= 0.85) { // 85% similarity threshold
          duplicateCount++;
          seen.add(j);
        }
      }

      if (duplicateCount > 0) {
        metrics.push(
          new MetricBuilder()
            .withName('code-duplication')
            .withValue(duplicateCount)
            .withFilePath(block1.filePath)
            .withContext(block1.functionName || 'code block')
            .withLocation({
              startLine: block1.startLine,
              endLine: block1.endLine,
              startColumn: 0,
              endColumn: 0,
            })
            .build()
        );
      }
    }

    return metrics;
  }

  /**
   * Extract code block from function node
   */
  private extractCodeBlock(
    sourceFile: ts.SourceFile,
    filePath: string,
    node: ts.Node
  ): CodeBlock | null {
    const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());

    // Tokenize the code (simple whitespace normalization)
    const text = node.getText(sourceFile);
    const tokens = this.tokenize(text);

    return {
      filePath,
      tokens,
      startLine: start.line + 1,
      endLine: end.line + 1,
      functionName: this.getFunctionName(node),
    };
  }

  /**
   * Simple tokenization (normalize whitespace)
   */
  private tokenize(code: string): string {
    return code
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*/g, '') // Remove line comments
      .trim();
  }

  /**
   * Calculate similarity between two token strings
   */
  private calculateSimilarity(tokens1: string, tokens2: string): number {
    if (tokens1 === tokens2) return 1.0;

    // Use Levenshtein distance for similarity
    const len1 = tokens1.length;
    const len2 = tokens2.length;
    const maxLen = Math.max(len1, len2);

    if (maxLen === 0) return 1.0;

    const distance = this.levenshteinDistance(tokens1, tokens2);
    return 1 - distance / maxLen;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0]![j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j]! + 1, // deletion
          matrix[i]![j - 1]! + 1, // insertion
          matrix[i - 1]![j - 1]! + cost // substitution
        );
      }
    }

    return matrix[len1]![len2]!;
  }

  /**
   * Check if node is a function
   */
  private isFunctionNode(node: ts.Node): boolean {
    return ts.isFunctionDeclaration(node) ||
           ts.isMethodDeclaration(node) ||
           ts.isArrowFunction(node) ||
           ts.isFunctionExpression(node);
  }

  /**
   * Get function name for context
   */
  private getFunctionName(node: ts.Node): string | undefined {
    if (ts.isFunctionDeclaration(node) && node.name) {
      return node.name.getText();
    } else if (ts.isMethodDeclaration(node) && node.name) {
      return node.name.getText();
    }
    return undefined;
  }

  /**
   * Clear stored blocks
   */
  clear(): void {
    this.codeBlocks = [];
  }
}
