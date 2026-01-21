/**
 * Domain Entity: Score
 * Represents the technical debt score and category breakdowns
 */

export interface CategoryScore {
  /**
   * Category name (e.g., 'Complexity', 'Size', 'Type Safety')
   */
  name: string;

  /**
   * Score for this category (0-100, where 100 = no debt)
   */
  score: number;

  /**
   * Weight of this category in the overall score (0-1)
   */
  weight: number;

  /**
   * Optional description of what this category measures
   */
  description?: string;
}

export interface Score {
  /**
   * Overall technical debt score (0-100, where 100 = no debt)
   */
  overall: number;

  /**
   * Breakdown by category
   */
  categories: CategoryScore[];

  /**
   * When this score was calculated
   */
  timestamp: Date;

  /**
   * Optional metadata about the analysis
   */
  metadata?: {
    filesAnalyzed: number;
    totalMetrics: number;
    totalFindings: number;
  };
}

export class ScoreCalculator {
  /**
   * Calculate overall score from category scores
   * 
   * Formula: Σ(category_score × category_weight)
   */
  static calculateOverall(categories: CategoryScore[]): number {
    // Validate weights sum to 1.0 (or close to it)
    const totalWeight = categories.reduce((sum, cat) => sum + cat.weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      throw new Error(`Category weights must sum to 1.0, got ${totalWeight}`);
    }

    // Calculate weighted average
    const weightedSum = categories.reduce(
      (sum, cat) => sum + (cat.score * cat.weight),
      0
    );

    // Round to 2 decimal places
    return Math.round(weightedSum * 100) / 100;
  }

  /**
   * Normalize a raw value to 0-100 scale
   * 
   * @param value - The raw value to normalize
   * @param min - Minimum value (maps to 100)
   * @param max - Maximum value (maps to 0)
   * @param invert - If true, higher values = better score
   */
  static normalize(value: number, min: number, max: number, invert = false): number {
    if (value <= min) return invert ? 0 : 100;
    if (value >= max) return invert ? 100 : 0;

    const normalized = ((value - min) / (max - min)) * 100;
    const score = invert ? normalized : 100 - normalized;

    return Math.round(score * 100) / 100;
  }
}
