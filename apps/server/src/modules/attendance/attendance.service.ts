// --- START OF FILE attendance.service.ts ---
import { Injectable } from '@nestjs/common';
import { AttendanceRepository } from './attendance.repository';
import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';
import { AttendanceStatus } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { hylomorphism, scopingAlgebra, scopingCoalgebra } from './attendance.fp';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly repository: AttendanceRepository,
    private readonly prisma: PrismaService // Injected for the F-Algebra interpreter
  ) {}

  /**
   * Records or updates daily attendance.
   */
  async recordDailyAttendance(dto: UpsertAttendanceDto) {
    const targetDate = new Date(dto.date);

    let workedDays = 0;
    switch (dto.status) {
      case AttendanceStatus.PRESENT:
      case AttendanceStatus.LATE:
        workedDays = 1.0;
        break;
      case AttendanceStatus.HALF_DAY:
        workedDays = 0.5;
        break;
      case AttendanceStatus.ABSENT:
        workedDays = 0.0;
        break;
    }

    return this.repository.upsert({
      where: {
        employeeId: dto.employeeId,
        date: targetDate,
      },
      create: {
        employee: { connect: { id: dto.employeeId } },
        date: targetDate,
        status: dto.status,
        checkInTime: dto.checkInTime ? new Date(dto.checkInTime) : null,
        checkOutTime: dto.checkOutTime ? new Date(dto.checkOutTime) : null,
        workedDays,
        note: dto.note,
      },
      update: {
        status: dto.status,
        checkInTime: dto.checkInTime ? new Date(dto.checkInTime) : null,
        checkOutTime: dto.checkOutTime ? new Date(dto.checkOutTime) : null,
        workedDays,
        note: dto.note,
      },
    });
  }

  /**
   * Retrieves a list of attendance records with security and month/year filtering.
   */
  async getRecords(query: any, currentUser: any) {
    // ========================================================================
    // STANDARD IMPERATIVE PIPELINE FOR ALL ROLES
    // ========================================================================
    const take = query.limit ? Number(query.limit) : 31;
    const skip = query.offset ? Number(query.offset) : 0;

    const whereClause: any = {};

    if (currentUser.role === 'EMPLOYEE') {
      whereClause.employeeId = currentUser.id;
    } else if (currentUser.role === 'MANAGER') {
      whereClause.employeeId = currentUser.id;
    } else if (query['filter[employeeId]']) {
      whereClause.employeeId = Number(query['filter[employeeId]']);
    } else if (currentUser.role === 'ADMIN_HR') {
      // ADMIN defaults to viewing their own attendance
      whereClause.employeeId = currentUser.id;
    }

    const month = query.month ? Number(query.month) : new Date().getMonth() + 1;
    const year = query.year ? Number(query.year) : new Date().getFullYear();

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));

    whereClause.date = {
      gte: startDate,
      lte: endDate,
    };

    const data = await this.repository.findMany({
      take,
      skip,
      where: whereClause,
      orderBy: { date: 'asc' },
    });

    return {
      data,
      message: data.length === 0 ? 'No attendance records found for this month.' : undefined,
      pagination: {
        hasNextPage: false,
        nextCursor: null,
      },
    };
  }

  /**
   * ISP Implementation for the Payroll Module.
   */
  async getMonthlySummary(
    employeeId: number,
    monthString: string,
  ): Promise<number> {
    const [year, month] = monthString.split('-');
    const startDate = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
    const endDate = new Date(
      Date.UTC(Number(year), Number(month), 0, 23, 59, 59),
    );

    const records = await this.repository.findMany({
      where: {
        employeeId,
        date: { gte: startDate, lte: endDate },
      },
    });

    const totalDays = records.reduce(
      (sum, record) => sum + Number(record.workedDays),
      0,
    );
    return totalDays;
  }
}
// --- END OF FILE attendance.service.ts ---