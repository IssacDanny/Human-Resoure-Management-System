import { Injectable } from '@nestjs/common';
import { AttendanceRepository } from './attendance.repository';
import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';
import { AttendanceStatus } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(private readonly repository: AttendanceRepository) {}

  /**
   * Records or updates daily attendance.
   * Calculates the 'workedDays' multiplier based on the status.
   */
  async recordDailyAttendance(dto: UpsertAttendanceDto) {
    const targetDate = new Date(dto.date);
    
    // Business Logic: Determine numerical value of the day
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
   * Retrieves a list of attendance records.
   */
  async getRecords(query: any) {
    const take = query.limit ? Number(query.limit) : 25;
    const skip = query.offset ? Number(query.offset) : 0;
    
    const whereClause: any = {};
    
    if (query['filter[employeeId]']) {
      whereClause.employeeId = query['filter[employeeId]'];
    }
    
    if (query['filter[month]']) {
      // month format: YYYY-MM
      const [year, month] = query['filter[month]'].split('-');
      const startDate = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
      const endDate = new Date(Date.UTC(Number(year), Number(month), 0, 23, 59, 59));
      
      whereClause.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    return this.repository.findMany({
      take,
      skip,
      where: whereClause,
      orderBy: { date: 'desc' },
    });
  }

  /**
   * ISP Implementation for the Payroll Module.
   * Sums up the total worked days for a specific employee in a given month.
   */
  async getMonthlySummary(employeeId: string, monthString: string): Promise<number> {
    const [year, month] = monthString.split('-');
    const startDate = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
    const endDate = new Date(Date.UTC(Number(year), Number(month), 0, 23, 59, 59));

    const records = await this.repository.findMany({
      where: {
        employeeId,
        date: { gte: startDate, lte: endDate },
      }
    });

    // Sum the workedDays (Decimal needs to be converted to Number for math)
    const totalDays = records.reduce((sum, record) => sum + Number(record.workedDays), 0);
    return totalDays;
  }
}