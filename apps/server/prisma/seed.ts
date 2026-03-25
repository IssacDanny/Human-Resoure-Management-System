import { PrismaClient, Role, EmployeeStatus, AttendanceStatus, LeaveType, LeaveStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning database...');
  // Delete in order to respect Foreign Keys
  await prisma.auditLog.deleteMany();
  await prisma.payroll.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.employee.deleteMany();

  console.log('🌱 Seeding data...');

  // 1. Prepare the common password
  const salt = await bcrypt.genSalt();
  const commonPassword = await bcrypt.hash('Welcome123!', salt);

  // 2. Create the Super Admin (The one you will use)
  const admin = await prisma.employee.create({
    data: {
      fullName: 'Sterling Archer',
      workEmail: 'admin@hrms.internal',
      passwordHash: commonPassword,
      role: Role.ADMIN_HR,
      status: EmployeeStatus.ACTIVE,
      department: 'Operations',
      jobTitle: 'Quartermaster',
      joinDate: new Date('2024-01-01'),
      basicSalary: 50000000,
    },
  });
  console.log(`   Created Admin: ${admin.workEmail}`);

  // 3. Create Departments Structure
  const departments = ['Engineering', 'Marketing', 'Human Resources', 'Finance'];
  
  for (const dept of departments) {
    // A. Create one Manager per department
    const manager = await prisma.employee.create({
      data: {
        fullName: faker.person.fullName(),
        workEmail: faker.internet.email().toLowerCase(),
        passwordHash: commonPassword,
        role: Role.MANAGER,
        status: EmployeeStatus.ACTIVE,
        department: dept,
        jobTitle: `${dept} Manager`,
        joinDate: faker.date.past({ years: 2 }),
        basicSalary: 35000000,
      },
    });

    // B. Create 5 Employees for this manager
    for (let i = 0; i < 5; i++) {
      const employee = await prisma.employee.create({
        data: {
          fullName: faker.person.fullName(),
          workEmail: faker.internet.email().toLowerCase(),
          passwordHash: commonPassword,
          role: Role.EMPLOYEE,
          status: EmployeeStatus.ACTIVE,
          department: dept,
          jobTitle: `${dept} Specialist`,
          joinDate: faker.date.past({ years: 1 }),
          basicSalary: faker.number.int({ min: 10000000, max: 25000000 }),
          managerId: manager.id, // Hierarchy
        },
      });

      // C. Seed Attendance for the last 30 days
      const today = new Date();
      for (let d = 0; d < 30; d++) {
        const date = new Date();
        date.setDate(today.getDate() - d);
        
        // Skip weekends (0 = Sunday, 6 = Saturday)
        if (date.getDay() !== 0 && date.getDay() !== 6) {
          // Randomize status: Mostly PRESENT, sometimes LATE or ABSENT
          const rand = Math.random();
          let status: AttendanceStatus = AttendanceStatus.PRESENT;
          let workedDays = 1.0;

          if (rand > 0.95) { status = AttendanceStatus.ABSENT; workedDays = 0.0; }
          else if (rand > 0.9) { status = AttendanceStatus.LATE; workedDays = 1.0; }
          else if (rand > 0.85) { status = AttendanceStatus.HALF_DAY; workedDays = 0.5; }

          await prisma.attendance.create({
            data: {
              employeeId: employee.id,
              date: date,
              status: status,
              workedDays: workedDays,
              checkInTime: status === AttendanceStatus.ABSENT ? null : new Date(date.setHours(8, 30, 0)),
              checkOutTime: status === AttendanceStatus.ABSENT ? null : new Date(date.setHours(17, 30, 0)),
            },
          });
        }
      }

      // D. Seed a Leave Request
      if (Math.random() > 0.5) {
        await prisma.leaveRequest.create({
          data: {
            employeeId: employee.id,
            leaveType: LeaveType.ANNUAL,
            startDate: faker.date.future(),
            endDate: faker.date.future(),
            reason: 'Family vacation',
            status: LeaveStatus.PENDING,
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