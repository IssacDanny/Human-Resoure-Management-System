import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../api/config';
import { type LeaveRequest, type CreateLeaveRequest } from '../types/leave';
import { FormField } from '../components/ui/FormField';

type SortField = 'date' | 'department' | 'period' | 'type' | 'status';
type SortOrder = 'asc' | 'desc';

export function LeavePage() {
  const { token, isAdmin, isManager, user } = useAuth();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'my-requests' | 'manage-requests'>('my-requests');
  
  // My requests state
  const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
  const [myRequestsLoading, setMyRequestsLoading] = useState(true);
  
  // Manage requests state
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
  const [allRequestsLoading, setAllRequestsLoading] = useState(false);
  
  // Detail modal state
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Create form modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [submitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Use today's date string for min constraint (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState<CreateLeaveRequest>({
    leaveType: 'ANNUAL' as any,
    startDate: '',
    endDate: '',
    reason: '',
  });

  // Pagination state (shared for both tabs)
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Sort state
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Filter state
  const [filterName, setFilterName] = useState('');
  const [filterPeriodFrom, setFilterPeriodFrom] = useState('');
  const [filterPeriodTo, setFilterPeriodTo] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const hasFilters = filterName.trim() !== '' || filterPeriodFrom !== '' || filterPeriodTo !== '' || filterType !== '' || filterStatus !== '';

  const clearFilters = () => {
    setFilterName('');
    setFilterPeriodFrom('');
    setFilterPeriodTo('');
    setFilterType('');
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

  const getBackendSortField = (field: SortField): string => {
    if (field === 'date') return 'createdAt';
    if (field === 'department') return 'department';
    if (field === 'period') return 'startDate';
    if (field === 'type') return 'leaveType';
    if (field === 'status') return 'status';
    return 'createdAt';
  };

  const loadRequests = async () => {
    if (!token) return;

    if (activeTab === 'my-requests') {
      if (!user) return;
      setMyRequestsLoading(true);
      try {
        const offset = (page - 1) * limit;
        const url = new URL(`${API_BASE_URL}/leave-requests`);
        url.searchParams.append('limit', String(limit));
        url.searchParams.append('offset', String(offset));
        url.searchParams.append('sortBy', getBackendSortField(sortBy));
        url.searchParams.append('sortOrder', sortOrder);
        url.searchParams.append('filter[employeeId]', user.id);
        if (filterName.trim()) url.searchParams.append('filter[employeeName]', filterName.trim());
        if (filterPeriodFrom) url.searchParams.append('filter[startDate]', filterPeriodFrom);
        if (filterPeriodTo) url.searchParams.append('filter[endDate]', filterPeriodTo);
        if (filterType) url.searchParams.append('filter[leaveType]', filterType);
        if (filterStatus) url.searchParams.append('filter[status]', filterStatus);

        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const result = await res.json();
        setMyRequests(Array.isArray(result.data) ? result.data : []);
        setTotalCount(result.pagination?.total ?? 0);
        setTotalPages(result.pagination?.totalPages ?? 1);
      } catch (err) {
        console.error('Failed to load leave history', err);
        setMyRequests([]);
      } finally {
        setMyRequestsLoading(false);
      }
    } else if (isAdmin || isManager) {
      setAllRequestsLoading(true);
      try {
        const offset = (page - 1) * limit;
        const url = new URL(`${API_BASE_URL}/leave-requests`);
        url.searchParams.append('limit', String(limit));
        url.searchParams.append('offset', String(offset));
        url.searchParams.append('sortBy', getBackendSortField(sortBy));
        url.searchParams.append('sortOrder', sortOrder);
        if (filterName.trim()) url.searchParams.append('filter[employeeName]', filterName.trim());
        if (filterPeriodFrom) url.searchParams.append('filter[startDate]', filterPeriodFrom);
        if (filterPeriodTo) url.searchParams.append('filter[endDate]', filterPeriodTo);
        if (filterType) url.searchParams.append('filter[leaveType]', filterType);
        if (filterStatus) url.searchParams.append('filter[status]', filterStatus);

        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const result = await res.json();
        setAllRequests(Array.isArray(result.data) ? result.data : []);
        setTotalCount(result.pagination?.total ?? 0);
        setTotalPages(result.pagination?.totalPages ?? 1);
      } catch (err) {
        console.error('Failed to load all leave requests');
      } finally {
        setAllRequestsLoading(false);
      }
    }
  };

  // Reset page to 1 when tab, filters, or sort changes, then load
  useEffect(() => {
    setPage(1);
  }, [activeTab, sortBy, filterName, filterPeriodFrom, filterPeriodTo, filterType, filterStatus]);

  // Load data when page or other stable dependencies change
  useEffect(() => {
    loadRequests();
  }, [token, user, page, sortBy, sortOrder, filterName, filterPeriodFrom, filterPeriodTo, filterType, filterStatus, activeTab, isAdmin, isManager]);

  // QOL: Sync End Date with Start Date when Start is picked
  const handleStartChange = (val: string) => {
    setForm(prev => ({
      ...prev,
      startDate: val,
      endDate: (!prev.endDate || prev.endDate < val) ? val : prev.endDate
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    const today = new Date();
    today.setHours(0,0,0,0);

    if (form.leaveType !== 'sick' && start < today) return setError('Annual or Unpaid leave must be for future dates.');
    if (start > end) return setError('Start date cannot be after end date.');
    if (!form.reason || form.reason.length < 5) return setError('Reason must be at least 5 characters.');

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/leave-requests`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(form),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Submission failed');

      setSuccess('Leave request submitted successfully!');
      setForm({ leaveType: 'ANNUAL' as any, startDate: '', endDate: '', reason: '' });
      setShowCreateModal(false);
      loadRequests();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setForm({ leaveType: 'ANNUAL' as any, startDate: '', endDate: '', reason: '' });
    setError(null);
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setError(null);
    setForm({ leaveType: 'ANNUAL' as any, startDate: '', endDate: '', reason: '' });
  };

  const handleApprove = async (requestId: string) => {
    if (!token) return;
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`${API_BASE_URL}/leave-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'APPROVED' })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to approve request');
      }

      setActionSuccess('Leave request approved successfully!');
      setShowDetailModal(false);
      setSelectedRequest(null);
      loadRequests();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setActionError((err as Error).message);
    }
  };

  const handleReject = async (requestId: string, rejectionReason: string) => {
    if (!token || !rejectionReason.trim()) {
      setActionError('Please provide a rejection reason');
      return;
    }
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`${API_BASE_URL}/leave-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'REJECTED', rejectionReason })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to reject request');
      }

      setActionSuccess('Leave request rejected successfully!');
      setShowDetailModal(false);
      setSelectedRequest(null);
      loadRequests();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setActionError((err as Error).message);
    }
  };

  const handleViewDetail = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
    setActionError(null);
    setActionSuccess(null);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedRequest(null);
    setActionError(null);
    setActionSuccess(null);
  };

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
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          HRMS · Leave Management
        </div>
        <h1 className="page-title">Leave Requests</h1>
        <p className="page-subtitle">Submit new requests and manage leave history.</p>
      </header>

      {/* ALERTS */}
      {success && (
        <div className="alert" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid var(--color-success-ring)', marginBottom: '24px' }}>
          <span style={{ marginRight: '8px' }}>✓</span> {success}
        </div>
      )}

      {/* CREATE LEAVE REQUEST BUTTON */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className="btn btn-primary"
          onClick={openCreateModal}
          style={{ fontSize: '14px', padding: '10px 24px' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '8px' }}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Leave Request
        </button>
      </div>

      {/* REQUESTS TABLE WITH TABS */}
      <div className="form-card" style={{ padding: '0', overflow: 'hidden' }}>
          {/* TAB NAVIGATION */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
            <button
              onClick={() => setActiveTab('my-requests')}
              style={{
                flex: 1,
                padding: '16px 24px',
                border: 'none',
                background: 'transparent',
                color: activeTab === 'my-requests' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === 'my-requests' ? '600' : '500',
                borderBottom: activeTab === 'my-requests' ? '2px solid var(--color-primary)' : 'none',
                marginBottom: activeTab === 'my-requests' ? '-1px' : '0',
                transition: 'all 0.2s ease'
              }}
            >
              My Leave Requests
            </button>
            {(isAdmin || isManager) && (
              <button
                onClick={() => setActiveTab('manage-requests')}
                style={{
                  flex: 1,
                  padding: '16px 24px',
                  border: 'none',
                  background: 'transparent',
                  color: activeTab === 'manage-requests' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeTab === 'manage-requests' ? '600' : '500',
                  borderBottom: activeTab === 'manage-requests' ? '2px solid var(--color-primary)' : 'none',
                  marginBottom: activeTab === 'manage-requests' ? '-1px' : '0',
                  transition: 'all 0.2s ease'
                }}
              >
                Manage Leave Requests
              </button>
            )}
          </div>

          {/* FILTER BAR */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              {/* Name Search */}
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Name</label>
                <input className="form-input" type="text" placeholder="Search by name..." value={filterName} onChange={(e) => setFilterName(e.target.value)} style={{ height: '36px', fontSize: '13px' }} />
              </div>
              {/* Period From */}
              <div style={{ flex: '0 1 150px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>From</label>
                <input className="form-input" type="date" value={filterPeriodFrom} onChange={(e) => setFilterPeriodFrom(e.target.value)} style={{ height: '36px', fontSize: '13px' }} />
              </div>
              {/* Period To */}
              <div style={{ flex: '0 1 150px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>To</label>
                <input className="form-input" type="date" value={filterPeriodTo} onChange={(e) => setFilterPeriodTo(e.target.value)} style={{ height: '36px', fontSize: '13px' }} />
              </div>
              {/* Type Filter */}
              <div style={{ flex: '0 1 140px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Type</label>
                <select className="form-input" value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ minHeight: '36px', fontSize: '13px', padding: '6px 10px' }}>
                  <option value="">All Types</option>
                  <option value="ANNUAL">Annual</option>
                  <option value="SICK">Sick</option>
                  <option value="UNPAID">Unpaid</option>
                </select>
              </div>
              {/* Status Filter */}
              <div style={{ flex: '0 1 140px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Status</label>
                <select className="form-input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ minHeight: '36px', fontSize: '13px', padding: '6px 10px' }}>
                  <option value="">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              {/* Clear Button */}
              {hasFilters && (
                <button className="btn" onClick={clearFilters} style={{ height: '36px', fontSize: '12px', padding: '0 14px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-muted)', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                  ✕ Clear
                </button>
              )}
            </div>
          </div>

          {/* TAB CONTENT */}
          {activeTab === 'my-requests' && (
            <>
              {error && <div className="alert alert-error" style={{ margin: '16px 24px 0' }}>{error}</div>}
              {success && (
                <div className="alert" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid var(--color-success-ring)', margin: '16px 24px 0' }}>
                  <span style={{ marginRight: '8px' }}>✓</span> {success}
                </div>
              )}
              
              {myRequestsLoading ? (
                <div style={{ padding: '80px', textAlign: 'center' }}>
                  <span className="spinner" style={{ width: '28px', height: '28px', borderTopColor: 'var(--color-primary)' }} />
                </div>
              ) : myRequests.length === 0 ? (
                <div style={{ padding: '80px 40px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '15px' }}>No leave requests found.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <SortHeader field="period" label="Period & Reason" />
                        <SortHeader field="type" label="Type" />
                        <SortHeader field="status" label="Status" />
                        <th style={{ ...tableHeaderStyle, minWidth: '120px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myRequests.map(req => (
                        <tr key={req.id} style={{ transition: 'background 0.2s' }}>
                          <td style={{ ...tableCellStyle, minWidth: '220px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
                              {new Date(req.startDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}<br />— {new Date(req.endDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {req.reason}
                            </div>
                          </td>
                          <td style={tableCellStyle}>
                            <TypeBadge type={req.leaveType} />
                          </td>
                          <td style={tableCellStyle}>
                            <StatusBadge status={req.status} />
                          </td>
                          <td style={tableCellStyle}>
                            <button
                              onClick={() => handleViewDetail(req)}
                              style={{ padding: '6px 14px', fontSize: '12px', fontWeight: '600', border: '1px solid var(--color-primary)', background: 'transparent', color: 'var(--color-primary)', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                            >
                              View Detail
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === 'manage-requests' && (isAdmin || isManager) && (
            <>
              {actionError && <div className="alert alert-error" style={{ margin: '16px 24px 0' }}>{actionError}</div>}
              {actionSuccess && (
                <div className="alert" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid var(--color-success-ring)', margin: '16px 24px 0' }}>
                  <span style={{ marginRight: '8px' }}>✓</span> {actionSuccess}
                </div>
              )}
              
              {allRequestsLoading ? (
                <div style={{ padding: '80px', textAlign: 'center' }}>
                  <span className="spinner" style={{ width: '28px', height: '28px', borderTopColor: 'var(--color-primary)' }} />
                </div>
              ) : allRequests.length === 0 ? (
                <div style={{ padding: '80px 40px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '15px' }}>No leave requests to manage.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <SortHeader field="date" label="Employee" />
                        <SortHeader field="department" label="Department" />
                        <SortHeader field="period" label="Period & Reason" />
                        <SortHeader field="type" label="Type" />
                        <SortHeader field="status" label="Status" />
                        <th style={{ ...tableHeaderStyle, minWidth: '120px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allRequests.map(req => (
                        <tr key={req.id} style={{ transition: 'background 0.2s' }}>
                          <td style={tableCellStyle}>
                            <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                              {req.employee?.fullName || 'Unknown'}
                            </div>
                          </td>
                          <td style={tableCellStyle}>
                            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                              {req.employee?.department?.name || '—'}
                            </span>
                          </td>
                          <td style={{ ...tableCellStyle, minWidth: '160px', maxWidth: '200px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
                              {new Date(req.startDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}<br />— {new Date(req.endDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {req.reason}
                            </div>
                          </td>
                          <td style={tableCellStyle}>
                            <TypeBadge type={req.leaveType} />
                          </td>
                          <td style={tableCellStyle}>
                            <StatusBadge status={req.status} />
                          </td>
                          <td style={tableCellStyle}>
                            <button
                              onClick={() => handleViewDetail(req)}
                              style={{ padding: '6px 14px', fontSize: '12px', fontWeight: '600', border: '1px solid var(--color-primary)', background: 'transparent', color: 'var(--color-primary)', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                            >
                              View Detail
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* PAGINATION */}
          {!myRequestsLoading && !allRequestsLoading && (myRequests.length > 0 || allRequests.length > 0) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, totalCount)} of {totalCount}
              </span>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <button className="btn" style={{ fontSize: '12px', padding: '6px 12px', minWidth: 'auto', border: '1px solid var(--color-border)', background: 'transparent', color: page <= 1 ? 'var(--color-text-placeholder)' : 'var(--color-text)' }} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
                {getPageNumbers().map((p, i) =>
                  typeof p === 'string' ? (
                    <span key={`e-${i}`} style={{ padding: '6px 8px', fontSize: '12px', color: 'var(--color-text-muted)' }}>{p}</span>
                  ) : (
                    <button key={p} className="btn" style={{ fontSize: '12px', padding: '6px 12px', minWidth: '36px', border: p === page ? '1px solid var(--color-primary)' : '1px solid var(--color-border)', background: p === page ? 'var(--color-primary)' : 'transparent', color: p === page ? '#fff' : 'var(--color-text)', borderRadius: '6px' }} onClick={() => setPage(p)}>{p}</button>
                  )
                )}
                <button className="btn" style={{ fontSize: '12px', padding: '6px 12px', minWidth: 'auto', border: '1px solid var(--color-border)', background: 'transparent', color: page >= totalPages ? 'var(--color-text-placeholder)' : 'var(--color-text)' }} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>›</button>
              </div>
            </div>
          )}
        </div>

      {/* CREATE LEAVE REQUEST MODAL */}
      {showCreateModal && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
          onClick={closeCreateModal}
        >
          <div
            style={{ background: 'var(--color-bg, #1a1a2e)', borderRadius: '12px', padding: '32px', maxWidth: '520px', width: '100%', border: '1px solid var(--color-border, rgba(255,255,255,0.1))', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.1))' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: 'var(--color-text, #e2e8f0)' }}>Create Leave Request</h2>
              <button onClick={closeCreateModal} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted, #94a3b8)', fontSize: '24px', cursor: 'pointer', padding: '4px 8px', lineHeight: 1 }}>×</button>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <FormField id="type" label="Leave Type">
                <select className="form-select" value={form.leaveType} onChange={e => setForm({...form, leaveType: e.target.value as any})}>
                  <option value="ANNUAL">Annual Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="UNPAID">Unpaid Leave</option>
                </select>
              </FormField>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <FormField id="start" label="Start Date">
                  <input type="date" className="form-input" min={form.leaveType === 'sick' ? undefined : todayStr} value={form.startDate} onChange={e => handleStartChange(e.target.value)} required />
                </FormField>
                <FormField id="end" label="End Date">
                  <input type="date" className="form-input" min={form.startDate || todayStr} value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} required />
                </FormField>
              </div>

              <FormField id="reason" label="Reason">
                <textarea className="form-input" style={{ minHeight: '100px', resize: 'vertical' }} placeholder="Brief description..." value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} required />
              </FormField>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn" onClick={closeCreateModal} style={{ padding: '10px 24px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)', borderRadius: '8px' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ padding: '10px 24px', borderRadius: '8px' }}>
                  {submitting ? 'Processing...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && selectedRequest && (
        <LeaveDetailModal
          request={selectedRequest}
          onClose={handleCloseModal}
          onApprove={activeTab === 'manage-requests' ? handleApprove : undefined}
          onReject={activeTab === 'manage-requests' ? handleReject : undefined}
          actionError={actionError}
          actionSuccess={actionSuccess}
        />
      )}
    </div>
  );
}

// --- LEAVE DETAIL MODAL COMPONENT ---

function LeaveDetailModal({
  request,
  onClose,
  onApprove,
  onReject,
  actionError,
  actionSuccess,
}: {
  request: LeaveRequest;
  onClose: () => void;
  onApprove?: (requestId: string) => Promise<void>;
  onReject?: (requestId: string, reason: string) => Promise<void>;
  actionError: string | null;
  actionSuccess: string | null;
}) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const isPending = (request?.status ?? '').toUpperCase() === 'PENDING';

  const handleApproveClick = async () => {
    if (!onApprove) return;
    setIsProcessing(true);
    await onApprove(request.id);
    setIsProcessing(false);
  };

  const handleRejectClick = async () => {
    if (!onReject || !rejectionReason.trim()) return;
    setIsProcessing(true);
    await onReject(request.id, rejectionReason);
    setIsProcessing(false);
  };

  const start = new Date(request.startDate);
  const end = new Date(request.endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
      onClick={onClose}
    >
      <div
        className="custom-scrollbar"
        style={{ background: 'var(--color-bg, #1a1a2e)', borderRadius: '12px', padding: '32px', maxWidth: '560px', width: '100%', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--color-border, rgba(255,255,255,0.1))', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.1))' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: 'var(--color-text, #e2e8f0)' }}>Leave Request Detail</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted, #94a3b8)', fontSize: '24px', cursor: 'pointer', padding: '4px 8px', lineHeight: 1 }}>×</button>
        </div>

        {actionError && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{actionError}</div>}
        {actionSuccess && (
          <div className="alert" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid var(--color-success-ring)', marginBottom: '16px' }}>
            <span style={{ marginRight: '8px' }}>✓</span> {actionSuccess}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <DetailRow label="Employee" value={request.employee?.fullName || 'Unknown'} />
          <DetailRow label="Leave Type" value={<TypeBadge type={request.leaveType} />} isBadge />
          <DetailRow label="Period" value={`${new Date(request.startDate).toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })} — ${new Date(request.endDate).toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}`} />
          <DetailRow label="Duration" value={`${days} day${days > 1 ? 's' : ''}`} />
          <DetailRow label="Status" value={<StatusBadge status={request.status} />} isBadge />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--color-text-muted, #94a3b8)', letterSpacing: '0.5px' }}>Reason</span>
            <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '14px', color: 'var(--color-text, #e2e8f0)', lineHeight: '1.6', wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
              {request.reason || '—'}
            </div>
          </div>

          {request.rejectionReason && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--color-text-muted, #94a3b8)', letterSpacing: '0.5px' }}>Rejection Reason</span>
              <div style={{ padding: '12px 16px', background: 'rgba(244, 63, 94, 0.08)', borderRadius: '8px', fontSize: '14px', color: '#fb7185', lineHeight: '1.6', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                {request.rejectionReason}
              </div>
            </div>
          )}

          <DetailRow label="Submitted At" value={new Date(request.createdAt).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
          {request.decidedAt && (
            <DetailRow label="Decided At" value={new Date(request.decidedAt).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
          )}
        </div>

        {isPending && onApprove && onReject && (
          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--color-border, rgba(255,255,255,0.1))', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button onClick={handleApproveClick} disabled={isProcessing} style={{ padding: '10px 24px', fontSize: '14px', fontWeight: '600', border: 'none', background: 'var(--color-success, #22c55e)', color: 'white', borderRadius: '8px', cursor: isProcessing ? 'not-allowed' : 'pointer', opacity: isProcessing ? 0.6 : 1, transition: 'all 0.2s ease' }}>
              {isProcessing ? 'Processing...' : 'Approve'}
            </button>
            {!showRejectForm ? (
              <button onClick={() => setShowRejectForm(true)} disabled={isProcessing} style={{ padding: '10px 24px', fontSize: '14px', fontWeight: '600', border: '1px solid var(--color-error, #ef4444)', background: 'transparent', color: 'var(--color-error, #ef4444)', borderRadius: '8px', cursor: isProcessing ? 'not-allowed' : 'pointer', opacity: isProcessing ? 0.6 : 1, transition: 'all 0.2s ease' }}>
                Reject
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, marginRight: '-48px' }}>
                <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Rejection reason (required)" style={{ padding: '8px 12px', fontSize: '13px', border: '1px solid var(--color-border, rgba(255,255,255,0.1))', borderRadius: '6px', background: 'var(--color-bg, #1a1a2e)', color: 'var(--color-text, #e2e8f0)', minHeight: '60px', fontFamily: 'inherit', resize: 'vertical', width: '100%' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleRejectClick} disabled={!rejectionReason.trim() || isProcessing} style={{ padding: '8px 20px', fontSize: '13px', fontWeight: '600', background: 'var(--color-error, #ef4444)', color: 'white', border: 'none', borderRadius: '6px', cursor: !rejectionReason.trim() || isProcessing ? 'not-allowed' : 'pointer', opacity: !rejectionReason.trim() || isProcessing ? 0.6 : 1, transition: 'all 0.2s ease' }}>
                    {isProcessing ? 'Processing...' : 'Confirm Reject'}
                  </button>
                  <button onClick={() => { setShowRejectForm(false); setRejectionReason(''); }} disabled={isProcessing} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '600', background: 'transparent', color: 'var(--color-text-muted, #94a3b8)', border: '1px solid var(--color-border, rgba(255,255,255,0.1))', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {(!isPending || !onApprove || !onReject) && (
          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--color-border, rgba(255,255,255,0.1))', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '10px 24px', fontSize: '14px', fontWeight: '600', border: '1px solid var(--color-border, rgba(255,255,255,0.1))', background: 'transparent', color: 'var(--color-text, #e2e8f0)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value, isBadge }: { label: string; value: React.ReactNode; isBadge?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--color-text-muted, #94a3b8)', letterSpacing: '0.5px' }}>{label}</span>
      <div style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '14px', color: 'var(--color-text, #e2e8f0)', display: 'flex', alignItems: 'center', minHeight: isBadge ? '32px' : undefined, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
        {value}
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const t = type.toUpperCase();
  let color = '#a5b4fc';
  let bg = 'rgba(99, 102, 241, 0.12)';
  if (t === 'SICK') { color = '#fb7185'; bg = 'rgba(244, 63, 94, 0.12)'; }
  if (t === 'UNPAID') { color = '#fbbf24'; bg = 'rgba(245, 158, 11, 0.12)'; }
  if (t === 'ANNUAL') { color = '#a5b4fc'; bg = 'rgba(99, 102, 241, 0.12)'; }
  return (
    <span style={{ fontSize: '10px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', background: bg, color, border: `1px solid ${color}20`, textTransform: 'uppercase' }}>
      {t}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  let color = '#94a3b8';
  let bg = 'rgba(148, 163, 184, 0.12)';
  if (s === 'APPROVED') { color = 'var(--color-success)'; bg = 'var(--color-success-bg)'; }
  if (s === 'REJECTED') { color = 'var(--color-error)'; bg = 'var(--color-error-bg)'; }
  return (
    <span style={{ fontSize: '10px', fontWeight: '800', padding: '4px 10px', borderRadius: '6px', background: bg, color, border: `1px solid ${color}25`, textTransform: 'uppercase' }}>
      {s}
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