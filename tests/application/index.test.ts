import { describe, expect, it, vi } from 'vitest';
import { AnalysisService } from '../../src/application/services/AnalysisService.js';
import type { IFileReader } from '../../src/application/ports/IFileReader.js';
import type { IParser } from '../../src/application/ports/IParser.js';
import type { IReporter } from '../../src/application/ports/IReporter.js';
import type { Rule } from '../../src/domain/entities/Rule.js';

describe('AnalysisService', () => {
  it('orchestrates analysis and reporting', async () => {
    const files = ['/repo/a.ts', '/repo/b.ts'];
    const reader: IFileReader = {
      scan: vi.fn().mockResolvedValue(files),
      read: vi.fn().mockResolvedValue({ content: 'export const x = 1;', metadata: {
        path: files[0]!, size: 20, linesOfCode: 1,
      }}), readBatch: vi.fn(),
    };
    const parser: IParser = {
      supports: vi.fn().mockReturnValue(true),
      parse: vi.fn().mockResolvedValue({ success: true, metrics: [
        { name: 'file-length', value: 10, filePath: files[0]! },
      ]}),
    };
    const rule: Rule = {
      id: 'complexity', name: 'Test Rule', description: 'test',
      evaluate: vi.fn().mockReturnValue([]), calculateScore: vi.fn().mockReturnValue(100),
    };
    const reporter: IReporter = { generate: vi.fn() };
    const result = await new AnalysisService(reader, parser, [rule], reporter).analyze({
      rootPath: '/repo', patterns: ['**/*.ts'], ignore: [],
      weights: { complexity: 1, size: 0, typeSafety: 0, codeQuality: 0, structure: 0 },
    });
    expect(reader.scan).toHaveBeenCalledWith('/repo', ['**/*.ts'], []);
    expect(parser.parse).toHaveBeenCalledTimes(2);
    expect(rule.evaluate).toHaveBeenCalled();
    expect(result.score.overall).toBe(100);
    expect(result.metadata.filesAnalyzed).toBe(2);
    expect(reporter.generate).toHaveBeenCalledWith(result);
  });
});
