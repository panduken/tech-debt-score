/**
 * Shared type definitions used across the application
 */

export interface SourceLocation {
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
}

export type Severity = 'low' | 'medium' | 'high';

export interface FileMetadata {
  path: string;
  size: number;
  linesOfCode: number;
}
