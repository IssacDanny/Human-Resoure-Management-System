import { PayrollService } from './payroll.service';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';
import type { Request } from 'express';
import type { Response } from 'express';
export declare class PayrollController {
    private readonly payrollService;
    constructor(payrollService: PayrollService);
    generatePayroll(dto: GeneratePayrollDto): Promise<{
        month: string;
        processedCount: number;
        totalPayout: number;
        generatedAt: string;
    }>;
    listPayslips(req: Request, query: any): Promise<{
        data: {
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
        }[];
        pagination: {
            hasNextPage: boolean;
            nextCursor: null;
        };
    }>;
    exportReport(month: string, res: Response): Promise<void>;
}
