import React, { useEffect, useState, useRef } from 'react';
import { API_BASE_URL } from '../api/config';
import { useAuth } from '../contexts/AuthContext';
import { createDepartment } from '../api/employeeApi';
import type { Department } from '../types/employee';

type SortField = 'name' | 'employees' | 'status';
type SortOrder = 'asc' | 'desc';

export function DepartmentListPage() {
  const { token } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

  // Pagination state
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filter state
  const [filterName, setFilterName] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Sort state
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const hasFilters = filterName.trim() !== '' || filterStatus !== '';

  const clearFilters = () => {
    setFilterName('');
    setFilterStatus('');
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Map frontend sort field to backend field
  const getBackendSortField = (field: SortField): string => {
    if (field === 'employees') return 'employees'; // backend uses _count
    if (field === 'status') return 'isActive';
    return field;
  };

  function loadDepartments() {
    if (!token) return;
    setLoading(true);
    setError('');

    const offset = (page - 1) * limit;
    const url = new URL(`${API_BASE_URL}/departments`);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('offset', String(offset));
    url.searchParams.set('sortBy', getBackendSortField(sortBy));
    url.searchParams.set('sortOrder', sortOrder);
    if (filterName.trim()) url.searchParams.set('search', filterName.trim());
    if (filterStatus) url.searchParams.set('isActive', filterStatus);

    fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch (${res.status})`);
        return res.json();
      })
      .then((result) => {
        setDepartments(result.data || []);
        setTotalCount(result.pagination?.total ?? 0);
        setTotalPages(result.pagination?.totalPages ?? 1);
      })
      .catch((err) => setError((err as Error).message || 'Failed to load departments.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadDepartments();
  }, [token, page, filterName, filterStatus, sortBy, sortOrder]);

  // Fetch global stats (active/inactive counts across all pages)
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/departments/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => {});
  }, [token, success]); // Refetch after success (deactivate)

  // Reset to page 1 when filter or sort changes
  useEffect(() => {
    setPage(1);
  }, [filterName, filterStatus, sortBy]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !newName.trim()) return;
    setCreating(true);
    setFormError('');
    try {
      await createDepartment(newName.trim(), token);
      setNewName('');
      setShowForm(false);
      setSuccess('Department created successfully!');
      loadDepartments();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setFormError((err as Error).message || 'Failed to create department.');
    } finally {
      setCreating(false);
    }
  }

  async function handleDeactivate(id: number) {
    if (!token) return;
    setDeactivatingId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/departments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: false }),
      });
      if (!res.ok) throw new Error(`Failed to deactivate (${res.status})`);
      setSuccess('Department deactivated successfully!');
      loadDepartments();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError((err as Error).message || 'Failed to deactivate department.');
    } finally {
      setDeactivatingId(null);
    }
  }

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
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          HRMS · Organization
        </div>
        <h1 className="page-title">Departments</h1>
        <p className="page-subtitle">Manage organization structure and departments.</p>
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

      {/* ADD DEPARTMENT FORM */}
      {showForm && (
        <div className="form-card" style={{ marginBottom: '24px' }}>
          <div className="form-header" style={{ marginBottom: '20px', paddingBottom: '12px' }}>
            <h2 className="form-title" style={{ fontSize: '16px' }}>Add New Department</h2>
          </div>
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label" htmlFor="dept-name">Department Name</label>
              <input
                id="dept-name"
                className="form-input"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Engineering"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={creating} style={{ whiteSpace: 'nowrap', minHeight: '42px' }}>
              {creating ? 'Creating...' : 'Create'}
            </button>
          </form>
          {formError && (
            <div className="alert alert-error" style={{ marginTop: '12px', marginBottom: 0 }}>
              <span className="alert-icon">⚠️</span>
              <p style={{ margin: 0 }}>{formError}</p>
            </div>
          )}
        </div>
      )}

      {/* STATS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div className="form-card" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Total Departments</div>
          <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--color-text)' }}>{totalCount}</div>
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

      {/* DEPARTMENTS TABLE CARD */}
      <div className="form-card" style={{ padding: '0', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>All Departments</h3>
          <button
            className="btn btn-primary"
            onClick={() => { setShowForm(!showForm); setFormError(''); }}
            style={{ fontSize: '13px', padding: '8px 16px' }}
          >
            {showForm ? (
              'Cancel'
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Department
              </>
            )}
          </button>
        </div>

        {/* Filter Bar */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            {/* Department Name */}
            <div style={{ flex: '1 1 250px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Department Name</label>
              <input
                className="form-input"
                type="text"
                placeholder="Search by name..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                style={{ height: '36px', fontSize: '13px' }}
              />
            </div>
            {/* Status Filter */}
            <div style={{ flex: '0 1 140px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Status</label>
              <select
                className="form-input"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ minHeight: '36px', fontSize: '13px', padding: '6px 10px' }}
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
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
        ) : departments.length === 0 ? (
          <div style={{ padding: '80px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '15px' }}>No departments found. Create one to get started.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <SortHeader field="name" label="Department Name" />
                  <SortHeader field="employees" label="Employees" />
                  <SortHeader field="status" label="Status" />
                  <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr key={dept.id} style={{ transition: 'background 0.2s' }}>
                    <td style={tableCellStyle}>
                      <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{dept.name}</span>
                    </td>
                    <td style={tableCellStyle}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: 'rgba(255,255,255,0.04)', fontSize: '14px', fontWeight: 600
                      }}>
                        {dept.employees?.length ?? 0}
                      </span>
                    </td>
                    <td style={tableCellStyle}>
                      <StatusBadge isActive={dept.isActive} />
                    </td>
                    <td style={{ ...tableCellStyle, textAlign: 'right' }}>
                      {dept.isActive && (dept.employees?.length ?? 0) === 0 ? (
                        <button
                          onClick={() => handleDeactivate(dept.id)}
                          disabled={deactivatingId === dept.id}
                          style={{
                            padding: '6px 14px', fontSize: '12px', fontWeight: '600',
                            border: '1px solid var(--color-error)', background: 'transparent',
                            color: 'var(--color-error)', borderRadius: '6px',
                            cursor: deactivatingId === dept.id ? 'not-allowed' : 'pointer',
                            opacity: deactivatingId === dept.id ? 0.6 : 1,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {deactivatingId === dept.id ? 'Processing...' : 'Deactivate'}
                        </button>
                      ) : !dept.isActive ? (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>—</span>
                      ) : (
                        <LockedTooltip />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && departments.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, totalCount)} of {totalCount}
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
  );
}

// --- STATUS BADGE ---

function StatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
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

// --- LOCKED TOOLTIP COMPONENT (appends to document.body to escape overflow:hidden) ---

function LockedTooltip() {
  const ref = useRef<HTMLSpanElement>(null);

  const showTooltip = () => {
    if (!ref.current) return;
    const existing = document.getElementById('locked-tooltip');
    if (existing) existing.remove();

    const rect = ref.current.getBoundingClientRect();
    const tooltip = document.createElement('div');
    tooltip.id = 'locked-tooltip';
    tooltip.innerHTML = '⚠ Can&#39;t deactivate, has active users';
    tooltip.style.cssText = `
      position: fixed;
      top: ${rect.top - 8}px;
      left: ${rect.left + rect.width / 2}px;
      transform: translate(-50%, -100%);
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      font-size: 11px;
      font-weight: 600;
      padding: 6px 10px;
      border-radius: 5px;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
      border: 1px solid rgba(245, 158, 11, 0.3);
      z-index: 9999;
      pointer-events: none;
      font-family: Inter, system-ui, sans-serif;
    `;
    document.body.appendChild(tooltip);
  };

  const hideTooltip = () => {
    const existing = document.getElementById('locked-tooltip');
    if (existing) existing.remove();
  };

  return (
    <span style={{ color: 'var(--color-text-muted)', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      Locked
      <span
        ref={ref}
        onMouseEnter={() => showTooltip()}
        onMouseLeave={hideTooltip}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '18px', height: '18px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)', fontSize: '11px', fontWeight: 700,
          cursor: 'pointer', color: 'var(--color-text-muted)',
          fontFamily: 'serif'
        }}
      >
        i
      </span>
    </span>
  );
}

// --- TABLE STYLES (matching Leave/Attendance pages) ---

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