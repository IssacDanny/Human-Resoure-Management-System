import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../api/config';
import { type LeaveRequest, type CreateLeaveRequest } from '../types/leave';
import { FormField } from '../components/ui/FormField';

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

  const loadMyRequests = async () => {
    if (!token || !user) return;
    setMyRequestsLoading(true);
    try {
      const url = new URL(`${API_BASE_URL}/leave-requests`);
      url.searchParams.append('filter[employeeId]', user.id);
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      setMyRequests(result.data);
    } catch (err) {
      console.error('Failed to load leave history');
    } finally {
      setMyRequestsLoading(false);
    }
  };

  const loadAllRequests = async () => {
    if (!token || (!isAdmin && !isManager)) return;
    setAllRequestsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/leave-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      setAllRequests(result.data);
    } catch (err) {
      console.error('Failed to load all leave requests');
    } finally {
      setAllRequestsLoading(false);
    }
  };

  useEffect(() => { 
    loadMyRequests();
  }, [token, user]);

  // Load all requests when tab changes to manage-requests
  useEffect(() => {
    if (activeTab === 'manage-requests' && allRequests.length === 0 && !allRequestsLoading) {
      loadAllRequests();
    }
  }, [activeTab]);

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
      loadMyRequests();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
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
      loadAllRequests();
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
      loadAllRequests();
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

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '32px', alignItems: 'start' }}>
        
        {/* SUBMISSION FORM */}
        <div className="form-card" style={{ maxWidth: '100%' }}>
          <div className="form-header" style={{ marginBottom: '24px', paddingBottom: '16px' }}>
            <h2 className="form-title" style={{ fontSize: '18px' }}>New Request</h2>
          </div>
          
          {error && <div className="alert alert-error" style={{ marginBottom: '24px' }}>{error}</div>}
          {success && (
            <div className="alert" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid var(--color-success-ring)', marginBottom: '24px' }}>
              <span style={{ marginRight: '8px' }}>✓</span> {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <FormField id="type" label="Leave Type">
              <select 
                className="form-select" 
                value={form.leaveType} 
                onChange={e => setForm({...form, leaveType: e.target.value as any})}
              >
                <option value="ANNUAL">Annual Leave</option>
                <option value="SICK">Sick Leave</option>
                <option value="UNPAID">Unpaid Leave</option>
              </select>
            </FormField>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <FormField id="start" label="Start Date">
                <input 
                  type="date" 
                  className="form-input" 
                  min={form.leaveType === 'sick' ? undefined : todayStr}
                  value={form.startDate} 
                  onChange={e => handleStartChange(e.target.value)} 
                  required 
                />
              </FormField>
              <FormField id="end" label="End Date">
                <input 
                  type="date" 
                  className="form-input" 
                  min={form.startDate || todayStr}
                  value={form.endDate} 
                  onChange={e => setForm({...form, endDate: e.target.value})} 
                  required 
                />
              </FormField>
            </div>

            <FormField id="reason" label="Reason">
              <textarea 
                className="form-input" 
                style={{ minHeight: '120px', resize: 'vertical' }}
                placeholder="Brief description..."
                value={form.reason}
                onChange={e => setForm({...form, reason: e.target.value})}
                required
              />
            </FormField>

            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%', padding: '12px' }}>
              {submitting ? 'Processing...' : 'Submit Request'}
            </button>
          </form>
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
                        <th style={tableHeaderStyle}>Period & Reason</th>
                        <th style={tableHeaderStyle}>Type</th>
                        <th style={tableHeaderStyle}>Status</th>
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
                              style={{
                                padding: '6px 14px',
                                fontSize: '12px',
                                fontWeight: '600',
                                border: '1px solid var(--color-primary)',
                                background: 'transparent',
                                color: 'var(--color-primary)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
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
                        <th style={tableHeaderStyle}>Employee</th>
                        <th style={tableHeaderStyle}>Period & Reason</th>
                        <th style={tableHeaderStyle}>Type</th>
                        <th style={tableHeaderStyle}>Status</th>
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
                              style={{
                                padding: '6px 14px',
                                fontSize: '12px',
                                fontWeight: '600',
                                border: '1px solid var(--color-primary)',
                                background: 'transparent',
                                color: 'var(--color-primary)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
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
        </div>
      </div>

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

  // Calculate number of days
  const start = new Date(request.startDate);
  const end = new Date(request.endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        className="custom-scrollbar"
        style={{
          background: 'var(--color-bg, #1a1a2e)',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1px solid var(--color-border, rgba(255,255,255,0.1))',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.1))' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: 'var(--color-text, #e2e8f0)' }}>
            Leave Request Detail
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-muted, #94a3b8)',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px 8px',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* Alert Messages */}
        {actionError && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>{actionError}</div>
        )}
        {actionSuccess && (
          <div className="alert" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid var(--color-success-ring)', marginBottom: '16px' }}>
            <span style={{ marginRight: '8px' }}>✓</span> {actionSuccess}
          </div>
        )}

        {/* Detail Fields */}
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

        {/* Action Buttons - only show for admins/managers */}
        {isPending && onApprove && onReject && (
          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--color-border, rgba(255,255,255,0.1))', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={handleApproveClick}
              disabled={isProcessing}
              style={{
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                background: 'var(--color-success, #22c55e)',
                color: 'white',
                borderRadius: '8px',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                opacity: isProcessing ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              {isProcessing ? 'Processing...' : 'Approve'}
            </button>
            {!showRejectForm ? (
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={isProcessing}
                style={{
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: '1px solid var(--color-error, #ef4444)',
                  background: 'transparent',
                  color: 'var(--color-error, #ef4444)',
                  borderRadius: '8px',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.6 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                Reject
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, marginRight: '-48px' }}>
                <textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Rejection reason (required)"
                  style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    border: '1px solid var(--color-border, rgba(255,255,255,0.1))',
                    borderRadius: '6px',
                    background: 'var(--color-bg, #1a1a2e)',
                    color: 'var(--color-text, #e2e8f0)',
                    minHeight: '60px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    width: '100%'
                  }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleRejectClick}
                    disabled={!rejectionReason.trim() || isProcessing}
                    style={{
                      padding: '8px 20px',
                      fontSize: '13px',
                      fontWeight: '600',
                      background: 'var(--color-error, #ef4444)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: !rejectionReason.trim() || isProcessing ? 'not-allowed' : 'pointer',
                      opacity: !rejectionReason.trim() || isProcessing ? 0.6 : 1,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isProcessing ? 'Processing...' : 'Confirm Reject'}
                  </button>
                  <button
                    onClick={() => { setShowRejectForm(false); setRejectionReason(''); }}
                    disabled={isProcessing}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '600',
                      background: 'transparent',
                      color: 'var(--color-text-muted, #94a3b8)',
                      border: '1px solid var(--color-border, rgba(255,255,255,0.1))',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Close Button — show when not pending OR when no approve/reject handlers (read-only view) */}
        {(!isPending || !onApprove || !onReject) && (
          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--color-border, rgba(255,255,255,0.1))', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: '600',
                border: '1px solid var(--color-border, rgba(255,255,255,0.1))',
                background: 'transparent',
                color: 'var(--color-text, #e2e8f0)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- DETAIL ROW COMPONENT ---

function DetailRow({ label, value, isBadge }: { label: string; value: React.ReactNode; isBadge?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--color-text-muted, #94a3b8)', letterSpacing: '0.5px' }}>
        {label}
      </span>
      <div style={{
        padding: '10px 16px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '8px',
        fontSize: '14px',
        color: 'var(--color-text, #e2e8f0)',
        display: 'flex',
        alignItems: 'center',
        minHeight: isBadge ? '32px' : undefined,
        wordBreak: 'break-word',
        overflowWrap: 'break-word'
      }}>
        {value}
      </div>
    </div>
  );
}

// --- BADGES ---

function TypeBadge({ type }: { type: string }) {
  const t = type.toUpperCase();
  let color = '#a5b4fc';
  let bg = 'rgba(99, 102, 241, 0.12)';
  if (t === 'SICK') { color = '#fb7185'; bg = 'rgba(244, 63, 94, 0.12)'; }
  if (t === 'UNPAID') { color = '#fbbf24'; bg = 'rgba(245, 158, 11, 0.12)'; }
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