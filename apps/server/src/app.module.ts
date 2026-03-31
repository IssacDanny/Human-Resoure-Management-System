import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { PrismaService } from './prisma.service';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { EmployeesModule } from './modules/employees/employees.module';
import { AuthModule } from './modules/auth/auth.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { LeaveModule } from './modules/leave/leave.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';

@Module({
  imports: [
    // Register the Domain Modules here
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EmployeesModule,
    AuthModule,
    AttendanceModule,
    LeaveModule,
    PayrollModule,
    DepartmentsModule,
  ],
  controllers: [AppController],
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
