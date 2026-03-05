import { PartialType } from '@nestjs/mapped-types';
import { CreateEmployeeDto } from './create-employee.dto';
import { IsOptional, IsString, IsPhoneNumber } from 'class-validator';

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {
  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsPhoneNumber('VN') // Validates phone format (vietnam)
  phone?: string;

  @IsOptional()
  @IsString()
  emergencyName?: string;

  @IsOptional()
  @IsPhoneNumber('VN')
  emergencyPhone?: string;
}