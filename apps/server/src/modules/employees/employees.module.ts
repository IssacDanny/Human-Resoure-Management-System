import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { EmployeesRepository } from './employees.repository';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [EmployeesController],
  providers: [
    EmployeesService, 
    EmployeesRepository, 
    PrismaService // Inject Prisma so the Repository can use it
  ],
  exports: [EmployeesService], // Export Service if other modules (like Payroll) need it
})
export class EmployeesModule {}