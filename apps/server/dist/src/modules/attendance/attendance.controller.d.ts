import { AttendanceService } from './attendance.service';
import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';
export declare class AttendanceController {
    private readonly attendanceService;
    constructor(attendanceService: AttendanceService);
    upsertAttendance(upsertAttendanceDto: UpsertAttendanceDto): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.AttendanceStatus;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        date: Date;
        checkInTime: Date | null;
        checkOutTime: Date | null;
        workedDays: import("@prisma/client/runtime/library").Decimal;
        note: string | null;
    }>;
    listAttendance(query: any): Promise<{
        data: {
            id: string;
            status: import("@prisma/client").$Enums.AttendanceStatus;
            createdAt: Date;
            updatedAt: Date;
            employeeId: string;
            date: Date;
            checkInTime: Date | null;
            checkOutTime: Date | null;
            workedDays: import("@prisma/client/runtime/library").Decimal;
            note: string | null;
        }[];
        pagination: {
            hasNextPage: boolean;
            nextCursor: null;
        };
    }>;
}
