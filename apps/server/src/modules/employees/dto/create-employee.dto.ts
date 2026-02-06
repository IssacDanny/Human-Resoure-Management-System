export class CreateEmployeeDto {
  // TODO: Add validation decorators (@IsString, @IsEmail, etc.)
  fullName: string;
  workEmail: string;
  departmentId: string;
  jobTitle: string;
  basicSalary: number;
  joinDate: string;
  role: 'admin' | 'manager' | 'employee';
}