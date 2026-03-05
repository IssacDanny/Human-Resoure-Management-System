import { Controller, Get, Post, Body, Patch, Param, Query, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  // @UseGuards(JwtAuthGuard) // Uncomment to protect this route
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.registerNewEmployee(createEmployeeDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() query: any) {
    return this.employeesService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.employeesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateEmployeeDto: UpdateEmployeeDto
  ) {
    return this.employeesService.updateProfile(id, updateEmployeeDto);
  }
}