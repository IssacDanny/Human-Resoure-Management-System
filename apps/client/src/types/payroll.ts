import type { Employee } from './employee';

export interface GeneratePayrollRequest {
  month: string;                // YYYY-MM
  standardWorkingDays?: number; // default 22
}

export interface PayrollRunSummary {
  month: string;
  processedCount: number;
  totalPayout: number;
  generatedAt?: string;
}

export interface Payslip {
  id: string;
  employee?: Employee;
  month: string;
  standardWorkingDays?: number;
  actualWorkedDays?: number;
  basicSalary?: number;
  allowance?: number;
  bonus?: number;
  deduction?: number;
  netSalary?: number;
  generatedAt?: string;
}
