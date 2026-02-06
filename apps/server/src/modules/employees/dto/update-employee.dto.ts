import { PartialType } from '@nestjs/mapped-types';
import { CreateEmployeeDto } from './create-employee.dto';

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {
  // TODO: Add specific fields that are allowed to be updated (e.g. phone, address)
  // Refer to the API Spec for exactly which fields are editable.
}