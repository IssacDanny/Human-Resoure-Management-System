import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma, Payroll } from '@prisma/client';

@Injectable()
export class PayrollRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(params: {
    where: Prisma.PayrollEmployeeIdMonthYearCompoundUniqueInput;
    create: Prisma.PayrollCreateInput;
    update: Prisma.PayrollUpdateInput;
  }): Promise<Payroll> {
    return this.prisma.payroll.upsert({
      where: { employeeId_month_year: params.where },
      create: params.create,
      update: params.update,
    });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.PayrollWhereInput;
  }): Promise<Payroll[]> {
    return this.prisma.payroll.findMany({
      ...params,
      include: { employee: true }, // Include employee details for the payslip
      orderBy: { generatedAt: 'desc' },
    });
  }
}