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
    const take = query.limit ? Number(query.limit) : 31; // Max days in a month
    const skip = query.offset ? Number(query.offset) : 0;

    const whereClause: any = {};

    // 1. SECURITY: Enforce self-access unless filtering for another user
    if (currentUser.role === 'EMPLOYEE') {
      whereClause.employeeId = currentUser.id;
    } else if (query['filter[employeeId]']) {
      // Admins/Managers can filter by employeeId
      whereClause.employeeId = Number(query['filter[employeeId]']);
    } else {
      // Default: ADMIN_HR and MANAGER see their own records unless filtering
      whereClause.employeeId = currentUser.id;
    }

    // 2. FILTERING: Month and Year
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

    // 3. OUTPUT: Handle empty state with specific message
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
   * Check in for today. Creates a new attendance record for the current day.
   * Status is PRESENT if before 9 AM, LATE if 9 AM or later.
   */
  async checkIn(employeeId: number) {
    const now = new Date();
    
    // Create today's date using UTC directly
    // This ensures the date stored matches the local date regardless of timezone
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    
    // Check if already checked in today
    const existing = await this.repository.findMany({
      where: {
        employeeId,
        date: today,
      },
    });

    if (existing.length > 0) {
      const record = existing[0];
      if (record.checkInTime) {
        throw new Error('You have already checked in today.');
      }
    }

    // Determine status based on current hour
    const status = now.getHours() >= 9 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

    // Create or update record with check-in time
    return this.repository.upsert({
      where: {
        employeeId,
        date: today,
      },
      create: {
        employee: { connect: { id: employeeId } },
        date: today,
        status,
        checkInTime: now,
        workedDays: 1.0,
      },
      update: {
        status,
        checkInTime: now,
        workedDays: 1.0,
      },
    });
  }

  /**
   * Check out for today. Updates the checkOutTime of today's attendance record.
   */
  async checkOut(employeeId: number) {
    const now = new Date();
    
    // Create today's date using UTC directly
    // This ensures the date matches what was stored during check-in
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    // Find today's record
    const existing = await this.repository.findMany({
      where: {
        employeeId,
        date: today,
      },
    });

    if (existing.length === 0) {
      throw new Error('No attendance record found for today. Please check in first.');
    }

    const record = existing[0];
    if (!record.checkInTime) {
      throw new Error('No check-in time found. Please check in first.');
    }

    if (record.checkOutTime) {
      throw new Error('You have already checked out today.');
    }

    // Update with check-out time
    return this.repository.upsert({
      where: {
        employeeId,
        date: today,
      },
      create: {
        employee: { connect: { id: employeeId } },
        date: today,
        status: record.status,
        checkInTime: record.checkInTime,
        checkOutTime: now,
        workedDays: record.workedDays,
      },
      update: {
        checkOutTime: now,
      },
    });
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