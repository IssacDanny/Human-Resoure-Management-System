import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../api/config';
import { type AttendanceRecord } from '../types/attendance';

export function AttendancePage() {
  const { token } = useAuth();
  
  // 1. STATE: Current Month/Year for Picker
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 2. FETCH LOGIC
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
        <p className="page-subtitle">View your attendance logs and worked days for the month.</p>
      </header>

      {/* 3. PICKER: Month and Year Selection */}
      <div className="form-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label className="form-label" htmlFor="month-select">Select Month</label>
            <select 
              id="month-select"
              className="form-select" 
              value={month} 
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('en-US', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label className="form-label" htmlFor="year-select">Select Year</label>
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
      </div>

      {/* 4. RESULTS: Table or Empty State */}
      <div className="form-card">
        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>Loading records...</p>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : message ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '15px' }}>{message}</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '12px', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '12px', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>Check In</th>
                <th style={{ padding: '12px', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>Check Out</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>
                    {new Date(record.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>
                    {(() => {
                      const status = record.status.toUpperCase();
                      let styles = { bg: 'var(--color-surface-raised)', text: 'var(--color-text-muted)' };
                      
                      if (status === 'PRESENT') styles = { bg: 'var(--color-success-bg)', text: 'var(--color-success)' };
                      if (status === 'ABSENT') styles = { bg: 'var(--color-error-bg)', text: 'var(--color-error)' };
                      if (status === 'LATE') styles = { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24' }; // Amber
                      if (status === 'HALF_DAY') styles = { bg: 'rgba(99, 102, 241, 0.15)', text: '#a5b4fc' }; // Indigo

                      return (
                        <span style={{
                          textTransform: 'uppercase', fontSize: '10px', fontWeight: 700,
                          letterSpacing: '0.05em', padding: '4px 10px', borderRadius: '6px',
                          background: styles.bg, color: styles.text,
                          border: `1px solid ${styles.text}20`
                        }}>
                          {status.replace('_', ' ')}
                        </span>
                      );
                    })()}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>
                    {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>
                    {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
