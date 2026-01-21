/**
 * Application Port: File Reader Interface
 * Input adapter interface for reading files from the filesystem
 */

import type { FileMetadata } from '../../shared/types.js';

export interface FileReadResult {
  content: string;
  metadata: FileMetadata;
}

export interface IFileReader {
  /**
   * Scan a directory and return matching file paths
   * 
   * @param rootPath - Root directory to scan
   * @param patterns - Glob patterns to match (e.g., ['src/**\/*.ts'])
   * @param ignore - Patterns to ignore (e.g., ['node_modules', 'dist'])
   */
  scan(rootPath: string, patterns: string[], ignore: string[]): Promise<string[]>;

  /**
   * Read a single file and return its content
   * 
   * @param filePath - Absolute path to the file
   */
  read(filePath: string): Promise<FileReadResult>;

  /**
   * Read multiple files in batch
   * 
   * @param filePaths - Array of absolute file paths
   */
  readBatch(filePaths: string[]): Promise<FileReadResult[]>;
}
