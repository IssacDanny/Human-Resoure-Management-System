import { Module } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { PayrollRepository } from './payroll.repository';
import { StandardVietnameseStrategy } from './strategies/standard-vietnamese.strategy';
import { PrismaService } from '../../prisma.service';
import { EmployeesModule } from '../employees/employees.module';
import { AttendanceModule } from '../attendance/attendance.module';

@Module({
  imports:[
    EmployeesModule,   // Required to fetch employees
    AttendanceModule,  // Required to fetch worked days
  ],
  controllers: [PayrollController],
  providers:[
    PayrollService, 
    PayrollRepository, 
    StandardVietnameseStrategy, 
    PrismaService
  ],
})
export class PayrollModule {}