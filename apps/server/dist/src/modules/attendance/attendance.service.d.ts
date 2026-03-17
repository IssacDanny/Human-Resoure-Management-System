import { AttendanceRepository } from './attendance.repository';
import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';
export declare class AttendanceService {
    private readonly repository;
    constructor(repository: AttendanceRepository);
    recordDailyAttendance(dto: UpsertAttendanceDto): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.AttendanceStatus;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        checkInTime: Date | null;
        checkOutTime: Date | null;
        workedDays: import("@prisma/client/runtime/library").Decimal;
        note: string | null;
        employeeId: string;
    }>;
    getRecords(query: any): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.AttendanceStatus;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        checkInTime: Date | null;
        checkOutTime: Date | null;
        workedDays: import("@prisma/client/runtime/library").Decimal;
        note: string | null;
        employeeId: string;
    }[]>;
    getMonthlySummary(employeeId: string, monthString: string): Promise<number>;
}
