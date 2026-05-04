import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../api/config';
import { type Payslip } from '../types/payroll';

export function PayrollPage() {
  const { token } = useAuth();
  
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  
  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPayslip() {
      if (!token) return;
      setLoading(true);
      setMessage(null);

      try {
        const response = await fetch(`${API_BASE_URL}/payslips?month=${month}&year=${year}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const result = await response.json();
        setAvailable(result.available);
        setPayslip(result.data);
        if (!result.available) setMessage(result.message);
      } catch (err) {
        setMessage('Failed to load payslip data.');
      } finally {
        setLoading(false);
      }
    }

    fetchPayslip();
  }, [token, month, year]);

  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Handle PDF download: open clean popup with only payslip data
  const handleDownloadPdf = () => {
    if (!available || !payslip) return;

    const period = new Date(year, month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const generatedAt = new Date(payslip.generatedAt || '').toLocaleDateString();
    const stdDays = payslip.standardWorkingDays ?? '—';
    const workedDays = Number(payslip.actualWorkedDays);
    const basic = Number(payslip.snapshotBasicSalary);
    const allowance = Number(payslip.allowance);
    const bonus = Number(payslip.bonus);
    const grossTotal = basic + allowance + bonus;
    const deduction = Number(payslip.deduction);
    const netSalary = Number(payslip.netSalary);

    const format = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

    const printWindow = window.open('', '', 'width=800,height=900');
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html><html><head><title>pay_slip_${String(month).padStart(2,'0')}${year}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; padding: 40px; background: #fff; }
      h1 { font-size: 22px; margin-bottom: 4px; }
      .subtitle { color: #666; margin-bottom: 24px; font-size: 14px; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #ddd; padding-bottom: 20px; margin-bottom: 24px; }
      .net-label { font-size: 11px; font-weight: 700; color: #555; text-transform: uppercase; letter-spacing: 0.08em; }
      .net-amount { font-size: 28px; font-weight: 800; color: #111; margin-top: 4px; }
      table { width: 48%; border-collapse: collapse; }
      td { padding: 8px 0; font-size: 14px; border-bottom: 1px solid #eee; }
      td:first-child { color: #444; }
      td:last-child { text-align: right; font-weight: 500; }
      .side-by-side { display: flex; gap: 32px; }
      .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; padding-bottom: 8px; margin-bottom: 4px; }
      .section-earnings { border-bottom: 2px solid #6366f1; color: #333; }
      .section-deductions { border-bottom: 2px solid #ef4444; color: #c00; }
      .total-row td { font-weight: 700; border-top: 2px solid #ccc; padding-top: 10px; color: #111; }
      .deduction-value { color: #c00; }
      @media print { body { padding: 20px; } }
    </style></head><body>
    <div class="header">
      <div>
        <h1>PAYSLIP #${payslip.id}</h1>
        <p class="subtitle">Period: ${period}</p>
      </div>
      <div style="text-align:right">
        <div class="net-label">Net Salary</div>
        <div class="net-amount">${format(netSalary)}</div>
      </div>
    </div>
    <div class="side-by-side">
      <div>
        <div class="section-title section-earnings">Earnings</div>
        <table>
          <tr><td>Basic Salary</td><td>${format(basic)}</td></tr>
          <tr><td>Allowances</td><td>${format(allowance)}</td></tr>
          <tr><td>Bonus</td><td>${format(bonus)}</td></tr>
          <tr class="total-row"><td>Gross Total</td><td>${format(grossTotal)}</td></tr>
        </table>
      </div>
      <div>
        <div class="section-title section-deductions">Deductions</div>
        <table>
          <tr><td>Statutory Deductions (IT/UI)</td><td class="deduction-value">-${format(deduction)}</td></tr>
          <tr class="total-row"><td>Total Deductions</td><td class="deduction-value">-${format(deduction)}</td></tr>
        </table>
      </div>
    </div>
    </body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 400);
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          HRMS · Finance
        </div>
        <h1 className="page-title">My Payslip</h1>
        <p className="page-subtitle">Monthly earnings statement and salary breakdown.</p>
      </header>

      {/* 1. PERIOD PICKER */}
      <div className="form-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className="form-label">Period</label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <select className="form-select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en-US', { month: 'long' })}</option>
                ))}
              </select>
              <select className="form-select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={handleDownloadPdf} disabled={!available}>
            Download PDF
          </button>
        </div>
      </div>

      {/* 2. PAYSLIP CONTENT */}
      {loading ? (
        <div className="form-card" style={{ textAlign: 'center', padding: '60px' }}>
          <span className="spinner" style={{ borderTopColor: 'var(--color-primary)' }} />
        </div>
      ) : !available ? (
        <div className="form-card" style={{ textAlign: 'center', padding: '80px 40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📄</div>
          <h3 style={{ margin: '0 0 10px' }}>{message}</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>Payroll for this period has not been finalized by HR.</p>
        </div>
      ) : (
        <div className="form-card" style={{ padding: '40px' }}>
          {/* Header Summary */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--color-border)', paddingBottom: '30px', marginBottom: '30px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '24px' }}>PAYSLIP #{String(payslip?.id)}</h2>
              <p style={{ color: 'var(--color-text-muted)', margin: '5px 0 0' }}>Period: {new Date(year, month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>Net Salary</div>
              <div style={{ fontSize: '32px', fontWeight: 800 }}>{formatCurrency(Number(payslip?.netSalary))}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            {/* EARNINGS */}
            <div>
              <h4 style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>Earnings</h4>
              <div style={lineItemStyle}><span>Basic Salary</span> <span>{formatCurrency(Number(payslip?.snapshotBasicSalary))}</span></div>
              <div style={lineItemStyle}><span>Allowances</span> <span>{formatCurrency(Number(payslip?.allowance))}</span></div>
              <div style={lineItemStyle}><span>Bonus</span> <span>{formatCurrency(Number(payslip?.bonus))}</span></div>
              <div style={{ ...lineItemStyle, fontWeight: 700, marginTop: '10px', borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
                <span>Gross Total</span> <span>{formatCurrency(Number(payslip?.snapshotBasicSalary) + Number(payslip?.allowance) + Number(payslip?.bonus))}</span>
              </div>
            </div>

            {/* DEDUCTIONS */}
            <div>
              <h4 style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px', color: 'var(--color-error)' }}>Deductions</h4>
              <div style={lineItemStyle}><span>Statutory Deductions (IT/UI)</span> <span style={{ color: 'var(--color-error)' }}>-{formatCurrency(Number(payslip?.deduction))}</span></div>
              <div style={{ ...lineItemStyle, fontWeight: 700, marginTop: '10px', borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
                <span>Total Deductions</span> <span style={{ color: 'var(--color-error)' }}>-{formatCurrency(Number(payslip?.deduction))}</span>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div style={{ marginTop: '40px', padding: '20px', background: 'var(--color-surface-raised)', borderRadius: '8px', fontSize: '13px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              <div><strong>Standard Days:</strong> {payslip?.standardWorkingDays}</div>
              <div><strong>Worked Days:</strong> {Number(payslip?.actualWorkedDays)}</div>
              <div><strong>Generated At:</strong> {new Date(payslip?.generatedAt || '').toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const lineItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '12px 0',
  fontSize: '14px'
};
