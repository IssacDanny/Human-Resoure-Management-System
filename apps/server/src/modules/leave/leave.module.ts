import { Module } from '@nestjs/common';
import { LeaveService } from './leave.service';
import { LeaveController } from './leave.controller';
import { LeaveRepository } from './leave.repository';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers:[LeaveController],
  providers: [LeaveService, LeaveRepository, PrismaService],
})
export class LeaveModule {}