import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Req, ParseUUIDPipe } from '@nestjs/common';
import { LeaveService } from './leave.service';
import { CreateLeaveRequestDto } from './dto/create-leave.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { Request } from 'express';

@Controller('leave-requests')
@UseGuards(JwtAuthGuard)
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Post()
  async submitRequest(@Req() req: Request, @Body() createDto: CreateLeaveRequestDto) {
    const user = req.user as any; // Extracted from JWT
    return this.leaveService.submitRequest(user.id, createDto);
  }

  @Get()
  async listRequests(@Req() req: Request, @Query() query: any) {
    const user = req.user as any;
    const data = await this.leaveService.getRequests(query, user);
    
    return {
      data,
      pagination: { hasNextPage: false, nextCursor: null } // Mocked pagination wrapper
    };
  }

  @Get(':id')
  async getRequest(@Param('id', ParseUUIDPipe) id: string) {
    return this.leaveService.getRequestById(id);
  }

  @Patch(':id')
  async updateStatus(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateLeaveStatusDto
  ) {
    const user = req.user as any;
    // Only Managers or Admins should be able to do this. 
    // A custom @RolesGuard would be ideal here.
    return this.leaveService.updateStatus(id, user.id, updateDto);
  }
}