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
exports.LeaveService = void 0;
const common_1 = require("@nestjs/common");
const leave_repository_1 = require("./leave.repository");
const client_1 = require("@prisma/client");
let LeaveService = class LeaveService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async submitRequest(employeeId, dto) {
        const start = new Date(dto.startDate);
        const end = new Date(dto.endDate);
        if (start > end) {
            throw new common_1.BadRequestException('Start date cannot be after end date.');
        }
        return this.repository.create({
            employee: { connect: { id: employeeId } },
            leaveType: dto.leaveType,
            startDate: start,
            endDate: end,
            reason: dto.reason,
            status: client_1.LeaveStatus.PENDING,
        });
    }
    async getRequests(query, currentUser) {
        const take = query.limit ? Number(query.limit) : 25;
        const skip = query.offset ? Number(query.offset) : 0;
        const whereClause = {};
        if (query['filter[status]']) {
            whereClause.status = query['filter[status]'].toUpperCase();
        }
        if (currentUser.role === 'EMPLOYEE') {
            whereClause.employeeId = currentUser.id;
        }
        return this.repository.findMany({
            take,
            skip,
            where: whereClause,
            orderBy: { createdAt: 'desc' },
        });
    }
    async getRequestById(id) {
        const request = await this.repository.findById(id);
        if (!request)
            throw new common_1.NotFoundException('Leave request not found.');
        return request;
    }
    async updateStatus(requestId, managerId, dto) {
        const request = await this.getRequestById(requestId);
        if (request.status !== client_1.LeaveStatus.PENDING) {
            throw new common_1.BadRequestException(`Cannot update a request that is already ${request.status}.`);
        }
        return this.repository.update({
            where: { id: requestId },
            data: {
                status: dto.status,
                rejectionReason: dto.status === client_1.LeaveStatus.REJECTED ? dto.rejectionReason : null,
                decider: { connect: { id: managerId } },
                decidedAt: new Date(),
            },
        });
    }
};
exports.LeaveService = LeaveService;
exports.LeaveService = LeaveService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [leave_repository_1.LeaveRepository])
], LeaveService);
//# sourceMappingURL=leave.service.js.map