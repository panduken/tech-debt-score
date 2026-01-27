/**
 * Application Configuration
 * Configuration for running code analysis
 */

export interface AnalysisConfig {
  /**
   * Root directory to analyze
   */
  rootPath: string;

  /**
   * File patterns to include (glob patterns)
   * Default: ['src/**\/*.ts', 'src/**\/*.js']
   */
  patterns: string[];

  /**
   * Patterns to ignore
   * Default: ['node_modules', 'dist', 'build', 'coverage', '.git']
   */
  ignore: string[];

  /**
   * Category weights for score calculation
   * Should sum to 1.0
   */
  weights?: {
    complexity: number;
    size: number;
    typeSafety: number;
    codeQuality: number;
    structure: number;
  };
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Omit<AnalysisConfig, 'rootPath'> = {
  patterns: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
  ignore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/.git/**',
    '**/.next/**',
    '**/out/**',
  ],
  weights: {
    complexity: 0.30,
    size: 0.25,
    typeSafety: 0.20,
    codeQuality: 0.15,
    structure: 0.10,
  },
};
