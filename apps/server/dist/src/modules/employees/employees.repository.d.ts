import { PrismaService } from '../../prisma.service';
import { Prisma, Employee } from '@prisma/client';
export declare class EmployeesRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: Prisma.EmployeeCreateInput): Promise<Employee>;
    findAll(params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.EmployeeWhereUniqueInput;
        where?: Prisma.EmployeeWhereInput;
        orderBy?: Prisma.EmployeeOrderByWithRelationInput;
    }): Promise<Employee[]>;
    findOne(where: Prisma.EmployeeWhereUniqueInput): Promise<Employee | null>;
    update(params: {
        where: Prisma.EmployeeWhereUniqueInput;
        data: Prisma.EmployeeUpdateInput;
    }): Promise<Employee>;
}
