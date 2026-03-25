import {
  IsEmail,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';
import { Role } from '@prisma/client';

export class CreateEmployeeDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsEmail()
  workEmail: string;

  @IsNotEmpty()
  @IsString()
  departmentId: string;

  @IsNotEmpty()
  @IsString()
  jobTitle: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  basicSalary: number;

  @IsNotEmpty()
  @IsISO8601()
  joinDate: string;

  @IsNotEmpty()
  @IsEnum(Role)
  role: Role;
}