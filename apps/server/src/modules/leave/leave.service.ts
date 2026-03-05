import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { LeaveRepository } from './leave.repository';
import { CreateLeaveRequestDto } from './dto/create-leave.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
import { LeaveStatus } from '@prisma/client';

@Injectable()
export class LeaveService {
  constructor(private readonly repository: LeaveRepository) {}

  /**
   * Submits a new leave request.
   * 
   * LOGIC:
   * 1. Validate that startDate <= endDate.
   * 2. Create the record with default status PENDING.
   */
  async submitRequest(employeeId: string, dto: CreateLeaveRequestDto) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (start > end) {
      throw new BadRequestException('Start date cannot be after end date.');
    }

    return this.repository.create({
      employee: { connect: { id: employeeId } },
      leaveType: dto.leaveType,
      startDate: start,
      endDate: end,
      reason: dto.reason,
      status: LeaveStatus.PENDING,
    });
  }

  /**
   * Retrieves a list of leave requests based on filters.
   */
  async getRequests(query: any, currentUser: any) {
    const take = query.limit ? Number(query.limit) : 25;
    const skip = query.offset ? Number(query.offset) : 0;
    
    const whereClause: any = {};
    
    // Filter by status if provided
    if (query['filter[status]']) {
      whereClause.status = query['filter[status]'].toUpperCase();
    }

    // RBAC Logic: Employees only see their own. Managers see their team's.
    // For MVP skeleton, we assume the controller passes the user context.
    if (currentUser.role === 'EMPLOYEE') {
      whereClause.employeeId = currentUser.id;
    }

    return this.repository.findMany({
      take,
      skip,
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRequestById(id: string) {
    const request = await this.repository.findById(id);
    if (!request) throw new NotFoundException('Leave request not found.');
    return request;
  }

  /**
   * The State Machine Transition.
   * Approves or Rejects a pending request.
   * 
   * LOGIC:
   * 1. Ensure request exists and is currently PENDING.
   * 2. Update status, decidedBy, and decidedAt.
   */
  async updateStatus(requestId: string, managerId: string, dto: UpdateLeaveStatusDto) {
    const request = await this.getRequestById(requestId);

    if (request.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(`Cannot update a request that is already ${request.status}.`);
    }

    // In a full implementation, verify that managerId is actually the manager of request.employeeId

    return this.repository.update({
      where: { id: requestId },
      data: {
        status: dto.status,
        rejectionReason: dto.status === LeaveStatus.REJECTED ? dto.rejectionReason : null,
        decider: { connect: { id: managerId } },
        decidedAt: new Date(),
      },
    });
  }
}