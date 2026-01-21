/**
 * Application Port: Parser Interface
 * Input adapter interface for parsing source code into AST and extracting metrics
 */

import type { Metric } from '../../domain/entities/Metric.js';

export interface ParseResult {
  /**
   * Array of metrics extracted from the source code
   */
  metrics: Metric[];

  /**
   * Indicates if parsing was successful
   */
  success: boolean;

  /**
   * Error message if parsing failed
   */
  error?: string;
}

export interface IParser {
  /**
   * Parse source code and extract metrics
   * 
   * @param filePath - Path to the file being parsed
   * @param content - Source code content
   */
  parse(filePath: string, content: string): Promise<ParseResult>;

  /**
   * Check if this parser supports a given file
   * 
   * @param filePath - Path to check
   */
  supports(filePath: string): boolean;
}
