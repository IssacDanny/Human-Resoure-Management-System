import { Injectable } from '@nestjs/common';
import { ISalaryStrategy } from './strategies/salary-strategy.interface';
import { IPayable } from '../../common/interfaces/payable.interface';

/**
 * PayrollService (The Bursar)
 * 
 * RESPONSIBILITY:
 * - Orchestrates the monthly payroll run.
 * - Uses the injected Strategy to perform calculations.
 * - Saves the result (Payslip) to the repository.
 */
@Injectable()
export class PayrollService {
  private salaryStrategy: ISalaryStrategy;

  constructor(
    // TODO: Inject Repository
    // TODO: Inject the default Strategy (e.g. VietnameseStandard)
  ) {}

  /**
   * Triggers the payroll calculation for a specific month.
   * 
   * LOGIC:
   * 1. Fetch all active employees (as IPayable).
   * 2. For each employee:
   *    a. Get attendance days.
   *    b. Calculate Gross = (Basic / StandardDays) * ActualDays.
   *    c. Calculate Tax & Deductions using this.salaryStrategy.
   *    d. Net = Gross - Tax - Deductions.
   * 3. Save Payslip.
   * 
   * @param month - YYYY-MM
   */
  async generatePayroll(month: string) {
    // TODO: Implement the loop described above
    throw new Error('Method not implemented.');
  }

  /**
   * Allows changing the strategy at runtime if needed.
   */
  setStrategy(strategy: ISalaryStrategy) {
    this.salaryStrategy = strategy;
  }
}