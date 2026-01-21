/**
 * Domain Entity: Finding
 * Represents an identified issue or code smell in the codebase
 */

import type { SourceLocation, Severity } from '../../shared/types.js';

export interface Finding {
  /**
   * ID of the rule that generated this finding
   */
  ruleId: string;

  /**
   * Severity level of the issue
   */
  severity: Severity;

  /**
   * Human-readable message describing the issue
   */
  message: string;

  /**
   * File path where the issue was found
   */
  filePath: string;

  /**
   * Optional exact location in the source code
   */
  location?: SourceLocation;

  /**
   * Optional suggestion for fixing the issue
   */
  suggestion?: string;
}

export class FindingBuilder {
  private finding: Partial<Finding> = {};

  withRuleId(ruleId: string): this {
    this.finding.ruleId = ruleId;
    return this;
  }

  withSeverity(severity: Severity): this {
    this.finding.severity = severity;
    return this;
  }

  withMessage(message: string): this {
    this.finding.message = message;
    return this;
  }

  withFilePath(filePath: string): this {
    this.finding.filePath = filePath;
    return this;
  }

  withLocation(location: SourceLocation): this {
    this.finding.location = location;
    return this;
  }

  withSuggestion(suggestion: string): this {
    this.finding.suggestion = suggestion;
    return this;
  }

  build(): Finding {
    if (!this.finding.ruleId || !this.finding.severity || !this.finding.message || !this.finding.filePath) {
      throw new Error('Finding requires ruleId, severity, message, and filePath');
    }
    return this.finding as Finding;
  }
}
