import { LeaveRepository } from './leave.repository';
import { CreateLeaveRequestDto } from './dto/create-leave.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
export declare class LeaveService {
    private readonly repository;
    constructor(repository: LeaveRepository);
    submitRequest(employeeId: string, dto: CreateLeaveRequestDto): Promise<{
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
    getRequests(query: any, currentUser: any): Promise<{
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
    }[]>;
    getRequestById(id: string): Promise<{
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
    updateStatus(requestId: string, managerId: string, dto: UpdateLeaveStatusDto): Promise<{
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
