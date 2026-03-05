import { LeaveService } from './leave.service';
import { CreateLeaveRequestDto } from './dto/create-leave.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
import type { Request } from 'express';
export declare class LeaveController {
    private readonly leaveService;
    constructor(leaveService: LeaveService);
    submitRequest(req: Request, createDto: CreateLeaveRequestDto): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.LeaveStatus;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        leaveType: import("@prisma/client").$Enums.LeaveType;
        startDate: Date;
        endDate: Date;
        reason: string;
        rejectionReason: string | null;
        decidedById: string | null;
        decidedAt: Date | null;
    }>;
    listRequests(req: Request, query: any): Promise<{
        data: {
            id: string;
            status: import("@prisma/client").$Enums.LeaveStatus;
            createdAt: Date;
            updatedAt: Date;
            employeeId: string;
            leaveType: import("@prisma/client").$Enums.LeaveType;
            startDate: Date;
            endDate: Date;
            reason: string;
            rejectionReason: string | null;
            decidedById: string | null;
            decidedAt: Date | null;
        }[];
        pagination: {
            hasNextPage: boolean;
            nextCursor: null;
        };
    }>;
    getRequest(id: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.LeaveStatus;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        leaveType: import("@prisma/client").$Enums.LeaveType;
        startDate: Date;
        endDate: Date;
        reason: string;
        rejectionReason: string | null;
        decidedById: string | null;
        decidedAt: Date | null;
    }>;
    updateStatus(req: Request, id: string, updateDto: UpdateLeaveStatusDto): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.LeaveStatus;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        leaveType: import("@prisma/client").$Enums.LeaveType;
        startDate: Date;
        endDate: Date;
        reason: string;
        rejectionReason: string | null;
        decidedById: string | null;
        decidedAt: Date | null;
    }>;
}
