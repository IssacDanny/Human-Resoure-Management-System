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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const attendance_repository_1 = require("./attendance.repository");
const client_1 = require("@prisma/client");
let AttendanceService = class AttendanceService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async recordDailyAttendance(dto) {
        const targetDate = new Date(dto.date);
        let workedDays = 0;
        switch (dto.status) {
            case client_1.AttendanceStatus.PRESENT:
            case client_1.AttendanceStatus.LATE:
                workedDays = 1.0;
                break;
            case client_1.AttendanceStatus.HALF_DAY:
                workedDays = 0.5;
                break;
            case client_1.AttendanceStatus.ABSENT:
                workedDays = 0.0;
                break;
        }
        return this.repository.upsert({
            where: {
                employeeId: dto.employeeId,
                date: targetDate,
            },
            create: {
                employee: { connect: { id: dto.employeeId } },
                date: targetDate,
                status: dto.status,
                checkInTime: dto.checkInTime ? new Date(dto.checkInTime) : null,
                checkOutTime: dto.checkOutTime ? new Date(dto.checkOutTime) : null,
                workedDays,
                note: dto.note,
            },
            update: {
                status: dto.status,
                checkInTime: dto.checkInTime ? new Date(dto.checkInTime) : null,
                checkOutTime: dto.checkOutTime ? new Date(dto.checkOutTime) : null,
                workedDays,
                note: dto.note,
            },
        });
    }
    async getRecords(query) {
        const take = query.limit ? Number(query.limit) : 25;
        const skip = query.offset ? Number(query.offset) : 0;
        const whereClause = {};
        if (query['filter[employeeId]']) {
            whereClause.employeeId = query['filter[employeeId]'];
        }
        if (query['filter[month]']) {
            const [year, month] = query['filter[month]'].split('-');
            const startDate = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
            const endDate = new Date(Date.UTC(Number(year), Number(month), 0, 23, 59, 59));
            whereClause.date = {
                gte: startDate,
                lte: endDate,
            };
        }
        return this.repository.findMany({
            take,
            skip,
            where: whereClause,
            orderBy: { date: 'desc' },
        });
    }
    async getMonthlySummary(employeeId, monthString) {
        const [year, month] = monthString.split('-');
        const startDate = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
        const endDate = new Date(Date.UTC(Number(year), Number(month), 0, 23, 59, 59));
        const records = await this.repository.findMany({
            where: {
                employeeId,
                date: { gte: startDate, lte: endDate },
            }
        });
        const totalDays = records.reduce((sum, record) => sum + Number(record.workedDays), 0);
        return totalDays;
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [attendance_repository_1.AttendanceRepository])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map