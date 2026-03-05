"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollService = void 0;
const common_1 = require("@nestjs/common");
const payroll_repository_1 = require("./payroll.repository");
const employees_service_1 = require("../employees/employees.service");
const attendance_service_1 = require("../attendance/attendance.service");
const standard_vietnamese_strategy_1 = require("./strategies/standard-vietnamese.strategy");
const ExcelJS = __importStar(require("exceljs"));
let PayrollService = class PayrollService {
    repository;
    employeesService;
    attendanceService;
    defaultStrategy;
    salaryStrategy;
    constructor(repository, employeesService, attendanceService, defaultStrategy) {
        this.repository = repository;
        this.employeesService = employeesService;
        this.attendanceService = attendanceService;
        this.defaultStrategy = defaultStrategy;
        this.salaryStrategy = this.defaultStrategy;
    }
    async generatePayroll(dto) {
        const [yearStr, monthStr] = dto.month.split('-');
        const year = Number(yearStr);
        const month = Number(monthStr);
        const response = await this.employeesService.findAll({ limit: 1000 });
        const employees = response.data;
        let processedCount = 0;
        let totalPayout = 0;
        for (const emp of employees) {
            const payableEntity = await this.employeesService.getPayableEntity(emp.id);
            const actualWorkedDays = await this.attendanceService.getMonthlySummary(emp.id, dto.month);
            const dailyRate = payableEntity.basicSalary / dto.standardWorkingDays;
            const grossSalary = dailyRate * actualWorkedDays;
            const deductions = this.salaryStrategy.calculateDeductions(grossSalary);
            const tax = this.salaryStrategy.calculateTax(grossSalary);
            const allowance = 0;
            const bonus = 0;
            const netSalary = grossSalary + allowance + bonus - deductions - tax;
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
                    generatedAt: new Date(),
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
    async getPayslips(query, currentUser) {
        const [year, month] = query['filter[month]'].split('-');
        const whereClause = {
            month: Number(month),
            year: Number(year),
        };
        if (currentUser.role === 'EMPLOYEE') {
            whereClause.employeeId = currentUser.id;
        }
        else if (query['filter[employeeId]']) {
            whereClause.employeeId = query['filter[employeeId]'];
        }
        return this.repository.findMany({ where: whereClause });
    }
    async generateExcelReport(monthString) {
        const [year, month] = monthString.split('-');
        const payrolls = await this.repository.findMany({
            where: {
                month: Number(month),
                year: Number(year),
            },
        });
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'HRMS System';
        workbook.created = new Date();
        const worksheet = workbook.addWorksheet(`Payroll ${monthString}`);
        worksheet.columns = [
            { header: 'Employee ID', key: 'empId', width: 38 },
            { header: 'Full Name', key: 'name', width: 30 },
            { header: 'Standard Days', key: 'standardDays', width: 15 },
            { header: 'Worked Days', key: 'workedDays', width: 15 },
            { header: 'Basic Salary (VND)', key: 'basic', width: 20 },
            { header: 'Allowances (VND)', key: 'allowance', width: 20 },
            { header: 'Deductions & Tax (VND)', key: 'deduction', width: 25 },
            { header: 'Net Salary (VND)', key: 'net', width: 20 },
        ];
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).alignment = { horizontal: 'center' };
        payrolls.forEach((record) => {
            worksheet.addRow({
                empId: record.employeeId,
                name: record.employee?.fullName || 'Unknown',
                standardDays: record.standardWorkingDays,
                workedDays: Number(record.actualWorkedDays),
                basic: Number(record.snapshotBasicSalary),
                allowance: Number(record.allowance) + Number(record.bonus),
                deduction: Number(record.deduction),
                net: Number(record.netSalary),
            });
        });
        const currencyFormat = '#,##0';
        ['E', 'F', 'G', 'H'].forEach(col => {
            worksheet.getColumn(col).numFmt = currencyFormat;
        });
        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;
    }
};
exports.PayrollService = PayrollService;
exports.PayrollService = PayrollService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [payroll_repository_1.PayrollRepository,
        employees_service_1.EmployeesService,
        attendance_service_1.AttendanceService,
        standard_vietnamese_strategy_1.StandardVietnameseStrategy])
], PayrollService);
//# sourceMappingURL=payroll.service.js.map