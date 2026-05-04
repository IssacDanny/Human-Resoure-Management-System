import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../api/config';
import { type Payslip } from '../types/payroll';
import { type Employee } from '../types/employee';
import { FormField } from '../components/ui/FormField';

export function PayrollPage() {
  const { token, isAdmin, isManager } = useAuth();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genSuccess, setGenSuccess] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  // Generate form state
  const [genMonth, setGenMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [genYear, setGenYear] = useState(String(new Date().getFullYear()));
  const [genStandardDays, setGenStandardDays] = useState(22);
  const [genActualDays, setGenActualDays] = useState(22);
  const [genBasicSalary, setGenBasicSalary] = useState('');
  const [genAllowance, setGenAllowance] = useState('');
  const [genBonus, setGenBonus] = useState('');
  const [genDeduction, setGenDeduction] = useState('');

  // Employee search state (same as Manage Attendance tab)
  const [genSearchQuery, setGenSearchQuery] = useState('');
  const [genEmployees, setGenEmployees] = useState<Employee[]>([]);
  const [genSearchLoading, setGenSearchLoading] = useState(false);
  const [genShowDropdown, setGenShowDropdown] = useState(false);
  const [genSelectedEmployee, setGenSelectedEmployee] = useState<Employee | null>(null);
  const [genHasFocused, setGenHasFocused] = useState(false);
  
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

  // Search employees - same logic as Manage Attendance tab
  useEffect(() => {
    async function searchEmployees() {
      if (!token) return;

      // On first focus with empty query, load 10 employees
      if (genHasFocused && !genSearchQuery.trim()) {
        setGenSearchLoading(true);
        try {
          const response = await fetch(`${API_BASE_URL}/employees?limit=10`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!response.ok) throw new Error('Failed to load employees');
          const result = await response.json();
          setGenEmployees(result.data || []);
        } catch (err) {
          console.error('Load employees error:', err);
          setGenEmployees([]);
        } finally {
          setGenSearchLoading(false);
        }
        return;
      }

      // When query is not empty, search
      if (genSearchQuery.trim()) {
        setGenSearchLoading(true);
        try {
          const response = await fetch(`${API_BASE_URL}/employees?search=${encodeURIComponent(genSearchQuery)}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!response.ok) throw new Error('Failed to search employees');
          const result = await response.json();
          setGenEmployees(result.data || []);
        } catch (err) {
          console.error('Search error:', err);
          setGenEmployees([]);
        } finally {
          setGenSearchLoading(false);
        }
      }
    }

    if (genHasFocused || genSearchQuery.trim()) {
      searchEmployees();
    }
  }, [token, genSearchQuery, genHasFocused]);

  const handleGenSelectEmployee = (employee: Employee) => {
    setGenSelectedEmployee(employee);
    setGenSearchQuery('');
    setGenShowDropdown(false);
    setGenHasFocused(false);
    // Auto-load employee's basic salary
    if (employee.basicSalary != null) {
      setGenBasicSalary(String(employee.basicSalary));
    }
  };

  const handleGeneratePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genSelectedEmployee) {
      setGenError('Please select an employee first');
      return;
    }
    setGenError(null);
    setGenSuccess(null);
    setGenerating(true);

    try {
      const monthStr = `${genYear}-${genMonth}`;
      const netSalaryCalc = Number(genBasicSalary || 0) + Number(genAllowance || 0) + Number(genBonus || 0) - Number(genDeduction || 0);

      const res = await fetch(`${API_BASE_URL}/payroll-runs/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: genSelectedEmployee.id,
          month: monthStr,
          standardWorkingDays: genStandardDays,
          actualWorkedDays: genActualDays,
          snapshotBasicSalary: Number(genBasicSalary || 0),
          allowance: Number(genAllowance || 0),
          bonus: Number(genBonus || 0),
          deduction: Number(genDeduction || 0),
          netSalary: netSalaryCalc,
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to generate payroll');
      }

      setGenSuccess(`Payroll generated successfully for ${genSelectedEmployee.fullName}!`);
      // Reset form
      setGenSelectedEmployee(null);
      setGenBasicSalary('');
      setGenAllowance('');
      setGenBonus('');
      setGenDeduction('');
      // Reload payslip if it matches the current period
      if (Number(genMonth) === month && Number(genYear) === year) {
        fetchPayslip();
      }
      setTimeout(() => setGenSuccess(null), 3000);
    } catch (err) {
      setGenError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const fetchPayslip = async () => {
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

      {/* GENERATE PAYROLL BUTTON (HR/Manager only) */}
      {(isAdmin || isManager) && (
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-primary"
            onClick={() => setShowGenerateModal(true)}
            style={{ fontSize: '14px', padding: '10px 24px' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '8px' }}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Generate Payroll
          </button>
        </div>
      )}

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

      {/* GENERATE PAYROLL MODAL */}
      {showGenerateModal && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
          onClick={() => setShowGenerateModal(false)}
        >
          <div
            style={{ background: 'var(--color-bg, #1a1a2e)', borderRadius: '12px', padding: '32px', maxWidth: '560px', width: '100%', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--color-border, rgba(255,255,255,0.1))', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.1))' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: 'var(--color-text, #e2e8f0)' }}>Generate Payroll</h2>
              <button onClick={() => setShowGenerateModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted, #94a3b8)', fontSize: '24px', cursor: 'pointer', padding: '4px 8px', lineHeight: 1 }}>×</button>
            </div>

            {genError && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{genError}</div>}
            {genSuccess && (
              <div className="alert" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid var(--color-success-ring)', marginBottom: '20px' }}>
                <span style={{ marginRight: '8px' }}>✓</span> {genSuccess}
              </div>
            )}

            <form onSubmit={handleGeneratePayroll} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Employee Search */}
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text-muted)' }}>
                  Search Employee:
                </label>
                <input
                  type="text"
                  placeholder="Enter employee name..."
                  value={genSearchQuery}
                  onChange={(e) => {
                    setGenSearchQuery(e.target.value);
                    setGenShowDropdown(true);
                  }}
                  onFocus={() => {
                    setGenHasFocused(true);
                    setGenShowDropdown(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => setGenShowDropdown(false), 200);
                  }}
                  className="form-input"
                  style={{ width: '100%' }}
                />

                {/* Selected Employee Badge */}
                {genSelectedEmployee && (
                  <div style={{
                    marginTop: '8px',
                    padding: '10px 14px',
                    backgroundColor: 'rgba(99, 102, 241, 0.12)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--color-text)' }}>
                        {genSelectedEmployee.fullName}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {genSelectedEmployee.workEmail} · {genSelectedEmployee.jobTitle}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setGenSelectedEmployee(null); setGenHasFocused(false); setGenBasicSalary(''); }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '18px', padding: '0 4px' }}
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Dropdown */}
                {genShowDropdown && !genSelectedEmployee && (genSearchQuery || genHasFocused) && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '0',
                    right: '0',
                    backgroundColor: '#1e2435',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderTop: 'none',
                    borderRadius: '0 0 8px 8px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 100,
                    marginTop: '-4px'
                  }}>
                    {genSearchLoading && (
                      <div style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: '14px' }}>
                        Searching...
                      </div>
                    )}
                    {!genSearchLoading && genEmployees.length === 0 && (
                      <div style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: '14px' }}>
                        No employees found
                      </div>
                    )}
                    {genEmployees.map((emp) => (
                      <div
                        key={emp.id}
                        onClick={() => handleGenSelectEmployee(emp)}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--color-border)',
                          fontSize: '14px',
                          color: 'var(--color-text)',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ fontWeight: '600' }}>{emp.fullName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          {emp.workEmail}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Month & Year */}
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <FormField id="genMonth" label="Month">
                    <input type="number" className="form-input" min="1" max="12" value={genMonth} onChange={e => setGenMonth(String(Math.max(1, Math.min(12, Number(e.target.value)))).padStart(2, '0'))} required />
                  </FormField>
                </div>
                <div style={{ flex: 1 }}>
                  <FormField id="genYear" label="Year">
                    <input type="number" className="form-input" value={genYear} onChange={e => setGenYear(e.target.value)} required min="2020" max="2030" />
                  </FormField>
                </div>
              </div>

              {/* Standard Days & Actual Days */}
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <FormField id="genStandardDays" label="Standard Working Days">
                    <input type="number" className="form-input" value={genStandardDays} onChange={e => setGenStandardDays(Number(e.target.value))} required min="1" />
                  </FormField>
                </div>
                <div style={{ flex: 1 }}>
                  <FormField id="genActualDays" label="Actual Worked Days">
                    <input type="number" className="form-input" value={genActualDays} onChange={e => setGenActualDays(Number(e.target.value))} required min="0" />
                  </FormField>
                </div>
              </div>

              {/* Financial Fields */}
              <FormField id="genBasicSalary" label="Snapshot Basic Salary (VND) — auto-loaded from employee record">
                <input type="number" className="form-input" placeholder="Auto-loaded when employee selected" value={genBasicSalary} disabled required min="0" style={{ opacity: 0.7, cursor: 'not-allowed' }} />
              </FormField>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <FormField id="genAllowance" label="Allowance (VND)">
                    <input type="number" className="form-input" placeholder="0" value={genAllowance} onChange={e => setGenAllowance(e.target.value)} min="0" />
                  </FormField>
                </div>
                <div style={{ flex: 1 }}>
                  <FormField id="genBonus" label="Bonus (VND)">
                    <input type="number" className="form-input" placeholder="0" value={genBonus} onChange={e => setGenBonus(e.target.value)} min="0" />
                  </FormField>
                </div>
              </div>

              <FormField id="genDeduction" label="Deduction (VND)">
                <input type="number" className="form-input" placeholder="0" value={genDeduction} onChange={e => setGenDeduction(e.target.value)} min="0" />
              </FormField>

              {/* Calculated Net Salary preview */}
              <div style={{ padding: '14px 16px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-primary)' }}>Net Salary (Calculated)</span>
                <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-primary)' }}>
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                    Number(genBasicSalary || 0) + Number(genAllowance || 0) + Number(genBonus || 0) - Number(genDeduction || 0)
                  )}
                </span>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn" onClick={() => setShowGenerateModal(false)} style={{ padding: '10px 24px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)', borderRadius: '8px' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={generating} style={{ padding: '10px 24px', borderRadius: '8px' }}>
                  {generating ? 'Processing...' : 'Generate Payroll'}
                </button>
              </div>
            </form>
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
