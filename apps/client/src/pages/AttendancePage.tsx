import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../api/config';
import { type AttendanceRecord } from '../types/attendance';
import { type Employee } from '../types/employee';

export function AttendancePage() {
  const { token, isAdmin, isManager } = useAuth();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'my-attendance' | 'manage-attendance'>('my-attendance');
  
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  
  // My attendance state
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Manage attendance state
  const [manageMonth, setManageMonth] = useState(now.getMonth() + 1);
  const [manageYear, setManageYear] = useState(now.getFullYear());
  const [manageRecords, setManageRecords] = useState<AttendanceRecord[]>([]);
  const [manageLoading, setManageLoading] = useState(false);
  const [manageError, setManageError] = useState<string | null>(null);
  
  // Employee search state
  const [searchQuery, setSearchQuery] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Fetch my attendance
  useEffect(() => {
    async function fetchAttendance() {
      if (!token) return;
      setLoading(true);
      setError(null);
      setMessage(null);

      try {
        const response = await fetch(`${API_BASE_URL}/attendance?month=${month}&year=${year}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch attendance records');

        const result = await response.json();
        setRecords(result.data);
        if (result.message) setMessage(result.message);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchAttendance();
  }, [token, month, year]);

  // Search employees as user types
  useEffect(() => {
    async function searchEmployees() {
      if (!token || !searchQuery.trim()) {
        setEmployees([]);
        return;
      }

      setSearchLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/employees?search=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to search employees');

        const result = await response.json();
        setEmployees(result.data || []);
      } catch (err) {
        console.error('Search error:', err);
        setEmployees([]);
      } finally {
        setSearchLoading(false);
      }
    }

    const debounce = setTimeout(searchEmployees, 300);
    return () => clearTimeout(debounce);
  }, [token, searchQuery]);

  // Fetch attendance for a given employee, month, and year
  const fetchEmployeeAttendance = async (employee: Employee, m: number, y: number) => {
    if (!token) return;
    setManageError(null);
    setManageLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/attendance?month=${m}&year=${y}&filter[employeeId]=${employee.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch employee attendance');

      const result = await response.json();
      setManageRecords(result.data);
    } catch (err) {
      setManageError((err as Error).message);
    } finally {
      setManageLoading(false);
    }
  };

  // When employee is chosen, or month/year changes, re-fetch
  useEffect(() => {
    if (selectedEmployee && token) {
      fetchEmployeeAttendance(selectedEmployee, manageMonth, manageYear);
    }
  }, [selectedEmployee, manageMonth, manageYear, token]);

  const handleSelectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setSearchQuery('');
    setShowDropdown(false);
  };

  // Calculate stats
  const stats = useMemo(() => {
    return {
      present: records.filter(r => r.status.toUpperCase() === 'PRESENT').length,
      late: records.filter(r => r.status.toUpperCase() === 'LATE').length,
      absent: records.filter(r => r.status.toUpperCase() === 'ABSENT').length,
      halfDay: records.filter(r => r.status.toUpperCase() === 'HALF_DAY').length,
    };
  }, [records]);

  const manageStats = useMemo(() => {
    return {
      present: manageRecords.filter(r => r.status.toUpperCase() === 'PRESENT').length,
      late: manageRecords.filter(r => r.status.toUpperCase() === 'LATE').length,
      absent: manageRecords.filter(r => r.status.toUpperCase() === 'ABSENT').length,
      halfDay: manageRecords.filter(r => r.status.toUpperCase() === 'HALF_DAY').length,
    };
  }, [manageRecords]);

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          HRMS · Timekeeper
        </div>
        <h1 className="page-title">Attendance Management</h1>
        <p className="page-subtitle">Track your working hours and attendance records.</p>
      </header>

      <div className="form-card" style={{ padding: '0', overflow: 'hidden' }}>
        {/* TAB NAVIGATION */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
          <button
            onClick={() => setActiveTab('my-attendance')}
            style={{
              flex: 1,
              padding: '16px 24px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'my-attendance' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === 'my-attendance' ? '600' : '500',
              borderBottom: activeTab === 'my-attendance' ? '2px solid var(--color-primary)' : 'none',
              marginBottom: activeTab === 'my-attendance' ? '-1px' : '0',
              transition: 'all 0.2s ease'
            }}
          >
            My Attendance
          </button>
          {(isAdmin || isManager) && (
            <button
              onClick={() => setActiveTab('manage-attendance')}
              style={{
                flex: 1,
                padding: '16px 24px',
                border: 'none',
                background: 'transparent',
                color: activeTab === 'manage-attendance' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === 'manage-attendance' ? '600' : '500',
                borderBottom: activeTab === 'manage-attendance' ? '2px solid var(--color-primary)' : 'none',
                marginBottom: activeTab === 'manage-attendance' ? '-1px' : '0',
                transition: 'all 0.2s ease'
              }}
            >
              Manage Attendance
            </button>
          )}
        </div>

        {/* MY ATTENDANCE TAB */}
        {activeTab === 'my-attendance' && (
          <div style={{ padding: '24px' }}>
            {/* Period Selection */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text-muted)' }}>
                  Month:
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="form-select"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text-muted)' }}>
                  Year:
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="form-select"
                >
                  {Array.from({ length: 5 }, (_, i) => (
                    <option key={year - 2 + i} value={year - 2 + i}>
                      {year - 2 + i}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <StatItem label="Present" value={stats.present} color="#10B981" />
              <StatItem label="Late" value={stats.late} color="#F59E0B" />
              <StatItem label="Absent" value={stats.absent} color="#EF4444" />
              <StatItem label="Half Day" value={stats.halfDay} color="#8B5CF6" />
            </div>

            {/* Status Messages */}
            {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{error}</div>}
            {message && (
              <div className="alert" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid var(--color-success-ring)', marginBottom: '16px' }}>
                <span style={{ marginRight: '8px' }}>✓</span> {message}
              </div>
            )}

            {/* Loading */}
            {loading ? (
              <div style={{ padding: '80px', textAlign: 'center' }}>
                <span className="spinner" style={{ width: '28px', height: '28px', borderTopColor: 'var(--color-primary)' }} />
              </div>
            ) : records.length === 0 ? (
              <div style={{ padding: '80px 40px', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '15px' }}>No attendance records found.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <th style={tableHeaderStyle}>Date</th>
                      <th style={tableHeaderStyle}>Check In</th>
                      <th style={tableHeaderStyle}>Check Out</th>
                      <th style={tableHeaderStyle}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.id} style={{ transition: 'background 0.2s' }}>
                        <td style={{ ...tableCellStyle, minWidth: '140px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                            {new Date(record.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                            {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                        </td>
                        <td style={tableCellStyle}>{formatTime(record.checkInTime)}</td>
                        <td style={tableCellStyle}>{formatTime(record.checkOutTime)}</td>
                        <td style={tableCellStyle}>
                          <StatusBadge status={record.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* MANAGE ATTENDANCE TAB */}
        {activeTab === 'manage-attendance' && (isAdmin || isManager) && (
          <div style={{ padding: '24px' }}>
            {/* Employee Search */}
            <div style={{ marginBottom: '24px', position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text-muted)' }}>
                Search Employee:
              </label>
              <input
                type="text"
                placeholder="Enter employee name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="form-input"
                style={{ width: '100%' }}
              />

              {/* Dropdown */}
              {showDropdown && searchQuery && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '0',
                  right: '0',
                  backgroundColor: 'var(--color-surface, #2a2a3e)',
                  border: '1px solid var(--color-border)',
                  borderTop: 'none',
                  borderRadius: '0 0 8px 8px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  zIndex: 10,
                  marginTop: '-4px'
                }}>
                  {searchLoading && (
                    <div style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: '14px' }}>
                      Searching...
                    </div>
                  )}
                  {!searchLoading && employees.length === 0 && (
                    <div style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: '14px' }}>
                      No employees found
                    </div>
                  )}
                  {employees.map((emp) => (
                    <div
                      key={emp.id}
                      onClick={() => handleSelectEmployee(emp)}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--color-border)',
                        fontSize: '14px',
                        color: 'var(--color-text)',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ fontWeight: '600' }}>{emp.fullName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {emp.workEmail}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Employee Info */}
            {selectedEmployee && (
              <div style={{
                padding: '16px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid var(--color-primary)',
                borderRadius: '8px',
                marginBottom: '24px'
              }}>
                <div style={{ color: 'var(--color-text)', fontWeight: '600' }}>
                  {selectedEmployee.fullName}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  {selectedEmployee.jobTitle} • {selectedEmployee.departmentId}
                </div>
              </div>
            )}

            {/* Period Selection */}
            {selectedEmployee && (
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text-muted)' }}>
                    Month:
                  </label>
                  <select
                    value={manageMonth}
                    onChange={(e) => setManageMonth(Number(e.target.value))}
                    className="form-select"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text-muted)' }}>
                    Year:
                  </label>
                  <select
                    value={manageYear}
                    onChange={(e) => setManageYear(Number(e.target.value))}
                    className="form-select"
                  >
                    {Array.from({ length: 5 }, (_, i) => (
                      <option key={manageYear - 2 + i} value={manageYear - 2 + i}>
                        {manageYear - 2 + i}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Stats */}
            {selectedEmployee && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <StatItem label="Present" value={manageStats.present} color="#10B981" />
                <StatItem label="Late" value={manageStats.late} color="#F59E0B" />
                <StatItem label="Absent" value={manageStats.absent} color="#EF4444" />
                <StatItem label="Half Day" value={manageStats.halfDay} color="#8B5CF6" />
              </div>
            )}

            {/* Messages */}
            {manageError && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{manageError}</div>}

            {/* Loading */}
            {manageLoading ? (
              <div style={{ padding: '80px', textAlign: 'center' }}>
                <span className="spinner" style={{ width: '28px', height: '28px', borderTopColor: 'var(--color-primary)' }} />
              </div>
            ) : selectedEmployee && manageRecords.length === 0 ? (
              <div style={{ padding: '80px 40px', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '15px' }}>No attendance records found for selected employee.</p>
              </div>
            ) : selectedEmployee ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <th style={tableHeaderStyle}>Date</th>
                      <th style={tableHeaderStyle}>Check In</th>
                      <th style={tableHeaderStyle}>Check Out</th>
                      <th style={tableHeaderStyle}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manageRecords.map((record) => (
                      <tr key={record.id} style={{ transition: 'background 0.2s' }}>
                        <td style={{ ...tableCellStyle, minWidth: '140px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                            {new Date(record.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                            {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                        </td>
                        <td style={tableCellStyle}>{formatTime(record.checkInTime)}</td>
                        <td style={tableCellStyle}>{formatTime(record.checkOutTime)}</td>
                        <td style={tableCellStyle}>
                          <StatusBadge status={record.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Components
function StatItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '16px',
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '10px',
      border: '1px solid var(--color-border)'
    }}>
      <div style={{ fontSize: '28px', fontWeight: '700', color }}>{value}</div>
      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  let color = '#94a3b8';
  let bg = 'rgba(148, 163, 184, 0.12)';
  if (s === 'PRESENT') { color = 'var(--color-success)'; bg = 'var(--color-success-bg)'; }
  if (s === 'LATE') { color = '#fbbf24'; bg = 'rgba(245, 158, 11, 0.12)'; }
  if (s === 'ABSENT') { color = 'var(--color-error)'; bg = 'var(--color-error-bg)'; }
  if (s === 'HALF_DAY') { color = '#a78bfa'; bg = 'rgba(139, 92, 246, 0.12)'; }
  return (
    <span style={{ fontSize: '10px', fontWeight: '800', padding: '4px 10px', borderRadius: '6px', background: bg, color, border: `1px solid ${color}25`, textTransform: 'uppercase' }}>
      {s.replace('_', ' ')}
    </span>
  );
}

const tableHeaderStyle: React.CSSProperties = {
  padding: '16px 24px',
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: '700',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  borderBottom: '1px solid var(--color-border)'
};

const tableCellStyle: React.CSSProperties = {
  padding: '16px 24px',
  borderBottom: '1px solid var(--color-border)',
  fontSize: '14px',
  verticalAlign: 'middle'
};

function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}
