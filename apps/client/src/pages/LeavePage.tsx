import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../api/config';
import { type LeaveRequest, type CreateLeaveRequest } from '../types/leave';
import { FormField } from '../components/ui/FormField';

export function LeavePage() {
  const { token } = useAuth();
  
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Use today's date string for min constraint (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState<CreateLeaveRequest>({
    leaveType: 'ANNUAL' as any,
    startDate: '',
    endDate: '',
    reason: '',
  });

  const loadHistory = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/leave-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      setRequests(result.data);
    } catch (err) {
      console.error('Failed to load leave history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHistory(); }, [token]);

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
      loadHistory();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
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
        <h1 className="page-title">My Leave Requests</h1>
        <p className="page-subtitle">Submit new requests and track your holiday history.</p>
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

        {/* HISTORY TABLE */}
        <div className="form-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--color-border)' }}>
            <h2 className="form-title" style={{ fontSize: '18px' }}>Request History</h2>
          </div>
          
          {loading ? (
            <div style={{ padding: '80px', textAlign: 'center' }}>
              <span className="spinner" style={{ width: '28px', height: '28px', borderTopColor: 'var(--color-primary)' }} />
            </div>
          ) : requests.length === 0 ? (
            <div style={{ padding: '80px 40px', textAlign: 'center' }}>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '15px' }}>No requests found.</p>
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
                  {requests.map(req => (
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
        </div>
      </div>
    </div>
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
