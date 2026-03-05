import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { EmployeesRepository } from './employees.repository';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { IPayable } from '../../common/interfaces/payable.interface';

@Injectable()
export class EmployeesService {
  constructor(private readonly repository: EmployeesRepository) {}

  /**
   * Registers a new employee.
   * Hashes the default password before saving.
   */
  async registerNewEmployee(dto: CreateEmployeeDto) {
    // 1. Check for existing email
    const existing = await this.repository.findOne({ workEmail: dto.workEmail });
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    // 2. Hash default password (e.g., "Welcome123!")
    // In a real system, you'd generate a random one and email it.
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash('Welcome123!', salt);

    // 3. Save to DB
    const { departmentId, ...rest } = dto;
    
    // Note: We map departmentId to 'department' string for MVP as per Prisma schema
    // Later this should be a relation connect
    return this.repository.create({
      ...rest,
      department: departmentId, 
      passwordHash,
      joinDate: new Date(dto.joinDate), // Convert ISO string to Date object
    });
  }

  async findAll(query: any) {
    // Simple pagination for MVP
    const take = query.limit ? Number(query.limit) : 25;
    const skip = query.offset ? Number(query.offset) : 0;

    const employees = await this.repository.findAll({
      take,
      skip,
      where: { status: 'ACTIVE' }, // Default filter
    });

    // FIX: Wrap the result to match the API Contract (EmployeeConnection)
    return {
      data: employees,
      pagination: {
        hasNextPage: employees.length === take, // Rough estimate for MVP
        nextCursor: null // We aren't using cursors yet in this skeleton
      }
    };
  }

  async findOne(id: string) {
    const employee = await this.repository.findOne({ id });
    if (!employee) throw new NotFoundException(`Employee with ID ${id} not found`);
    return employee;
  }

  /**
   * Used by AuthService to validate credentials.
   * We need to return the passwordHash here so Auth can compare it.
   */
  async findByEmail(email: string) {
    return this.repository.findOne({ workEmail: email });
  }

  async updateProfile(id: string, dto: UpdateEmployeeDto) {
    return this.repository.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * ISP Implementation:
   * Returns only the data needed for Payroll.
   */
  async getPayableEntity(id: string): Promise<IPayable> {
    const employee = await this.findOne(id);
    
    return {
      id: employee.id,
      basicSalary: Number(employee.basicSalary), // Decimal to Number
      getAttendanceDays: async (month: string) => {
        // TODO: Call AttendanceService to get actual days
        // For now, return standard 22 days mock
        return 22; 
      }
    };
  }
}