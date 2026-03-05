import { IsNotEmpty, IsNumber, IsString, Matches, Min } from 'class-validator';

export class GeneratePayrollDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'Month must be in YYYY-MM format' })
  month: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  standardWorkingDays: number; // e.g., 22 or 26 days
}