import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../api/config';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  totalDepartments: number;
  pendingLeaves: number;
  approvedLeaves: number;
  todayPresent: number;
}

export function DashboardPage() {
  const { user, token, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    totalDepartments: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    todayPresent: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (!token) return;
      setLoading(true);

      try {
        // Fetch employee stats
        const empRes = await fetch(`${API_BASE_URL}/employees/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const empStats = empRes.ok ? await empRes.json() : { total: 0, active: 0, inactive: 0 };

        // Fetch departments stats
        const deptRes = await fetch(`${API_BASE_URL}/departments/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const deptStats = deptRes.ok ? await deptRes.json() : { total: 0 };
        const totalDepartments = deptStats.total || 0;

        // Fetch leave requests
        const leaveRes = await fetch(`${API_BASE_URL}/leave-requests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const leaveData = leaveRes.ok ? await leaveRes.json() : { data: [] };
        const leaves = Array.isArray(leaveData.data) ? leaveData.data : leaveData || [];
        const pendingLeaves = leaves.filter((l: any) => l.status === 'PENDING').length;
        const approvedLeaves = leaves.filter((l: any) => l.status === 'APPROVED').length;

        // Fetch today's attendance
        const today = new Date().toISOString().split('T')[0];
        const attRes = await fetch(`${API_BASE_URL}/attendance?date=${today}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const attData = attRes.ok ? await attRes.json() : { data: [] };
        const records = Array.isArray(attData.data) ? attData.data : attData || [];
        const todayPresent = Array.isArray(records)
          ? records.filter((r: any) => r.checkInTime != null).length
          : 0;

        setStats({
          totalEmployees: empStats.total || 0,
          activeEmployees: empStats.active || 0,
          inactiveEmployees: empStats.inactive || 0,
          totalDepartments,
          pendingLeaves,
          approvedLeaves,
          todayPresent,
        });
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [token]);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const statCards = [
    {
      label: 'Total Employees',
      value: stats.totalEmployees,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      color: '#6366f1',
      bg: 'rgba(99, 102, 241, 0.12)',
      ring: 'rgba(99, 102, 241, 0.3)',
      subtext: `${stats.activeEmployees} active · ${stats.inactiveEmployees} inactive`,
    },
    {
      label: 'Departments',
      value: stats.totalDepartments,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.12)',
      ring: 'rgba(16, 185, 129, 0.3)',
      subtext: 'Organizational units',
    },
    {
      label: 'Pending Leaves',
      value: stats.pendingLeaves,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 8 14"/>
        </svg>
      ),
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)',
      ring: 'rgba(245, 158, 11, 0.3)',
      subtext: `${stats.approvedLeaves} approved`,
    },
    {
      label: 'Present Today',
      value: stats.todayPresent,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      ),
      color: '#6366f1',
      bg: 'rgba(99, 102, 241, 0.12)',
      ring: 'rgba(99, 102, 241, 0.3)',
      subtext: 'Checked in today',
    },
  ];

  const quickActions = [
    {
      to: '/employees',
      label: 'Employees',
      desc: 'Manage employee profiles and records',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      iconColor: 'dashboard-card-icon--indigo',
    },
    {
      to: '/leave',
      label: 'Leave',
      desc: 'Submit requests and track leave balances',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
      iconColor: 'dashboard-card-icon--emerald',
    },
    {
      to: '/attendance',
      label: 'Attendance',
      desc: 'View and manage daily attendance',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
      iconColor: 'dashboard-card-icon--amber',
    },
    {
      to: '/payroll',
      label: 'Payroll',
      desc: 'Generate payroll and view payslips',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
      iconColor: 'dashboard-card-icon--rose',
    },
  ];

  // Image carousel slides
  const slides = [
    { src: '/images/dashboard/slide-1.png', alt: 'Empower Your Team' },
    { src: '/images/dashboard/slide-2.png', alt: 'Streamline Processes' },
    { src: '/images/dashboard/slide-3.png', alt: 'Data-Driven Decisions' },
  ];
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance carousel every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="page-container">
      {/* Welcome Header */}
      <header className="page-header" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div className="page-badge" style={{ marginBottom: '12px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              Command Center
            </div>
            <h1 className="page-title" style={{ fontSize: '28px', marginBottom: '6px' }}>
              Welcome back, {user?.fullName || 'User'}
            </h1>
            <p className="page-subtitle" style={{ fontSize: '13px' }}>
              {currentDate} · Here's what's happening in your organization
            </p>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 18px',
            borderRadius: '10px',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: '700',
              fontSize: '14px',
            }}>
              {user?.fullName?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text)' }}>{user?.fullName || 'User'}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{user?.role || 'Employee'}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Stat Cards (Admin/Manager only) */}
      {isAdmin && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}>
          {statCards.map((card) => (
          <div
            key={card.label}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 8px 32px ${card.ring}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: card.bg,
              border: '1px solid',
              borderColor: card.ring,
              color: card.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {card.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600', marginBottom: '4px' }}>
                {card.label}
              </div>
              {loading ? (
                <div style={{
                  height: '24px',
                  width: '48px',
                  borderRadius: '4px',
                  background: 'rgba(255,255,255,0.05)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
              ) : (
                <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--color-text)', lineHeight: 1.1 }}>
                  {card.value}
                </div>
              )}
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                {card.subtext}
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Main Grid: Image Carousel + Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '20px' }}>
        {/* Image Carousel */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--color-text)' }}>
                Insights & Inspiration
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Tips and best practices for HR management
              </p>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  style={{
                    width: currentSlide === idx ? '20px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    border: 'none',
                    background: currentSlide === idx ? '#6366f1' : 'rgba(255,255,255,0.15)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    padding: 0,
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Carousel Container */}
          <div style={{
            position: 'relative',
            borderRadius: '10px',
            overflow: 'hidden',
            aspectRatio: '600/280',
            background: 'var(--color-surface-raised)',
          }}>
            {slides.map((slide, idx) => (
              <img
                key={idx}
                src={slide.src}
                alt={slide.alt}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: idx === currentSlide ? 1 : 0,
                  transition: 'opacity 0.8s ease',
                  borderRadius: '10px',
                }}
              />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700', color: 'var(--color-text)' }}>
            Quick Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {quickActions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  background: 'var(--color-surface-raised)',
                  border: '1px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.background = 'var(--color-surface-raised)';
                }}
              >
                <div className={`dashboard-card-icon ${action.iconColor}`} style={{ width: '38px', height: '38px', borderRadius: '8px' }}>
                  {action.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>{action.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{action.desc}</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Organization Overview (Admin/Manager only) */}
      {isAdmin && (
        <div style={{ marginTop: '20px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(129, 140, 248, 0.06) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: '12px',
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
        }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '700', color: 'var(--color-text)' }}>
              Organization at a Glance
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>
              {loading ? 'Loading...' : `${stats.totalEmployees} employees across ${stats.totalDepartments} departments · ${stats.activeEmployees} currently active`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {/* Activity Progress Ring */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'rgba(0,0,0,0.2)',
            }}>
              <div style={{ position: 'relative', width: '40px', height: '40px' }}>
                <svg width="40" height="40" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                  <circle
                    cx="20" cy="20" r="16"
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${stats.totalEmployees > 0 ? (stats.activeEmployees / stats.totalEmployees) * 100.5 : 0} 100.5`}
                    transform="rotate(-90 20 20)"
                    style={{ transition: 'stroke-dasharray 0.6s ease' }}
                  />
                </svg>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '10px',
                  fontWeight: '700',
                  color: 'var(--color-text)',
                }}>
                  {loading ? '' : `${Math.round(stats.totalEmployees > 0 ? (stats.activeEmployees / stats.totalEmployees) * 100 : 0)}%`}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '600' }}>Active Rate</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text)', fontWeight: '700' }}>
                  {stats.activeEmployees}/{stats.totalEmployees}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}