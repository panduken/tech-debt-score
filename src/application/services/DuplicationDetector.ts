/**
 * Application Service: Code Duplication Detector
 * Detects duplicate code blocks using token-based similarity
 */

import * as ts from 'typescript';
import { createHash } from 'node:crypto';
import type { Metric } from '../../domain/entities/Metric.js';
import { MetricBuilder } from '../../domain/entities/Metric.js';

interface CodeBlock {
  filePath: string;
  hash: string;
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
    this.analyzeSourceFile(sourceFile);
  }

  /**
   * Analyze an existing SourceFile
   */
  analyzeSourceFile(sourceFile: ts.SourceFile): void {
    const filePath = sourceFile.fileName;

    // Extract function bodies as code blocks
    const visit = (node: ts.Node): void => {
      if (this.isFunctionNode(node)) {
        const block = this.extractCodeBlock(sourceFile, filePath, node);
        if (block) {
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
    // Group blocks by hash
    const hashMap = new Map<string, CodeBlock[]>();

    for (const block of this.codeBlocks) {
      const existing = hashMap.get(block.hash) || [];
      existing.push(block);
      hashMap.set(block.hash, existing);
    }

    // Find groups with > 1 element
    for (const [hash, blocks] of hashMap.entries()) {
      if (blocks.length > 1) {
        // We found duplicates!
        // To avoid exploding metrics, we report each instance as a duplication
        // For the first instance, we can say it duplicates the others? 
        // Or simpler: For EACH block in the group, report it as a duplicate of the group.
        
        for (const block of blocks) {
          metrics.push(
            new MetricBuilder()
              .withName('code-duplication')
              .withValue(blocks.length - 1) // Number of OTHER copies
              .withFilePath(block.filePath)
              .withContext(block.functionName || 'code block')
              .withLocation({
                startLine: block.startLine,
                endLine: block.endLine,
                startColumn: 0,
                endColumn: 0,
              })
              .build()
          );
        }
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
    // Tokenize the code (simple whitespace normalization)
    const text = node.getText(sourceFile);
    const tokens = this.tokenize(text);

    // Check minimum size requirement (approximate token count check)
    if (tokens.length < this.MIN_BLOCK_SIZE) {
      return null;
    }

    const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
    
    // Compute hash
    const hash = createHash('md5').update(tokens).digest('hex');

    return {
      filePath,
      hash,
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
