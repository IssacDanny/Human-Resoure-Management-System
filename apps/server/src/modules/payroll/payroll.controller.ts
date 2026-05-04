import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  Res,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { Request } from 'express';
import type { Response } from 'express';

@Controller()
@UseGuards(JwtAuthGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('payroll-runs')
  async generatePayroll(@Body() dto: GeneratePayrollDto, @Req() req: Request) {
    const user = req.user as any;
    if (user.role !== 'ADMIN_HR' && user.role !== 'MANAGER') {
      throw new ForbiddenException('Only HR and Managers can generate payroll');
    }
    return this.payrollService.generatePayroll(dto);
  }

  @Post('payroll-runs/manual')
  async createManualPayroll(@Body() body: any, @Req() req: Request) {
    const user = req.user as any;
    if (user.role !== 'ADMIN_HR' && user.role !== 'MANAGER') {
      throw new ForbiddenException('Only HR and Managers can create payroll');
    }
    // Convert string inputs to numbers
    const dto = {
      ...body,
      employeeId: Number(body.employeeId),
      standardWorkingDays: Number(body.standardWorkingDays) || 22,
      actualWorkedDays: Number(body.actualWorkedDays) || 22,
      snapshotBasicSalary: Number(body.snapshotBasicSalary) || 0,
      allowance: Number(body.allowance) || 0,
      bonus: Number(body.bonus) || 0,
      deduction: Number(body.deduction) || 0,
      netSalary: Number(body.netSalary) || 0,
    };
    return this.payrollService.createManualPayroll(dto);
  }

  @Get('payslips')
  async listPayslips(@Req() req: Request, @Query() query: any) {
    const user = req.user as any;
    return this.payrollService.getPayslips(query, user);
  }

  @Get('payroll-reports/export')
  async exportReport(@Query('month') month: string, @Res() res: Response) {
    // 1. Validate the input
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      throw new BadRequestException(
        'A valid month in YYYY-MM format is required.',
      );
    }

    // TODO: Add @RolesGuard to ensure only ADMIN_HR can download this report

    // 2. Generate the Excel Buffer
    const buffer = await this.payrollService.generateExcelReport(month);

    // 3. Set the HTTP Headers for a file download
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Payroll_Report_${month}.xlsx"`,
      'Content-Length': buffer.length,
    });

    // 4. Send the file
    res.end(buffer);
  }
}
