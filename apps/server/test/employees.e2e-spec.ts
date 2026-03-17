import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('EmployeesController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply the same validation pipe used in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /employees', () => {
    it('should reject requests with basicSalary < 1', () => {
      return request(app.getHttpServer())
        .post('/employees')
        .send({
          fullName: 'Test Employee Zero Salary',
          workEmail: 'test.zerosalary@company.com',
          department: 'Engineering',
          jobTitle: 'Developer',
          basicSalary: -1, // This should trigger validation error since min is 0 now
          joinDate: '2023-10-01',
          role: 'employee',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual('Validation failed');
          expect(res.body.details).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                issue: 'basicSalary must not be less than 0',
              }),
            ]),
          );
        });
    });

    it('should reject requests missing required fields', () => {
      return request(app.getHttpServer())
        .post('/employees')
        .send({
          fullName: 'Incomplete Employee',
        })
        .expect(400);
    });

    it('should create an employee when valid data is provided', () => {
      // Use a random email to avoid unique constraint conflicts on multiple test runs
      const randomSuffix = Math.floor(Math.random() * 100000);

      return request(app.getHttpServer())
        .post('/employees')
        .send({
          fullName: 'Valid Employee',
          workEmail: `valid.employee.${randomSuffix}@company.com`,
          department: 'Engineering',
          jobTitle: 'Developer',
          basicSalary: 20000,
          joinDate: '2024-01-01',
          role: 'employee',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.fullName).toEqual('Valid Employee');
          // Prisma returns Decimals as strings to avoid precision loss
          expect(Number(res.body.basicSalary)).toEqual(20000);
          expect(res.body.id).toBeDefined();
        });
    });
  });
});
