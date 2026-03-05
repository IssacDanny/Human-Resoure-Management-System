import { AttendanceStatus } from '@prisma/client';
export declare class UpsertAttendanceDto {
    employeeId: string;
    date: string;
    status: AttendanceStatus;
    checkInTime?: string;
    checkOutTime?: string;
    note?: string;
}
