import { PrismaService } from '../../prisma.service';
import { Prisma, Attendance } from '@prisma/client';
export declare class AttendanceRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    upsert(params: {
        where: Prisma.AttendanceEmployeeIdDateCompoundUniqueInput;
        create: Prisma.AttendanceCreateInput;
        update: Prisma.AttendanceUpdateInput;
    }): Promise<Attendance>;
    findMany(params: {
        skip?: number;
        take?: number;
        where?: Prisma.AttendanceWhereInput;
        orderBy?: Prisma.AttendanceOrderByWithRelationInput;
    }): Promise<Attendance[]>;
}
