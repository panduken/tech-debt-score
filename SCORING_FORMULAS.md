# Technical Debt Scoring Formulas

This document explains the mathematical formulas used to calculate the Technical Debt Score.

## Core Philosophy: Density-Based Scoring

To ensure fair scoring across repositories of all sizes (from small libraries to massive monorepos), we use **Density-Based Scoring**. We measure the _concentration_ of issues per file rather than the total number of issues.

### Global Formula

$$
\text{Final Score} = 100 - \sum(\text{Category Penalties})
$$

Where each Category Penalty is calculated as:

$$
\text{Category Penalty} = \left( \frac{\text{Total Severity Points}}{\text{Total Files Analyzed}} \right) \times \text{Scale Factor}
$$

The result is clamped between 0 and 100.

---

## Rule Scale Factors

Each rule assigns "Severity Points" to issues (High=8-20, Medium=4-12, Low=2-6) and then applies a specific multiplier (Scale Factor) to the density.

| Rule Category     | Scale Factor | Reason                                                                                             |
| ----------------- | :----------- | -------------------------------------------------------------------------------------------------- |
| **Complexity**    | **x 2**      | High complexity is common in legacy code; a lower factor prevents aggressive 0.0 scores.           |
| **Size**          | **x 2**      | Large files are bad, but ubiquitous. Lower factor prevents punishing valid large modules too hard. |
| **Type Safety**   | **x 1**      | TypeScript `any` usage is a "death by a thousand cuts". A 1:1 penalty is strict enough.            |
| **Duplication**   | **x 3**      | Code duplication is dead weight. Penalized slightly more heavily than size.                        |
| **Circular Deps** | **x 10**     | Circular dependencies are architectural flaws. Penalized very heavily.                             |

---

## Worked Example

Imagine a **Monorepo** with **1,000 files**.

### Scenario: Average Technical Debt

The scan finds **2,000 Issues** (avg 2 per file), mostly Medium severity (~5 pts each).

1.  **Total Severity Points**: $2,000 \times 5 = 10,000 \text{ pts}$
2.  **Density**: $10,000 / 1,000 \text{ files} = 10 \text{ pts/file}$
3.  **Penalty Calculation** (assuming even distribution across rules, avg factor x2):
    $$ \text{Penalty} = 10 \times 2 = 20 \text{ points} $$
4.  **Final Score**: $100 - 20 = \mathbf{80}$ (Good/Fair)

### comparison with Old (Additive) System

In the old system, the Total Severity Points ($10,000$) would be subtracted directly:
$$ 100 - 10,000 = -9,900 \rightarrow \mathbf{0.0} \text{ (Score)} $$

This demonstrates why Density-Based Scoring is essential for scalability.
