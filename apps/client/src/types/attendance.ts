export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;          // YYYY-MM-DD
  checkInTime?: string | null;  // ISO Date-Time
  checkOutTime?: string | null; // ISO Date-Time
  status: 'present' | 'absent' | 'late' | 'half_day';
  notes?: string | null;
}

export interface UpsertAttendanceRequest {
  employeeId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'half_day';
  checkInTime?: string | null;
  checkOutTime?: string | null;
  notes?: string;
}
