import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
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
    const existing = await this.repository.findOne({
      workEmail: dto.workEmail,
    });
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    // 2. Hash default password (e.g., "Welcome123!")
    // In a real system, you'd generate a random one and email it.
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash('Welcome123!', salt);

    // 3. Save to DB
    const { departmentId, ...rest } = dto;

    // Note: We map department directly now
    // Later this should be a relation connect
    return this.repository.create({
      ...rest,
      department: { connect: { id: departmentId } },
      passwordHash,
      joinDate: new Date(dto.joinDate), // Convert ISO string to Date object
    });
  }

  async getStats() {
    const total = await this.repository.count();
    const active = await this.repository.count({ status: 'ACTIVE' });
    const inactive = await this.repository.count({ status: 'INACTIVE' });
    return { total, active, inactive };
  }

  async findAll(query: any) {
    const take = query.limit ? Math.min(Number(query.limit), 100) : 10;
    const skip = query.offset ? Number(query.offset) : 0;
    const sortBy = query.sortBy || 'fullName';
    const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';

    // Build where clause (return both ACTIVE and INACTIVE employees)
    const where: any = {};
    if (query.search) {
      where.fullName = {
        contains: query.search,
        mode: 'insensitive',
      };
    }
    if (query.role) {
      where.role = query.role;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.departmentId) {
      where.departmentId = Number(query.departmentId);
    }

    // Allowed sort fields for safety (including nested department.name)
    const allowedSortFields = ['fullName', 'workEmail', 'role', 'status', 'jobTitle', 'joinDate', 'id', 'department'];

    if (!allowedSortFields.includes(sortBy)) {
      // fallback
    }

    // Build orderBy — department needs nested sorting
    let orderBy: any = {};
    if (sortBy === 'department') {
      orderBy = { department: { name: sortOrder } };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    const employees = await this.repository.findAll({
      take,
      skip,
      where,
      orderBy,
      include: { department: true },
    });

    // Count total for pagination
    const total = await this.repository.count(where);

    return {
      data: employees,
      pagination: {
        total,
        page: Math.floor(skip / take) + 1,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async findOne(id: number) {
    const employee = await this.repository.findOne({ id }, { department: true });
    if (!employee)
      throw new NotFoundException(`Employee with ID ${id} not found`);
    return employee;
  }

  /**
   * Used by AuthService to validate credentials.
   * We need to return the passwordHash here so Auth can compare it.
   */
  async findByEmail(email: string) {
    return this.repository.findOne({ workEmail: email });
  }

  async updateProfile(id: number, dto: UpdateEmployeeDto) {
    // Convert date strings to Date objects if present
    const data: any = { ...dto };
    if (dto.dob) {
      data.dob = new Date(dto.dob);
    }
    if (dto.joinDate) {
      data.joinDate = new Date(dto.joinDate);
    }

    return this.repository.update({
      where: { id },
      data,
    });
  }

  /**
   * ISP Implementation:
   * Returns only the data needed for Payroll.
   */
  async getPayableEntity(id: number): Promise<IPayable> {
    const employee = await this.findOne(id);

    return {
      id: employee.id,
      basicSalary: Number(employee.basicSalary), // Decimal to Number
      getAttendanceDays: async (month: string) => {
        // TODO: Call AttendanceService to get actual days
        // For now, return standard 22 days mock
        return 22;
      },
    };
  }
}
