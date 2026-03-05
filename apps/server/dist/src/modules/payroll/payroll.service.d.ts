import { PayrollRepository } from './payroll.repository';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';
import { EmployeesService } from '../employees/employees.service';
import { AttendanceService } from '../attendance/attendance.service';
import { StandardVietnameseStrategy } from './strategies/standard-vietnamese.strategy';
export declare class PayrollService {
    private readonly repository;
    private readonly employeesService;
    private readonly attendanceService;
    private readonly defaultStrategy;
    private salaryStrategy;
    constructor(repository: PayrollRepository, employeesService: EmployeesService, attendanceService: AttendanceService, defaultStrategy: StandardVietnameseStrategy);
    generatePayroll(dto: GeneratePayrollDto): Promise<{
        month: string;
        processedCount: number;
        totalPayout: number;
        generatedAt: string;
    }>;
    getPayslips(query: any, currentUser: any): Promise<{
        id: string;
        employeeId: string;
        month: number;
        year: number;
        standardWorkingDays: number;
        actualWorkedDays: import("@prisma/client/runtime/library").Decimal;
        snapshotBasicSalary: import("@prisma/client/runtime/library").Decimal;
        allowance: import("@prisma/client/runtime/library").Decimal;
        bonus: import("@prisma/client/runtime/library").Decimal;
        deduction: import("@prisma/client/runtime/library").Decimal;
        netSalary: import("@prisma/client/runtime/library").Decimal;
        generatedAt: Date;
    }[]>;
    generateExcelReport(monthString: string): Promise<Buffer>;
}
