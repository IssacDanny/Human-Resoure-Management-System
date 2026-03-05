import { LeaveStatus } from '@prisma/client';
export declare class UpdateLeaveStatusDto {
    status: LeaveStatus;
    rejectionReason?: string;
}
