import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma, Department } from '@prisma/client';

@Injectable()
export class DepartmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.DepartmentCreateInput): Promise<Department> {
    return this.prisma.department.create({ data });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.DepartmentWhereUniqueInput;
    where?: Prisma.DepartmentWhereInput;
    orderBy?: Prisma.DepartmentOrderByWithRelationInput;
  }): Promise<Department[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.department.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        employees: true, // Include employees count or details
      },
    });
  }

  async findOne(
    where: Prisma.DepartmentWhereUniqueInput,
  ): Promise<Department | null> {
    return this.prisma.department.findUnique({
      where,
      include: {
        employees: true,
      },
    });
  }

  async update(params: {
    where: Prisma.DepartmentWhereUniqueInput;
    data: Prisma.DepartmentUpdateInput;
  }): Promise<Department> {
    const { where, data } = params;
    return this.prisma.department.update({
      data,
      where,
    });
  }

  async delete(
    where: Prisma.DepartmentWhereUniqueInput,
  ): Promise<Department> {
    return this.prisma.department.delete({ where });
  }

  async count(where?: Prisma.DepartmentWhereInput): Promise<number> {
    return this.prisma.department.count({ where });
  }
}
