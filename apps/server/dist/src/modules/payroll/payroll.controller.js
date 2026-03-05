"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollController = void 0;
const common_1 = require("@nestjs/common");
const payroll_service_1 = require("./payroll.service");
const generate_payroll_dto_1 = require("./dto/generate-payroll.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
let PayrollController = class PayrollController {
    payrollService;
    constructor(payrollService) {
        this.payrollService = payrollService;
    }
    async generatePayroll(dto) {
        return this.payrollService.generatePayroll(dto);
    }
    async listPayslips(req, query) {
        const user = req.user;
        const data = await this.payrollService.getPayslips(query, user);
        return {
            data,
            pagination: { hasNextPage: false, nextCursor: null }
        };
    }
    async exportReport(month, res) {
        if (!month || !/^\d{4}-\d{2}$/.test(month)) {
            throw new common_1.BadRequestException('A valid month in YYYY-MM format is required.');
        }
        const buffer = await this.payrollService.generateExcelReport(month);
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="Payroll_Report_${month}.xlsx"`,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }
};
exports.PayrollController = PayrollController;
__decorate([
    (0, common_1.Post)('payroll-runs'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_payroll_dto_1.GeneratePayrollDto]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "generatePayroll", null);
__decorate([
    (0, common_1.Get)('payslips'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "listPayslips", null);
__decorate([
    (0, common_1.Get)('payroll-reports/export'),
    __param(0, (0, common_1.Query)('month')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "exportReport", null);
exports.PayrollController = PayrollController = __decorate([
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [payroll_service_1.PayrollService])
], PayrollController);
//# sourceMappingURL=payroll.controller.js.map