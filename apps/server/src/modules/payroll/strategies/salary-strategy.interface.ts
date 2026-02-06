/**
 * ISalaryStrategy (The Evolution Point)
 * 
 * PURPOSE:
 * - Defines the contract for calculating taxes and deductions.
 * - Allows us to swap tax rules (e.g. Vietnam vs Singapore, or 2025 vs 2026)
 *   without changing the core PayrollService.
 */
export interface ISalaryStrategy {
  /**
   * Calculates the income tax based on gross salary.
   * @param grossSalary - The basic salary + allowances.
   * @returns The tax amount to be deducted.
   */
  calculateTax(grossSalary: number): number;

  /**
   * Calculates social insurance or other deductions.
   * @param grossSalary - The basic salary.
   * @returns The total deduction amount.
   */
  calculateDeductions(grossSalary: number): number;
}