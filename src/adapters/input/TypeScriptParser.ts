/**
 * Input Adapter: TypeScript/JavaScript Parser
 * Implements IParser using TypeScript Compiler API for AST-based analysis
 */

import * as ts from 'typescript';
import type { IParser, ParseResult } from '../../application/ports/IParser.js';
import type { Metric } from '../../domain/entities/Metric.js';
import { MetricBuilder } from '../../domain/entities/Metric.js';
import type { SourceLocation } from '../../shared/types.js';

/**
 * Helper class to extract metrics from AST nodes
 */
class MetricExtractor {
  private metrics: Metric[] = [];
  
  constructor(
    private sourceFile: ts.SourceFile,
    private filePath: string
  ) {}

  /**
   * Node types that contribute to cyclomatic complexity
   */
  private static readonly COMPLEXITY_KINDS = new Set<ts.SyntaxKind>([
    ts.SyntaxKind.IfStatement,
    ts.SyntaxKind.ForStatement,
    ts.SyntaxKind.ForInStatement,
    ts.SyntaxKind.ForOfStatement,
    ts.SyntaxKind.WhileStatement,
    ts.SyntaxKind.DoStatement,
    ts.SyntaxKind.CaseClause,
    ts.SyntaxKind.ConditionalExpression,
    ts.SyntaxKind.CatchClause,
  ]);

  /**
   * Node types that contribute to nesting depth
   */
  private static readonly NESTING_KINDS = new Set<ts.SyntaxKind>([
    ts.SyntaxKind.Block,
    ts.SyntaxKind.IfStatement,
    ts.SyntaxKind.ForStatement,
    ts.SyntaxKind.ForInStatement,
    ts.SyntaxKind.ForOfStatement,
    ts.SyntaxKind.WhileStatement,
    ts.SyntaxKind.DoStatement,
    ts.SyntaxKind.SwitchStatement,
    ts.SyntaxKind.TryStatement,
  ]);

  /**
   * Extract all metrics from the source file
   */
  extract(): Metric[] {
    this.metrics = [];
    
    // File-level metrics
    this.extractFileMetrics();
    
    // Function-level metrics
    this.visit(this.sourceFile);
    
    return this.metrics;
  }

