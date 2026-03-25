import { Injectable, NotFoundException } from '@nestjs/common';
import { DepartmentsRepository } from './departments.repository';

@Injectable()
export class DepartmentsService {
  constructor(private readonly repository: DepartmentsRepository) {}

  async findAll(query: any) {
    // Simple pagination for MVP
    const take = query.limit ? Number(query.limit) : 25;
    const skip = query.offset ? Number(query.offset) : 0;

    const departments = await this.repository.findAll({
      take,
      skip,
      where: { isActive: true }, // Default filter to show only active departments
      orderBy: { name: 'asc' },
    });

    return {
      data: departments,
      pagination: {
        hasNextPage: departments.length === take, // Rough estimate for MVP
        nextCursor: null,
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
}