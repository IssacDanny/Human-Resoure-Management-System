import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../api/config';
import { type AttendanceRecord } from '../types/attendance';

export function AttendancePage() {
  const { token } = useAuth();
  
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  // --- STATS CALCULATION ---
  const stats = useMemo(() => {
    return {
      present: records.filter(r => r.status.toUpperCase() === 'PRESENT').length,
      late: records.filter(r => r.status.toUpperCase() === 'LATE').length,
      absent: records.filter(r => r.status.toUpperCase() === 'ABSENT').length,
      halfDay: records.filter(r => r.status.toUpperCase() === 'HALF_DAY').length,
    };
  }, [records]);

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          HRMS · Timekeeper
        </div>
        <h1 className="page-title">My Attendance</h1>
        <p className="page-subtitle">Summary and detailed logs for your working hours.</p>
      </header>

      {/* --- CONTROLS & STATS GRID --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* Month Picker Card */}
        <div className="form-card" style={{ padding: '24px' }}>
          <label className="form-label" htmlFor="month-select">Period Selection</label>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <select 
              id="month-select"
              className="form-select" 
              value={month} 
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('en-US', { month: 'short' })}
                </option>
              ))}
            </select>
            <select 
              id="year-select"
              className="form-select" 
              value={year} 
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Card */}
        <div className="form-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          <StatItem label="Present" value={stats.present} color="var(--color-success)" />
          <StatItem label="Late" value={stats.late} color="#fbbf24" />
          <StatItem label="Absent" value={stats.absent} color="var(--color-error)" />
          <StatItem label="Half Day" value={stats.halfDay} color="#a5b4fc" />
        </div>
      </div>

      {/* --- DETAILED LIST --- */}
      <div className="form-card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <span className="spinner" style={{ width: '24px', height: '24px', borderTopColor: 'var(--color-primary)' }} />
          </div>
        ) : error ? (
          <div style={{ padding: '40px' }} className="alert alert-error">{error}</div>
        ) : message ? (
          <div style={{ padding: '80px 40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '15px' }}>{message}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <th style={tableHeaderStyle}>Date</th>
                  <th style={tableHeaderStyle}>Status</th>
                  <th style={tableHeaderStyle}>Check In</th>
                  <th style={tableHeaderStyle}>Check Out</th>
                  <th style={tableHeaderStyle}>Note</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} style={{ transition: 'background 0.2s' }}>
                    <td style={tableCellStyle}>
                      <div style={{ fontWeight: 600 }}>
                        {new Date(record.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}
                      </div>
                    </td>
                    <td style={tableCellStyle}>
                      <StatusBadge status={record.status} />
                    </td>
                    <td style={tableCellStyle}>{formatTime(record.checkInTime)}</td>
                    <td style={tableCellStyle}>{formatTime(record.checkOutTime)}</td>
                    <td style={{ ...tableCellStyle, color: 'var(--color-text-muted)', fontSize: '12px', fontStyle: record.notes ? 'normal' : 'italic' }}>
                      {record.notes || 'No notes'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function StatItem({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '28px', fontWeight: '800', color, lineHeight: '1' }}>{value}</div>
      <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginTop: '6px', letterSpacing: '0.05em' }}>
        {label}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  let color = 'var(--color-text-muted)';
  let bg = 'var(--color-surface-raised)';
  
  if (s === 'PRESENT') { color = 'var(--color-success)'; bg = 'var(--color-success-bg)'; }
  else if (s === 'ABSENT') { color = 'var(--color-error)'; bg = 'var(--color-error-bg)'; }
  else if (s === 'LATE') { color = '#fbbf24'; bg = 'rgba(245, 158, 11, 0.15)'; }
  else if (s === 'HALF_DAY') { color = '#a5b4fc'; bg = 'rgba(99, 102, 241, 0.15)'; }

  return (
    <span style={{
      fontSize: '10px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px',
      background: bg, color, border: `1px solid ${color}20`, textTransform: 'uppercase',
      letterSpacing: '0.02em', display: 'inline-block'
    }}>
      {s.replace('_', ' ')}
    </span>
  );
}

// --- STYLES ---

const tableHeaderStyle: React.CSSProperties = {
  padding: '16px 24px',
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--color-text-muted)',
  borderBottom: '1px solid var(--color-border)'
};

const tableCellStyle: React.CSSProperties = {
  padding: '16px 24px',
  borderBottom: '1px solid var(--color-border)',
  fontSize: '14px',
  verticalAlign: 'middle'
};

function formatTime(iso: string | null | undefined) {
  if (!iso) return '—';
  // Use a 24h or 12h format based on preference
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}