  /**
   * Extract file-level metrics
   */
  private extractFileMetrics(): void {
    const lines = this.sourceFile.getLineStarts();
    const lineCount = lines.length;
    
    // File length metric
    this.metrics.push(
      new MetricBuilder()
        .withName('file-length')
        .withValue(lineCount)
        .withFilePath(this.filePath)
        .build()
    );

    // Count TODO/FIXME comments
    const text = this.sourceFile.getFullText();
    const todoCount = (text.match(/\/\/\s*TODO/gi) || []).length + 
                     (text.match(/\/\*[\s\S]*?TODO[\s\S]*?\*\//gi) || []).length;
    const fixmeCount = (text.match(/\/\/\s*FIXME/gi) || []).length + 
                      (text.match(/\/\*[\s\S]*?FIXME[\s\S]*?\*\//gi) || []).length;
    
    if (todoCount > 0) {
      this.metrics.push(
        new MetricBuilder()
          .withName('todo-comments')
          .withValue(todoCount)
          .withFilePath(this.filePath)
          .build()
      );
    }
    
    if (fixmeCount > 0) {
      this.metrics.push(
        new MetricBuilder()
          .withName('fixme-comments')
          .withValue(fixmeCount)
          .withFilePath(this.filePath)
          .build()
      );
    }
  }

  /**
   * Visit AST nodes recursively
   */
  private visit(node: ts.Node): void {
    // Check if this is a function node
    if (this.isFunctionNode(node)) {
      this.extractFunctionMetrics(node as ts.FunctionLikeDeclaration);
    }

    // Recurse to children
    ts.forEachChild(node, (child) => this.visit(child));
  }

  /**
   * Check if node is a function-like declaration
   */
  private isFunctionNode(node: ts.Node): boolean {
    return ts.isFunctionDeclaration(node) ||
           ts.isMethodDeclaration(node) ||
           ts.isArrowFunction(node) ||
           ts.isFunctionExpression(node) ||
           ts.isConstructorDeclaration(node);
  }

  /**
   * Extract metrics from a function node
   */
  private extractFunctionMetrics(node: ts.FunctionLikeDeclaration): void {
    const functionName = this.getFunctionName(node);
    const location = this.getLocation(node);
    
    // Function length
    const startLine = this.sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
    const endLine = this.sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
    const functionLength = endLine - startLine + 1;
    
    this.metrics.push(
      new MetricBuilder()
        .withName('function-length')
        .withValue(functionLength)
        .withFilePath(this.filePath)
        .withContext(functionName)
        .withLocation(location)
        .build()
    );

    // Parameter count
    const paramCount = node.parameters.length;
    if (paramCount > 0) {
      this.metrics.push(
        new MetricBuilder()
          .withName('parameter-count')
          .withValue(paramCount)
          .withFilePath(this.filePath)
          .withContext(functionName)
          .withLocation(location)
          .build()
      );
    }

    // Cyclomatic complexity
    const complexity = this.calculateComplexity(node);
    this.metrics.push(
      new MetricBuilder()
        .withName('cyclomatic-complexity')
        .withValue(complexity)
        .withFilePath(this.filePath)
        .withContext(functionName)
        .withLocation(location)
        .build()
    );

    // Nesting depth
    const maxDepth = this.calculateNestingDepth(node);
    if (maxDepth > 0) {
      this.metrics.push(
        new MetricBuilder()
          .withName('nesting-depth')
          .withValue(maxDepth)
          .withFilePath(this.filePath)
          .withContext(functionName)
          .withLocation(location)
          .build()
      );
    }

    // Count 'any' usage in function signature
    const anyCount = this.countAnyUsage(node);
    if (anyCount > 0) {
      this.metrics.push(
        new MetricBuilder()
          .withName('any-usage')
          .withValue(anyCount)
          .withFilePath(this.filePath)
          .withContext(functionName)
          .withLocation(location)
          .build()
      );
    }
  }

  /**
   * Calculate cyclomatic complexity
   * Formula: Number of decision points + 1
   */
  private calculateComplexity(node: ts.Node): number {
    let complexity = 1; // Base complexity

    const countDecisionPoints = (n: ts.Node): void => {
      if (MetricExtractor.COMPLEXITY_KINDS.has(n.kind)) {
        complexity++;
      } else if (ts.isBinaryExpression(n)) {
        // Logical operators && and ||
        const op = n.operatorToken.kind;
        if (op === ts.SyntaxKind.AmpersandAmpersandToken ||
            op === ts.SyntaxKind.BarBarToken) {
          complexity++;
        }
      }

      ts.forEachChild(n, countDecisionPoints);
    };

    countDecisionPoints(node);
    return complexity;
  }

  /**
   * Calculate maximum nesting depth
   */
  private calculateNestingDepth(node: ts.Node): number {
    let maxDepth = 0;

    const traverse = (n: ts.Node, depth: number): void => {
      let currentDepth = depth;

      // Increment depth for nesting constructs using the static registry
      if (MetricExtractor.NESTING_KINDS.has(n.kind)) {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      }

      ts.forEachChild(n, (child) => traverse(child, currentDepth));
    };

    traverse(node, 0);
    return maxDepth;
  }

  /**
   * Count 'any' type usage in function signature
   */
  private countAnyUsage(node: ts.FunctionLikeDeclaration): number {
    let count = 0;

    // Check parameters
    for (const param of node.parameters) {
      if (param.type && this.isAnyType(param.type)) {
        count++;
      }
    }

    // Check return type
    if (node.type && this.isAnyType(node.type)) {
      count++;
    }

    return count;
  }

  /**
   * Check if a type node represents 'any'
   */
  private isAnyType(typeNode: ts.TypeNode): boolean {
    return typeNode.kind === ts.SyntaxKind.AnyKeyword;
  }

  /**
   * Get function name for context
   */
  private getFunctionName(node: ts.FunctionLikeDeclaration): string {
    if (ts.isFunctionDeclaration(node) && node.name) {
      return node.name.getText();
    } else if (ts.isMethodDeclaration(node) && node.name) {
      return node.name.getText();
    } else if (ts.isConstructorDeclaration(node)) {
      return 'constructor';
    }
    return 'anonymous function';
  }

  /**
   * Get source location from node
   */
  private getLocation(node: ts.Node): SourceLocation {
    const start = this.sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const end = this.sourceFile.getLineAndCharacterOfPosition(node.getEnd());
    
    return {
      startLine: start.line + 1,
      endLine: end.line + 1,
      startColumn: start.character,
      endColumn: end.character,
    };
  }
}

/**
 * TypeScript Parser using native TypeScript Compiler API
 */
export class TypeScriptParser implements IParser {
  supports(filePath: string): boolean {
    return filePath.endsWith('.ts') || 
           filePath.endsWith('.tsx') || 
           filePath.endsWith('.js') || 
           filePath.endsWith('.jsx');
  }

  async parse(filePath: string, content: string): Promise<ParseResult> {
    try {
      // Create source file from content
      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true, // setParentNodes
        this.getScriptKind(filePath)
      );

      // Extract metrics using AST traversal
      const extractor = new MetricExtractor(sourceFile, filePath);
      const metrics = extractor.extract();

      return {
        metrics,
        success: true,
      };
    } catch (error) {
      return {
        metrics: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parsing error',
      };
    }
  }

  /**
   * Determine script kind from file extension
   */
  private getScriptKind(filePath: string): ts.ScriptKind {
    if (filePath.endsWith('.tsx')) return ts.ScriptKind.TSX;
    if (filePath.endsWith('.jsx')) return ts.ScriptKind.JSX;
    if (filePath.endsWith('.ts')) return ts.ScriptKind.TS;
    return ts.ScriptKind.JS;
  }
}
