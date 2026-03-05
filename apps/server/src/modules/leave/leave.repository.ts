import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma, LeaveRequest } from '@prisma/client';

@Injectable()
export class LeaveRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.LeaveRequestCreateInput): Promise<LeaveRequest> {
    return this.prisma.leaveRequest.create({ data });
  }

  async findById(id: string): Promise<LeaveRequest | null> {
    return this.prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: true, decider: true }, // Include relations for the response
    });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.LeaveRequestWhereInput;
    orderBy?: Prisma.LeaveRequestOrderByWithRelationInput;
  }): Promise<LeaveRequest[]> {
    return this.prisma.leaveRequest.findMany({
      ...params,
      include: { employee: true }, // Include requester details
    });
  }

  async update(params: {
    where: Prisma.LeaveRequestWhereUniqueInput;
    data: Prisma.LeaveRequestUpdateInput;
  }): Promise<LeaveRequest> {
    return this.prisma.leaveRequest.update({
      where: params.where,
      data: params.data,
      include: { employee: true, decider: true },
    });
  }
}