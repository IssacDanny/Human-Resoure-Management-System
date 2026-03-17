import { EmployeeSummary } from './employee';

export interface LeaveRequest {
  id: string;
  employee?: EmployeeSummary;
  leaveType: 'annual' | 'sick' | 'unpaid';
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string | null;
  createdAt: string; // ISO Date-Time
  decidedAt?: string | null;
}

export interface CreateLeaveRequest {
  leaveType: 'annual' | 'sick' | 'unpaid';
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface UpdateLeaveStatusRequest {
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}
