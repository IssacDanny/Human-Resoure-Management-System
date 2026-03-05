import { PrismaService } from '../../prisma.service';
import { Prisma, Payroll } from '@prisma/client';
export declare class PayrollRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    upsert(params: {
        where: Prisma.PayrollEmployeeIdMonthYearCompoundUniqueInput;
        create: Prisma.PayrollCreateInput;
        update: Prisma.PayrollUpdateInput;
    }): Promise<Payroll>;
    findMany(params: {
        skip?: number;
        take?: number;
        where?: Prisma.PayrollWhereInput;
    }): Promise<Payroll[]>;
}
