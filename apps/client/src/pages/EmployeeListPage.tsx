import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { API_BASE_URL } from '../api/config';
import { useAuth } from '../contexts/AuthContext';
import { Role, type Department } from '../types/employee';
import { fetchDepartments } from '../api/employeeApi';

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

type SortField = 'fullName' | 'workEmail' | 'role' | 'status' | 'jobTitle' | 'joinDate' | 'department';
type SortOrder = 'asc' | 'desc';

export function EmployeeListPage() {
  const { user, token } = useAuth();
  const isBlocked = user?.role === Role.employee;
  const [employees, setEmployees] = useState<RawEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filter state
  const [filterName, setFilterName] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);

  // Fetch departments for dropdown (same API as CreateEmployeeForm)
  useEffect(() => {
    if (!token) return;
    fetchDepartments(token)
      .then(data => setDepartments(data))
      .catch(() => setDepartments([]));
  }, [token]);

  const clearFilters = () => {
    setFilterName('');
    setFilterRole('');
    setFilterDepartment('');
    setFilterStatus('');
  };

  const hasFilters = filterName || filterRole || filterDepartment || filterStatus;

  // Sort state
  const [sortBy, setSortBy] = useState<SortField>('fullName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  async function loadEmployees() {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const offset = (page - 1) * limit;
      const url = new URL(`${API_BASE_URL}/employees`);
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('offset', String(offset));
      url.searchParams.set('sortBy', sortBy);
      url.searchParams.set('sortOrder', sortOrder);
      if (filterName.trim()) url.searchParams.set('search', filterName.trim());
      if (filterRole) url.searchParams.set('role', filterRole);
      if (filterDepartment) url.searchParams.set('departmentId', filterDepartment);
      if (filterStatus) url.searchParams.set('status', filterStatus);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Failed to fetch (${res.status})`);

      const result = await res.json();
      const data = Array.isArray(result.data) ? result.data : [];
      setEmployees(data);
      setTotalCount(result.pagination?.total ?? data.length);
      setTotalPages(result.pagination?.totalPages ?? Math.ceil(data.length / limit));
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
      if (!res.ok) throw new Error(`Failed to deactivate (${res.status})`);
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
  }, [user, isBlocked, token, page, sortBy, sortOrder, filterName, filterRole, filterDepartment, filterStatus]);

  const visibleEmployees = useMemo(() => {
    if (!user) return employees;
    if (user.role === Role.admin) return employees;
    if (user.role === Role.manager) {
      return employees.filter((emp) => emp.departmentId === user.departmentId);
    }
    return employees;
  }, [user, employees]);

  // Stats (fetched from backend for global totals)
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

  // Fetch global stats (active/inactive counts)
  useEffect(() => {
    if (!user || isBlocked || !token) return;
    fetch(`${API_BASE_URL}/employees/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => {});
  }, [user, isBlocked, token]);

  // Reset to page 1 when sort or filters change
  useEffect(() => {
    setPage(1);
  }, [sortBy, filterName, filterRole, filterDepartment, filterStatus]);

  // Pagination numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  // Sortable header helper
  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th
      style={{ ...tableHeaderStyle, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
      onClick={() => handleSort(field)}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        {label}
        <span style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 0.7, gap: 0, fontSize: '10px', opacity: sortBy === field ? 1 : 0.3 }}>
          <span>▲</span>
          <span>▼</span>
        </span>
      </span>
    </th>
  );

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

            {/* Filter Bar */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.01)' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                {/* Full Name */}
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Full Name</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Search name..."
                    value={filterName}
                    onChange={e => { setFilterName(e.target.value); setPage(1); }}
                    style={{ height: '36px', fontSize: '13px' }}
                  />
                </div>
                {/* Role */}
                <div style={{ flex: '0 1 160px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Role</label>
                  <select
                    className="form-input"
                    value={filterRole}
                    onChange={e => { setFilterRole(e.target.value); setPage(1); }}
                    style={{ minHeight: '36px', fontSize: '13px', padding: '6px 10px' }}
                  >
                    <option value="">All Roles</option>
                    <option value="ADMIN_HR">HR</option>
                    <option value="MANAGER">Manager</option>
                    <option value="EMPLOYEE">Employee</option>
                  </select>
                </div>
                {/* Department */}
                <div style={{ flex: '0 1 180px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Department</label>
                  <select
                    className="form-input"
                    value={filterDepartment}
                    onChange={e => { setFilterDepartment(e.target.value); setPage(1); }}
                    style={{ minHeight: '36px', fontSize: '13px', padding: '6px 10px' }}
                  >
                    <option value="">All Departments</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                {/* Status */}
                <div style={{ flex: '0 1 140px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Status</label>
                  <select
                    className="form-input"
                    value={filterStatus}
                    onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                    style={{ minHeight: '36px', fontSize: '13px', padding: '6px 10px' }}
                  >
                    <option value="">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                {/* Clear Button */}
                {hasFilters && (
                  <button
                    className="btn"
                    onClick={clearFilters}
                    style={{
                      height: '36px', fontSize: '12px', padding: '0 14px',
                      border: '1px solid var(--color-border)', background: 'transparent',
                      color: 'var(--color-text-muted)', borderRadius: '6px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    ✕ Clear
                  </button>
                )}
              </div>
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
                      <SortHeader field="fullName" label="Full Name" />
                      <SortHeader field="workEmail" label="Email" />
                      <SortHeader field="role" label="Role" />
                      <SortHeader field="department" label="Department" />
                      <SortHeader field="jobTitle" label="Job Title" />
                      <SortHeader field="status" label="Status" />
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

            {/* Pagination */}
            {!loading && visibleEmployees.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  Showing {(page - 1) * limit + 1}–{Math.min(page * limit, visibleEmployees.length)} of {visibleEmployees.length}
                </span>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <button
                    className="btn"
                    style={{
                      fontSize: '12px', padding: '6px 12px', minWidth: 'auto',
                      border: '1px solid var(--color-border)', background: 'transparent',
                      color: page <= 1 ? 'var(--color-text-placeholder)' : 'var(--color-text)'
                    }}
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    ‹
                  </button>
                  {getPageNumbers().map((p, i) =>
                    typeof p === 'string' ? (
                      <span key={`e-${i}`} style={{ padding: '6px 8px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        {p}
                      </span>
                    ) : (
                      <button
                        key={p}
                        className="btn"
                        style={{
                          fontSize: '12px', padding: '6px 12px', minWidth: '36px',
                          border: p === page ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                          background: p === page ? 'var(--color-primary)' : 'transparent',
                          color: p === page ? '#fff' : 'var(--color-text)',
                          borderRadius: '6px'
                        }}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    className="btn"
                    style={{
                      fontSize: '12px', padding: '6px 12px', minWidth: 'auto',
                      border: '1px solid var(--color-border)', background: 'transparent',
                      color: page >= totalPages ? 'var(--color-text-placeholder)' : 'var(--color-text)'
                    }}
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    ›
                  </button>
                </div>
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