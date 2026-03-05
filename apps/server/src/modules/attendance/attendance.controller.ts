import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('attendance')
@UseGuards(JwtAuthGuard) // Secure the entire controller
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  async upsertAttendance(@Body() upsertAttendanceDto: UpsertAttendanceDto) {
    return this.attendanceService.recordDailyAttendance(upsertAttendanceDto);
  }

  @Get()
  async listAttendance(@Query() query: any) {
    // In a fully polished system, we would use a custom Interceptor 
    // to wrap this in the { data:[], pagination: {} } format.
    // For the skeleton, we return the raw array.
    const data = await this.attendanceService.getRecords(query);
    return {
      data,
      pagination: {
        hasNextPage: false, // Mocked for MVP
        nextCursor: null
      }
    };
  }
}