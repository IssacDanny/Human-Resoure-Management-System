import { ISalaryStrategy } from './salary-strategy.interface';
export declare class StandardVietnameseStrategy implements ISalaryStrategy {
    calculateDeductions(grossSalary: number): number;
    calculateTax(grossSalary: number): number;
}
