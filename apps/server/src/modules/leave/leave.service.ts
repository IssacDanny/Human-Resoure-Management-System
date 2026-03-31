import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
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
   * 2. Ensure startDate is not in the past.
   * 3. Create the record with default status PENDING and auto-assigned employeeId.
   */
  async submitRequest(employeeId: number, dto: CreateLeaveRequestDto) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    
    // Use actual system date normalized to midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start > end) {
      throw new BadRequestException('Start date cannot be after end date.');
    }

    // Validation: Only allow past dates if it's SICK leave (common HR policy)
    if (start < today && dto.leaveType !== 'SICK') {
      throw new BadRequestException('Annual or Unpaid leave must be requested for future dates.');
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
   * Retrieves a list of leave requests based on filters and user identity.
   */
  async getRequests(query: any, currentUser: any) {
    const take = query.limit ? Number(query.limit) : 25;
    const skip = query.offset ? Number(query.offset) : 0;

    const whereClause: any = {};

    // 1. SCOPING: Employees can ONLY see their own history
    if (currentUser.role === 'EMPLOYEE') {
      whereClause.employeeId = currentUser.id;
    } else {
      // Admins/Managers can filter by employeeId if provided
      if (query['filter[employeeId]']) {
        whereClause.employeeId = Number(query['filter[employeeId]']);
      }
    }

    // Filter by status if provided
    if (query['filter[status]']) {
      whereClause.status = query['filter[status]'].toUpperCase();
    }

    return this.repository.findMany({
      take,
      skip,
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRequestById(id: number) {
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
  async updateStatus(
    requestId: number,
    managerId: number,
    dto: UpdateLeaveStatusDto,
  ) {
    const request = await this.getRequestById(requestId);

    if (request.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        `Cannot update a request that is already ${request.status}.`,
      );
    }

    // In a full implementation, verify that managerId is actually the manager of request.employeeId

    return this.repository.update({
      where: { id: requestId },
      data: {
        status: dto.status,
        rejectionReason:
          dto.status === LeaveStatus.REJECTED ? dto.rejectionReason : null,
        decider: { connect: { id: managerId } },
        decidedAt: new Date(),
      },
    });
  }
}
