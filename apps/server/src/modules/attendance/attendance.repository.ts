import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma, Attendance } from '@prisma/client';

@Injectable()
export class AttendanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates or updates an attendance record for a specific employee and date.
   */
  async upsert(params: {
    where: Prisma.AttendanceEmployeeIdDateCompoundUniqueInput;
    create: Prisma.AttendanceCreateInput;
    update: Prisma.AttendanceUpdateInput;
  }): Promise<Attendance> {
    return this.prisma.attendance.upsert({
      where: { employeeId_date: params.where },
      create: params.create,
      update: params.update,
    });
  }

  /**
   * Retrieves attendance records based on filters.
   */
  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.AttendanceWhereInput;
    orderBy?: Prisma.AttendanceOrderByWithRelationInput;
  }): Promise<Attendance[]> {
    return this.prisma.attendance.findMany(params);
  }
}