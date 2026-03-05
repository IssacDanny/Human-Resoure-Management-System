export interface ISalaryStrategy {
    calculateTax(grossSalary: number): number;
    calculateDeductions(grossSalary: number): number;
}
