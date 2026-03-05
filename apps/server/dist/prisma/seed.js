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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const faker_1 = require("@faker-js/faker");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🧹 Cleaning database...');
    await prisma.auditLog.deleteMany();
    await prisma.payroll.deleteMany();
    await prisma.leaveRequest.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.employee.deleteMany();
    console.log('🌱 Seeding data...');
    const salt = await bcrypt.genSalt();
    const commonPassword = await bcrypt.hash('Welcome123!', salt);
    const admin = await prisma.employee.create({
        data: {
            fullName: 'Sterling Archer',
            workEmail: 'admin@hrms.internal',
            passwordHash: commonPassword,
            role: client_1.Role.ADMIN_HR,
            status: client_1.EmployeeStatus.ACTIVE,
            department: 'Operations',
            jobTitle: 'Quartermaster',
            joinDate: new Date('2024-01-01'),
            basicSalary: 50000000,
        },
    });
    console.log(`   Created Admin: ${admin.workEmail}`);
    const departments = ['Engineering', 'Marketing', 'Human Resources', 'Finance'];
    for (const dept of departments) {
        const manager = await prisma.employee.create({
            data: {
                fullName: faker_1.faker.person.fullName(),
                workEmail: faker_1.faker.internet.email().toLowerCase(),
                passwordHash: commonPassword,
                role: client_1.Role.MANAGER,
                status: client_1.EmployeeStatus.ACTIVE,
                department: dept,
                jobTitle: `${dept} Manager`,
                joinDate: faker_1.faker.date.past({ years: 2 }),
                basicSalary: 35000000,
            },
        });
        for (let i = 0; i < 5; i++) {
            const employee = await prisma.employee.create({
                data: {
                    fullName: faker_1.faker.person.fullName(),
                    workEmail: faker_1.faker.internet.email().toLowerCase(),
                    passwordHash: commonPassword,
                    role: client_1.Role.EMPLOYEE,
                    status: client_1.EmployeeStatus.ACTIVE,
                    department: dept,
                    jobTitle: `${dept} Specialist`,
                    joinDate: faker_1.faker.date.past({ years: 1 }),
                    basicSalary: faker_1.faker.number.int({ min: 10000000, max: 25000000 }),
                    managerId: manager.id,
                },
            });
            const today = new Date();
            for (let d = 0; d < 30; d++) {
                const date = new Date();
                date.setDate(today.getDate() - d);
                if (date.getDay() !== 0 && date.getDay() !== 6) {
                    const rand = Math.random();
                    let status = client_1.AttendanceStatus.PRESENT;
                    let workedDays = 1.0;
                    if (rand > 0.95) {
                        status = client_1.AttendanceStatus.ABSENT;
                        workedDays = 0.0;
                    }
                    else if (rand > 0.9) {
                        status = client_1.AttendanceStatus.LATE;
                        workedDays = 1.0;
                    }
                    else if (rand > 0.85) {
                        status = client_1.AttendanceStatus.HALF_DAY;
                        workedDays = 0.5;
                    }
                    await prisma.attendance.create({
                        data: {
                            employeeId: employee.id,
                            date: date,
                            status: status,
                            workedDays: workedDays,
                            checkInTime: status === client_1.AttendanceStatus.ABSENT ? null : new Date(date.setHours(8, 30, 0)),
                            checkOutTime: status === client_1.AttendanceStatus.ABSENT ? null : new Date(date.setHours(17, 30, 0)),
                        },
                    });
                }
            }
            if (Math.random() > 0.5) {
                await prisma.leaveRequest.create({
                    data: {
                        employeeId: employee.id,
                        leaveType: client_1.LeaveType.ANNUAL,
                        startDate: faker_1.faker.date.future(),
                        endDate: faker_1.faker.date.future(),
                        reason: 'Family vacation',
                        status: client_1.LeaveStatus.PENDING,
                    },
                });
            }
        }
    }
    console.log('✅ Seeding complete. The world is now populated.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map