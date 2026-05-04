import { IsNotEmpty, IsNumber, IsString, Matches, Min, IsOptional } from 'class-validator';

export class GeneratePayrollDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'Month must be in YYYY-MM format' })
  month: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  standardWorkingDays: number; // e.g., 22 or 26 days

  /** Optional manual overrides - if provided, these bypass auto-calculation */
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualWorkedDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  snapshotBasicSalary?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  allowance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bonus?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deduction?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  netSalary?: number;
}
