/**
 * Application Service: Dependency Analyzer
 * Analyzes import/require statements to detect circular dependencies
 */

import * as ts from 'typescript';
import { resolve, dirname, join } from 'node:path';
import type { Metric } from '../../domain/entities/Metric.js';
import { MetricBuilder } from '../../domain/entities/Metric.js';

interface DependencyNode {
  filePath: string;
  imports: string[];
}

export class DependencyAnalyzer {
  private dependencyGraph: Map<string, DependencyNode> = new Map();

  /**
   * Analyze files for import statements and build dependency graph
   */
  analyzeDependencies(filePath: string, content: string): void {
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    const imports: string[] = [];

    // Extract import statements
    const visit = (node: ts.Node): void => {
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpecifier)) {
          const importPath = this.resolveImportPath(filePath, moduleSpecifier.text);
          if (importPath) {
            imports.push(importPath);
          }
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    this.dependencyGraph.set(filePath, {
      filePath,
      imports,
    });
  }

  /**
   * Detect circular dependencies using DFS
   */
  detectCircularDependencies(): Metric[] {
    const metrics: Metric[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles = new Set<string>(); // Track unique cycles

    const dfs = (filePath: string, path: string[]): void => {
      if (cycles.has(filePath)) return; // Already found this cycle
      
      visited.add(filePath);
      recursionStack.add(filePath);

      const node = this.dependencyGraph.get(filePath);
      if (!node) {
        recursionStack.delete(filePath);
        return;
      }

      for (const importPath of node.imports) {
        if (!visited.has(importPath)) {
          dfs(importPath, [...path, filePath]);
        } else if (recursionStack.has(importPath)) {
          // Found a cycle!
          const cycleStart = path.indexOf(importPath);
          if (cycleStart !== -1) {
            const cycle = [...path.slice(cycleStart), importPath];
            const cycleKey = [...cycle].sort().join('->');
            
            if (!cycles.has(cycleKey)) {
              cycles.add(cycleKey);
              
              // Create metric for this cycle
              metrics.push(
                new MetricBuilder()
                  .withName('circular-dependency')
                  .withValue(cycle.length)
                  .withFilePath(filePath)
                  .withContext(cycle.map(p => this.getFileName(p)).join(' → '))
                  .build()
              );
            }
          }
        }
      }

      recursionStack.delete(filePath);
    };

    // Check all nodes for cycles
    for (const filePath of this.dependencyGraph.keys()) {
      if (!visited.has(filePath)) {
        dfs(filePath, []);
      }
    }

    return metrics;
  }

  /**
   * Resolve relative import to absolute path
   */
  private resolveImportPath(fromFile: string, importSpecifier: string): string | null {
    // Skip node_modules and external packages
    if (!importSpecifier.startsWith('.')) {
      return null;
    }

    try {
      const dir = dirname(fromFile);
      let resolvedPath = resolve(dir, importSpecifier);

      // Try adding extensions if file doesn't exist
      const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.js'];
      for (const ext of extensions) {
        const pathWithExt = resolvedPath + ext;
        // We can't check if file exists in this context, so just normalize
        if (ext.startsWith('/')) {
          return resolvedPath + ext;
        }
      }

      return resolvedPath + '.ts'; // Default to .ts
    } catch {
      return null;
    }
  }

  /**
   * Get file name from path for display
   */
  private getFileName(filePath: string): string {
    const parts = filePath.split('/');
    return parts[parts.length - 1] ?? filePath;
  }

  /**
   * Clear the dependency graph (useful for new analysis)
   */
  clear(): void {
    this.dependencyGraph.clear();
  }
}
