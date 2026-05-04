import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DepartmentsRepository } from './departments.repository';

@Injectable()
export class DepartmentsService {
  constructor(private readonly repository: DepartmentsRepository) {}

  async findAll(query: any) {
    const take = query.limit ? Math.min(Number(query.limit), 100) : 10;
    const skip = query.offset ? Number(query.offset) : 0;
    const sortBy = query.sortBy || 'name';
    const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';

    // Build where clause for search
    const where: Prisma.DepartmentWhereInput = {};
    if (query.search) {
      where.name = {
        contains: query.search,
        mode: 'insensitive',
      };
    }
    if (query.isActive !== undefined && query.isActive !== '') {
      where.isActive = query.isActive === 'true';
    }

    // For employees sort: fetch all matching, sort in memory, then paginate
    if (sortBy === 'employees') {
      const all = await this.repository.findAll({
        where,
        orderBy: { name: 'asc' },
      }) as any[];

      // Sort by employee count in memory
      all.sort((a, b) => {
        const countA = a.employees?.length ?? 0;
        const countB = b.employees?.length ?? 0;
        return sortOrder === 'asc' ? countA - countB : countB - countA;
      });

      const total = all.length;
      const totalPages = Math.ceil(total / take);
      const paginated = all.slice(skip, skip + take);

      return {
        data: paginated,
        pagination: {
          total,
          page: Math.floor(skip / take) + 1,
          limit: take,
          totalPages,
        },
      };
    }

    // Standard sort (name, isActive, createdAt) via Prisma orderBy
    const allowedSortFields = ['name', 'isActive', 'createdAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'name';
    const orderBy: Prisma.DepartmentOrderByWithRelationInput = { [sortField]: sortOrder };

    const departments = await this.repository.findAll({
      take,
      skip,
      where,
      orderBy,
    });

    // Count total for pagination
    const total = await this.repository.count(where);

    return {
      data: departments,
      pagination: {
        total,
        page: Math.floor(skip / take) + 1,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async findOne(id: number) {
    const department = await this.repository.findOne({ id });
    if (!department)
      throw new NotFoundException(`Department with ID ${id} not found`);
    return department;
  }

  async create(data: any) {
    return this.repository.create(data);
  }

  async update(id: number, data: any) {
    return this.repository.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return this.repository.delete({ id });
  }

  async getStats() {
    const total = await this.repository.count();
    const active = await this.repository.count({ isActive: true });
    const inactive = await this.repository.count({ isActive: false });
    return { total, active, inactive };
  }
}