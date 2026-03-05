import { IsDateString, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { LeaveType } from '@prisma/client';

export class CreateLeaveRequestDto {
  @IsNotEmpty()
  @IsEnum(LeaveType)
  leaveType: LeaveType;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(5, { message: 'Reason must be at least 5 characters long.' })
  reason: string;
}