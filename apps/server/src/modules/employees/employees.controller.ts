import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

/**
 * EmployeeController
 * 
 * RESPONSIBILITY:
 * - Handles incoming HTTP requests for the /employees route.
 * - Validates input data using DTOs.
 * - Delegates business logic to the EmployeesService.
 * - Returns the final response to the client.
 * 
 * RESTRICTIONS:
 * - NO business logic (e.g., calculating salaries, checking permissions) here.
 * - NO direct database access.
 */
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  /**
   * Registers a new employee in the system.
   * 
   * @param createEmployeeDto - The data required to create an employee.
   * @returns The created employee object.
   */
  @Post()
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    // TODO: Call the service to register the employee
    return this.employeesService.registerNewEmployee(createEmployeeDto);
  }

  /**
   * Retrieves a paginated list of employees.
   * 
   * @param query - Query parameters for pagination (limit, after) and filtering.
   * @returns A list of employees and pagination cursor.
   */
  @Get()
  findAll(@Query() query: any) {
    // TODO: Extract limit/after from query and pass to service
    return this.employeesService.findAll(query);
  }

  /**
   * Retrieves a single employee by their unique ID.
   * 
   * @param id - The UUID of the employee.
   * @returns The employee details.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  /**
   * Updates an existing employee's profile.
   * 
   * @param id - The UUID of the employee.
   * @param updateEmployeeDto - The fields to update.
   * @returns The updated employee object.
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto) {
    return this.employeesService.updateProfile(id, updateEmployeeDto);
  }
}