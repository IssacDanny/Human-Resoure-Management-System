import { Injectable } from '@nestjs/common';
import { ISalaryStrategy } from './salary-strategy.interface';

/**
 * Standard Vietnamese Salary Strategy (2026)
 * 
 * RESPONSIBILITY:
 * - Calculates mandatory deductions (BHXH 8%, BHYT 1.5%, BHTN 1% = 10.5%).
 * - Calculates Personal Income Tax (PIT) based on progressive brackets.
 * 
 * Note: This is a simplified MVP version. A true implementation would 
 * include base salary caps for insurance and family relief deductions for PIT.
 */
@Injectable()
export class StandardVietnameseStrategy implements ISalaryStrategy {
  
  calculateDeductions(grossSalary: number): number {
    // Mandatory Insurances: 10.5% of gross salary
    const insuranceRate = 0.105;
    return grossSalary * insuranceRate;
  }

  calculateTax(grossSalary: number): number {
    // Simplified PIT Calculation for MVP
    // Assuming a standard personal deduction of 11,000,000 VND
    const personalDeduction = 11000000;
    const taxableIncome = grossSalary - this.calculateDeductions(grossSalary) - personalDeduction;

    if (taxableIncome <= 0) return 0;

    // Simplified flat 10% for the skeleton. 
    // TODO: Implement the 7-tier progressive tax brackets here.
    return taxableIncome * 0.10; 
  }
}