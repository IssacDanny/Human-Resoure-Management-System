import { Injectable, Inject } from '@nestjs/common';
import { PayrollRepository } from './payroll.repository';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';
import { EmployeesService } from '../employees/employees.service';
import { AttendanceService } from '../attendance/attendance.service';
import { ISalaryStrategy } from './strategies/salary-strategy.interface';
import { StandardVietnameseStrategy } from './strategies/standard-vietnamese.strategy';
import * as ExcelJS from 'exceljs';

@Injectable()
export class PayrollService {
  private salaryStrategy: ISalaryStrategy;

  constructor(
    private readonly repository: PayrollRepository,
    private readonly employeesService: EmployeesService,
    private readonly attendanceService: AttendanceService,
    // Injecting the concrete strategy for now. 
    // In a multi-tenant system, this could be resolved dynamically.
    private readonly defaultStrategy: StandardVietnameseStrategy, 
  ) {
    this.salaryStrategy = this.defaultStrategy;
  }

  /**
   * The Core Payroll Algorithm.
   */
  async generatePayroll(dto: GeneratePayrollDto) {
    const [yearStr, monthStr] = dto.month.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);

    // 1. Fetch all active employees
    // Note: In a real system, you'd fetch this in batches to avoid memory issues.
    const response = await this.employeesService.findAll({ limit: 1000 });
    const employees = response.data; // Extract the array from the wrapper

    let processedCount = 0;
    let totalPayout = 0;

    for (const emp of employees) {
      // 2. ISP in action: Get the IPayable representation
      const payableEntity = await this.employeesService.getPayableEntity(emp.id);

      // 3. Get actual worked days from the Timekeeper
      const actualWorkedDays = await this.attendanceService.getMonthlySummary(emp.id, dto.month);

      // 4. Calculate Gross Salary: (Basic / Standard) * Actual
      const dailyRate = payableEntity.basicSalary / dto.standardWorkingDays;
      const grossSalary = dailyRate * actualWorkedDays;

      // 5. Apply Strategy (Taxes & Deductions)
      const deductions = this.salaryStrategy.calculateDeductions(grossSalary);
      const tax = this.salaryStrategy.calculateTax(grossSalary);
      
      // Allowances and bonuses would be fetched here in a full implementation
      const allowance = 0; 
      const bonus = 0;

      const netSalary = grossSalary + allowance + bonus - deductions - tax;

      // 6. Save the Snapshot (The Payslip)
      await this.repository.upsert({
        where: { employeeId: emp.id, month, year },
        create: {
          employee: { connect: { id: emp.id } },
          month,
          year,
          standardWorkingDays: dto.standardWorkingDays,
          actualWorkedDays,
          snapshotBasicSalary: payableEntity.basicSalary,
          allowance,
          bonus,
          deduction: deductions + tax,
          netSalary,
        },
        update: {
          standardWorkingDays: dto.standardWorkingDays,
          actualWorkedDays,
          snapshotBasicSalary: payableEntity.basicSalary,
          allowance,
          bonus,
          deduction: deductions + tax,
          netSalary,
          generatedAt: new Date(), // Update timestamp on regeneration
        },
      });

      processedCount++;
      totalPayout += netSalary;
    }

    return {
      month: dto.month,
      processedCount,
      totalPayout,
      generatedAt: new Date().toISOString(),
    };
  }

  async getPayslips(query: any, currentUser: any) {
    const [year, month] = query['filter[month]'].split('-');
    const whereClause: any = {
      month: Number(month),
      year: Number(year),
    };

    // RBAC: Employees only see their own payslips
    if (currentUser.role === 'EMPLOYEE') {
      whereClause.employeeId = currentUser.id;
    } else if (query['filter[employeeId]']) {
      whereClause.employeeId = query['filter[employeeId]'];
    }

    return this.repository.findMany({ where: whereClause });
  }

  /**
   * Generates an Excel workbook for the specified month's payroll.
   * 
   * @param monthString - Format YYYY-MM
   * @returns A Buffer containing the .xlsx file data
   */
  async generateExcelReport(monthString: string): Promise<Buffer> {
    const [year, month] = monthString.split('-');
    
    // 1. Fetch the data (including employee details)
    const payrolls = await this.repository.findMany({
      where: {
        month: Number(month),
        year: Number(year),
      },
    });

    // 2. Initialize the Workbook and Worksheet
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'HRMS System';
    workbook.created = new Date();
    
    const worksheet = workbook.addWorksheet(`Payroll ${monthString}`);

    // 3. Define the Columns
    worksheet.columns =[
      { header: 'Employee ID', key: 'empId', width: 38 },
      { header: 'Full Name', key: 'name', width: 30 },
      { header: 'Standard Days', key: 'standardDays', width: 15 },
      { header: 'Worked Days', key: 'workedDays', width: 15 },
      { header: 'Basic Salary (VND)', key: 'basic', width: 20 },
      { header: 'Allowances (VND)', key: 'allowance', width: 20 },
      { header: 'Deductions & Tax (VND)', key: 'deduction', width: 25 },
      { header: 'Net Salary (VND)', key: 'net', width: 20 },
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { horizontal: 'center' };

    // 4. Populate the Rows
    payrolls.forEach((record) => {
      worksheet.addRow({
        empId: record.employeeId,
        name: (record as any).employee?.fullName || 'Unknown', // Assuming relation is loaded by repository
        standardDays: record.standardWorkingDays,
        workedDays: Number(record.actualWorkedDays),
        basic: Number(record.snapshotBasicSalary),
        allowance: Number(record.allowance) + Number(record.bonus),
        deduction: Number(record.deduction),
        net: Number(record.netSalary),
      });
    });

    // Format currency columns
    const currencyFormat = '#,##0';
    ['E', 'F', 'G', 'H'].forEach(col => {
      worksheet.getColumn(col).numFmt = currencyFormat;
    });

    // 5. Write to Buffer and return
    const buffer = await workbook.xlsx.writeBuffer();
    return (buffer as unknown) as Buffer;
  }
}

