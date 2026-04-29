import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../api/config';
import { type LeaveRequest, type CreateLeaveRequest } from '../types/leave';
import { FormField } from '../components/ui/FormField';

export function LeavePage() {
  const { token, isAdmin, isManager } = useAuth();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'my-requests' | 'manage-requests'>('my-requests');
  
  // My requests state
  const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
  const [myRequestsLoading, setMyRequestsLoading] = useState(true);
  
  // Manage requests state
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
  const [allRequestsLoading, setAllRequestsLoading] = useState(false);
  
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
    if (!token) return;
    setMyRequestsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/leave-requests`, {
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
  }, [token]);

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
      // Only auto-update end date if it was empty or before the new start date
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

    // Backend matching validation
    if (form.leaveType !== 'SICK' && start < today) return setError('Annual or Unpaid leave must be for future dates.');
    if (start > end) return setError('Start date cannot be after end date.');
    if (form.reason.length < 5) return setError('Reason must be at least 5 characters.');

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
        body: JSON.stringify({ status: 'approved' })
      });

      if (!res.ok) throw new Error('Failed to approve request');

      setActionSuccess('Leave request approved successfully!');
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
        body: JSON.stringify({ status: 'rejected', rejectionReason })
      });

      if (!res.ok) throw new Error('Failed to reject request');

      setActionSuccess('Leave request rejected successfully!');
      loadAllRequests();
    } catch (err) {
      setActionError((err as Error).message);
    }
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

            {/* QOL: Stack vertically on small boxes to prevent overflow */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <FormField id="start" label="Start Date">
                <input 
                  type="date" 
                  className="form-input" 
                  min={form.leaveType === 'SICK' ? undefined : todayStr}
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
                      </tr>
                    </thead>
                    <tbody>
                      {myRequests.map(req => (
                        <tr key={req.id} style={{ transition: 'background 0.2s' }}>
                          <td style={tableCellStyle}>
                            <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                              {new Date(req.startDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })} — {new Date(req.endDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
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
                        <th style={tableHeaderStyle}>Employee & Period</th>
                        <th style={tableHeaderStyle}>Reason</th>
                        <th style={tableHeaderStyle}>Type</th>
                        <th style={tableHeaderStyle}>Status</th>
                        <th style={tableHeaderStyle}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allRequests.map(req => (
                        <ManageLeaveRow
                          key={req.id}
                          request={req}
                          onApprove={handleApprove}
                          onReject={handleReject}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// --- MANAGE LEAVE ROW COMPONENT ---

function ManageLeaveRow({
  request,
  onApprove,
  onReject,
}: {
  request: LeaveRequest;
  onApprove: (requestId: string) => Promise<void>;
  onReject: (requestId: string, reason: string) => Promise<void>;
}) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApproveClick = async () => {
    setIsProcessing(true);
    await onApprove(request.id);
    setIsProcessing(false);
  };

  const handleRejectClick = async () => {
    setIsProcessing(true);
    await onReject(request.id, rejectionReason);
    setIsProcessing(false);
    setShowRejectForm(false);
    setRejectionReason('');
  };

  const isPending = request.status === 'pending';

  return (
    <>
      <tr style={{ transition: 'background 0.2s' }}>
        <td style={tableCellStyle}>
          <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
            {request.employee?.fullName || 'Unknown'} - {new Date(request.startDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })} to {new Date(request.endDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </td>
        <td style={tableCellStyle}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {request.reason}
          </div>
        </td>
        <td style={tableCellStyle}>
          <TypeBadge type={request.leaveType} />
        </td>
        <td style={tableCellStyle}>
          <StatusBadge status={request.status} />
        </td>
        <td style={tableCellStyle}>
          {isPending ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleApproveClick}
                disabled={isProcessing}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  border: '1px solid var(--color-success)',
                  background: 'var(--color-success)',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  opacity: isProcessing ? 0.6 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                Approve
              </button>
              <button
                onClick={() => setShowRejectForm(!showRejectForm)}
                disabled={isProcessing}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  border: '1px solid var(--color-error)',
                  background: 'transparent',
                  color: 'var(--color-error)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  opacity: isProcessing ? 0.6 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                Reject
              </button>
            </div>
          ) : (
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>-</span>
          )}
        </td>
      </tr>
      {showRejectForm && isPending && (
        <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
          <td colSpan={5} style={{ padding: '16px 24px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Rejection reason (required)"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  minHeight: '60px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleRejectClick}
                  disabled={!rejectionReason.trim() || isProcessing}
                  style={{
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: 'var(--color-error)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: !rejectionReason.trim() || isProcessing ? 'not-allowed' : 'pointer',
                    opacity: !rejectionReason.trim() || isProcessing ? 0.6 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isProcessing ? 'Processing...' : 'Confirm Reject'}
                </button>
                <button
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectionReason('');
                  }}
                  disabled={isProcessing}
                  style={{
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: 'transparent',
                    color: 'var(--color-text-muted)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// --- BADGES ---

function TypeBadge({ type }: { type: string }) {
  const t = type.toUpperCase();
  let color = '#a5b4fc'; let bg = 'rgba(99, 102, 241, 0.12)';
  if (t === 'SICK') { color = '#fb7185'; bg = 'rgba(244, 63, 94, 0.12)'; }
  if (t === 'UNPAID') { color = '#fbbf24'; bg = 'rgba(245, 158, 11, 0.12)'; }
  return <span style={{ fontSize: '10px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', background: bg, color, border: `1px solid ${color}20`, textTransform: 'uppercase' }}>{t}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  let color = '#94a3b8'; let bg = 'rgba(148, 163, 184, 0.12)';
  if (s === 'APPROVED') { color = 'var(--color-success)'; bg = 'var(--color-success-bg)'; }
  if (s === 'REJECTED') { color = 'var(--color-error)'; bg = 'var(--color-error-bg)'; }
  return <span style={{ fontSize: '10px', fontWeight: '800', padding: '4px 10px', borderRadius: '6px', background: bg, color, border: `1px solid ${color}25`, textTransform: 'uppercase' }}>{s}</span>;
}

const tableHeaderStyle: React.CSSProperties = { padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' };
const tableCellStyle: React.CSSProperties = { padding: '16px 24px', borderBottom: '1px solid var(--color-border)', fontSize: '14px', verticalAlign: 'middle' };
