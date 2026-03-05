import { PrismaService } from '../../prisma.service';
import { Prisma, LeaveRequest } from '@prisma/client';
export declare class LeaveRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: Prisma.LeaveRequestCreateInput): Promise<LeaveRequest>;
    findById(id: string): Promise<LeaveRequest | null>;
    findMany(params: {
        skip?: number;
        take?: number;
        where?: Prisma.LeaveRequestWhereInput;
        orderBy?: Prisma.LeaveRequestOrderByWithRelationInput;
    }): Promise<LeaveRequest[]>;
    update(params: {
        where: Prisma.LeaveRequestWhereUniqueInput;
        data: Prisma.LeaveRequestUpdateInput;
    }): Promise<LeaveRequest>;
}
