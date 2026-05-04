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
   */
  async submitRequest(employeeId: number, dto: CreateLeaveRequestDto) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start > end) {
      throw new BadRequestException('Start date cannot be after end date.');
    }

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
   * Retrieves a list of leave requests with pagination, sorting, and filtering.
   */
  async getRequests(query: any, currentUser: any) {
    const take = query.limit ? Math.min(Number(query.limit), 100) : 25;
    const skip = query.offset ? Number(query.offset) : 0;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';

    const whereClause: any = {};

    // SCOPING: Employees can ONLY see their own history
    if (currentUser.role === 'EMPLOYEE') {
      whereClause.employeeId = currentUser.id;
    } else {
      if (query['filter[employeeId]']) {
        whereClause.employeeId = Number(query['filter[employeeId]']);
      }
    }

    // Filter by status
    if (query['filter[status]']) {
      whereClause.status = query['filter[status]'].toUpperCase();
    }

    // Filter by leave type
    if (query['filter[leaveType]']) {
      whereClause.leaveType = query['filter[leaveType]'].toUpperCase();
    }

    // Filter by employee name (text search)
    if (query['filter[employeeName]']) {
      whereClause.employee = {
        fullName: {
          contains: query['filter[employeeName]'],
          mode: 'insensitive',
        },
      };
    }

    // Filter by period (date range)
    if (query['filter[startDate]']) {
      whereClause.startDate = { gte: new Date(query['filter[startDate]']) };
    }
    if (query['filter[endDate]']) {
      whereClause.endDate = { lte: new Date(query['filter[endDate]']) };
    }

    // Build orderBy
    const allowedSortFields = ['createdAt', 'startDate', 'status', 'leaveType'];
    const orderBy: any = {};
    if (allowedSortFields.includes(sortBy)) {
      orderBy[sortBy] = sortOrder;
    } else if (sortBy === 'department') {
      // Sort by department name via nested relation
      orderBy.employee = { department: { name: sortOrder } };
    } else {
      orderBy['createdAt'] = sortOrder;
    }

    const data = await this.repository.findMany({
      take,
      skip,
      where: whereClause,
      orderBy,
    });

    const total = await this.repository.count(whereClause);

    return {
      data,
      pagination: {
        total,
        page: Math.floor(skip / take) + 1,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async getRequestById(id: number) {
    const request = await this.repository.findById(id);
    if (!request) throw new NotFoundException('Leave request not found.');
    return request;
  }

  /**
   * Approves or Rejects a pending request.
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