import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';
import { LeaveStatus } from '@prisma/client';

export class UpdateLeaveStatusDto {
  @IsNotEmpty()
  @IsEnum(LeaveStatus)
  status: LeaveStatus; // Only APPROVED or REJECTED should be passed here

  // If status is REJECTED, rejectionReason becomes required
  @ValidateIf(o => o.status === LeaveStatus.REJECTED)
  @IsNotEmpty({ message: 'A rejection reason is required when rejecting a leave request.' })
  @IsString()
  rejectionReason?: string;
}