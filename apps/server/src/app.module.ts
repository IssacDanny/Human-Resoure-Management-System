import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { PrismaService } from './prisma.service';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { EmployeesModule } from './modules/employees/employees.module';
import { AuthModule } from './modules/auth/auth.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { LeaveModule } from './modules/leave/leave.module';
import { PayrollModule } from './modules/payroll/payroll.module';

@Module({
  imports: [
    // Register the Domain Modules here
    EmployeesModule,
    AuthModule,
    AttendanceModule,
    LeaveModule,
    PayrollModule,
    
  ],
  controllers: [],
  providers: [
    // The Database Connection
    PrismaService,
    
    // The Global Error Handler
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}