import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../api/config';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types/employee';

type RawEmployee = {
  id: number;
  fullName: string;
  workEmail: string;
  role: 'ADMIN_HR' | 'MANAGER' | 'EMPLOYEE';
  status: string;
  joinDate: string;
  basicSalary: string;
  departmentId: number;
  department?: { id: number; name: string };
  jobTitle: string;
};

export function EmployeeListPage() {
  const { user, token } = useAuth();
  const isBlocked = user?.role === Role.employee;
  const [employees, setEmployees] = useState<RawEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadEmployees() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/employees`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch (${res.status})`);
      }

      const { data } = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      setError((err as Error).message || 'Failed to load employees.');
    } finally {
      setLoading(false);
    }
  }

  async function deactivateEmployee(employeeId: number) {
    if (!token) return;
    setDeactivatingId(employeeId);

    try {
      const res = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'INACTIVE' }),
      });

      if (!res.ok) {
        throw new Error(`Failed to deactivate (${res.status})`);
      }

      setSuccess('Employee deactivated successfully!');
      setTimeout(() => setSuccess(null), 3000);
      await loadEmployees();
    } catch (err) {
      setError((err as Error).message || 'Failed to deactivate employee.');
    } finally {
      setDeactivatingId(null);
    }
  }

  useEffect(() => {
    if (!user || isBlocked) return;
    loadEmployees();
  }, [user, isBlocked, token]);

  const visibleEmployees = useMemo(() => {
    if (!user) return [];
    if (user.role === Role.admin) return employees;
    if (user.role === Role.manager) {
      return employees.filter((emp) => emp.departmentId === user.departmentId);
    }
    return [];
  }, [user, employees]);

  // Stats
  const stats = useMemo(() => ({
    total: visibleEmployees.length,
    active: visibleEmployees.filter(e => e.status === 'ACTIVE').length,
    inactive: visibleEmployees.filter(e => e.status !== 'ACTIVE').length,
  }), [visibleEmployees]);

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          HRMS · Workforce
        </div>
        <h1 className="page-title">Employees</h1>
        <p className="page-subtitle">Manage your organization's workforce.</p>
      </header>

      {/* ALERTS */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '24px' }}>
          <span className="alert-icon">⚠️</span>
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}
      {success && (
        <div className="alert" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid var(--color-success-ring)', marginBottom: '24px' }}>
          <span style={{ marginRight: '8px' }}>✓</span> {success}
        </div>
      )}

      {isBlocked ? (
        <div className="form-card">
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <div>
              <strong>Access denied</strong>
              <p style={{ margin: 0 }}>Only Admin/HR and Manager can view this page.</p>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* STATS ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
            <div className="form-card" style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Total Employees</div>
              <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--color-text)' }}>{stats.total}</div>
            </div>
            <div className="form-card" style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-success)', marginBottom: '8px' }}>Active</div>
              <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--color-success)' }}>{stats.active}</div>
            </div>
            <div className="form-card" style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-error)', marginBottom: '8px' }}>Inactive</div>
              <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--color-error)' }}>{stats.inactive}</div>
            </div>
          </div>

          {/* TABLE CARD */}
          <div className="form-card" style={{ padding: '0', overflow: 'hidden' }}>
            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>All Employees</h3>
              {user?.role === Role.admin && (
                <Link to="/employees/new" className="btn btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Employee
                </Link>
              )}
            </div>

            {/* Table Content */}
            {loading ? (
              <div style={{ padding: '80px', textAlign: 'center' }}>
                <span className="spinner" style={{ width: '28px', height: '28px', borderTopColor: 'var(--color-primary)' }} />
              </div>
            ) : visibleEmployees.length === 0 ? (
              <div style={{ padding: '80px 40px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '15px' }}>No employees found for your role/department.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <th style={tableHeaderStyle}>Full Name</th>
                      <th style={tableHeaderStyle}>Email</th>
                      <th style={tableHeaderStyle}>Role</th>
                      <th style={tableHeaderStyle}>Department</th>
                      <th style={tableHeaderStyle}>Job Title</th>
                      <th style={tableHeaderStyle}>Status</th>
                      {user?.role === Role.admin && <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleEmployees.map((emp) => (
                      <tr key={emp.id} style={{ transition: 'background 0.2s' }}>
                        <td style={tableCellStyle}>
                          <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{emp.fullName}</span>
                        </td>
                        <td style={tableCellStyle}>
                          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{emp.workEmail}</span>
                        </td>
                        <td style={tableCellStyle}>
                          <RoleBadge role={emp.role} />
                        </td>
                        <td style={tableCellStyle}>
                          <span style={{ fontSize: '13px' }}>{emp.department?.name ?? `ID ${emp.departmentId}`}</span>
                        </td>
                        <td style={tableCellStyle}>
                          <span style={{ fontSize: '13px' }}>{emp.jobTitle}</span>
                        </td>
                        <td style={tableCellStyle}>
                          <StatusBadge status={emp.status} />
                        </td>
                        {user?.role === Role.admin && (
                          <td style={{ ...tableCellStyle, textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
                              <Link
                                to={`/employees/${emp.id}/edit`}
                                className="btn"
                                style={{
                                  fontSize: '12px', padding: '6px 14px',
                                  border: '1px solid var(--color-border)',
                                  background: 'transparent', color: 'var(--color-text)'
                                }}
                              >
                                Edit
                              </Link>
                              {emp.status === 'ACTIVE' ? (
                                <button
                                  onClick={() => deactivateEmployee(emp.id)}
                                  disabled={deactivatingId === emp.id}
                                  style={{
                                    padding: '6px 14px', fontSize: '12px', fontWeight: '600',
                                    border: '1px solid var(--color-error)', background: 'transparent',
                                    color: 'var(--color-error)', borderRadius: '6px',
                                    cursor: deactivatingId === emp.id ? 'not-allowed' : 'pointer',
                                    opacity: deactivatingId === emp.id ? 0.6 : 1,
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  {deactivatingId === emp.id ? 'Processing...' : 'Deactivate'}
                                </button>
                              ) : (
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>—</span>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- ROLE BADGE ---

function RoleBadge({ role }: { role: string }) {
  const r = role.toUpperCase();
  let color = '#a5b4fc';
  let bg = 'rgba(99, 102, 241, 0.12)';
  let border = 'rgba(99, 102, 241, 0.25)';
  if (role === 'ADMIN_HR') { color = '#fb7185'; bg = 'rgba(244, 63, 94, 0.12)'; border = 'rgba(244, 63, 94, 0.25)'; }
  if (role === 'MANAGER') { color = '#fbbf24'; bg = 'rgba(245, 158, 11, 0.12)'; border = 'rgba(245, 158, 11, 0.25)'; }
  return (
    <span style={{
      fontSize: '10px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px',
      background: bg, color, border: `1px solid ${border}`, textTransform: 'uppercase',
      letterSpacing: '0.04em'
    }}>
      {role === 'ADMIN_HR' ? 'HR' : r}
    </span>
  );
}

// --- STATUS BADGE ---

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  if (s === 'ACTIVE') {
    return (
      <span style={{
        fontSize: '10px', fontWeight: '800', padding: '4px 10px', borderRadius: '6px',
        background: 'var(--color-success-bg)', color: 'var(--color-success)',
        border: '1px solid rgba(16, 185, 129, 0.25)', textTransform: 'uppercase'
      }}>
        Active
      </span>
    );
  }
  return (
    <span style={{
      fontSize: '10px', fontWeight: '800', padding: '4px 10px', borderRadius: '6px',
      background: 'var(--color-error-bg)', color: 'var(--color-error)',
      border: '1px solid rgba(239, 68, 68, 0.25)', textTransform: 'uppercase'
    }}>
      Inactive
    </span>
  );
}

// --- TABLE STYLES ---

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