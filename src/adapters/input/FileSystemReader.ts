/**
 * Input Adapter: File System Reader
 * Implements IFileReader using Node.js filesystem
 */

import { readFile } from 'node:fs/promises';
import { stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import fg from 'fast-glob';
import type { IFileReader, FileReadResult } from '../../application/ports/IFileReader.js';

export class FileSystemReader implements IFileReader {
  async scan(rootPath: string, patterns: string[], ignore: string[]): Promise<string[]> {
    // Resolve the root path to absolute
    const absoluteRoot = resolve(rootPath);

    // Convert patterns to absolute paths relative to root
    const absolutePatterns = patterns.map(pattern => 
      join(absoluteRoot, pattern)
    );

    // Scan for files matching patterns
    const files = await fg(absolutePatterns, {
      ignore,
      absolute: true,
      onlyFiles: true,
      dot: false, // Don't include hidden files by default
    });

    return files;
  }

  async read(filePath: string): Promise<FileReadResult> {
    const content = await readFile(filePath, 'utf-8');
    const stats = await stat(filePath);
    const lines = content.split('\n');

    return {
      content,
      metadata: {
        path: filePath,
        size: stats.size,
        linesOfCode: lines.length,
      },
    };
  }

  async readBatch(filePaths: string[]): Promise<FileReadResult[]> {
    return Promise.all(filePaths.map(path => this.read(path)));
  }
}
