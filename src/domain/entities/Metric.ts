/**
 * Domain Entity: Metric
 * Represents a single measurement extracted from code analysis
 */

import type { SourceLocation } from '../../shared/types.js';

export interface Metric {
  /**
   * Unique identifier for the metric type
   * e.g., 'cyclomatic-complexity', 'function-length', 'any-usage'
   */
  name: string;

  /**
   * The measured value
   */
  value: number;

  /**
   * File path where this metric was measured
   */
  filePath: string;

  /**
   * Optional location in the source code
   */
  location?: SourceLocation;

  /**
   * Optional context (e.g., function name, class name)
   */
  context?: string;
}

export class MetricBuilder {
  private metric: Partial<Metric> = {};

  withName(name: string): this {
    this.metric.name = name;
    return this;
  }

  withValue(value: number): this {
    this.metric.value = value;
    return this;
  }

  withFilePath(filePath: string): this {
    this.metric.filePath = filePath;
    return this;
  }

  withLocation(location: SourceLocation): this {
    this.metric.location = location;
    return this;
  }

  withContext(context: string): this {
    this.metric.context = context;
    return this;
  }

  build(): Metric {
    if (!this.metric.name || this.metric.value === undefined || !this.metric.filePath) {
      throw new Error('Metric requires name, value, and filePath');
    }
    return this.metric as Metric;
  }
}
