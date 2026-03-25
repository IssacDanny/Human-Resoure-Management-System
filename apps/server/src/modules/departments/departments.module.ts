import { Module } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { DepartmentsController } from './departments.controller';
import { DepartmentsRepository } from './departments.repository';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [DepartmentsController],
  providers: [
    DepartmentsService,
    DepartmentsRepository,
    PrismaService, // Inject Prisma so the Repository can use it
  ],
  exports: [DepartmentsService], // Export Service if other modules need it
})
export class DepartmentsModule {}