import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
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
  async listAttendance(@Req() req: any, @Query() query: any) {
    const user = req.user; // User from JwtAuthGuard
    return this.attendanceService.getRecords(query, user);
  }
}
