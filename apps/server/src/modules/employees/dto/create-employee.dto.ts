import {
  IsEmail,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';

export enum Role {
  admin = 'admin',
  manager = 'manager',
  employee = 'employee',
}

export class CreateEmployeeDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsEmail()
  workEmail: string;

  @IsNotEmpty()
  @IsString()
  department: string; // For MVP, this is just a string. Later, a relation.

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
