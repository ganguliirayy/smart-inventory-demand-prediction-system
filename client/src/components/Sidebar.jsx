import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Pill, TrendingUp, Bell,
  Settings, LogOut, ShieldCheck, Shield,
} from './Icons';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';

const Overlay = ({ children, onClose }) => (
  <div onClick={onClose} style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 9999, padding: 20, animation: 'fadeIn 0.2s ease',
  }}>
    <div onClick={e => e.stopPropagation()}>{children}</div>
  </div>
);

export default function Sidebar() {
  const { stats } = useStore();
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const alertCount = stats.outOfStock + stats.expiringIn30Days + stats.expired;
  const healthScore = Math.max(0, 100 - alertCount * 8 - stats.lowStock * 4);
  const [time, setTime] = useState(new Date());
  const [pulse, setPulse] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    const t = setInterval(() => { setTime(new Date()); setPulse(p => !p); }, 1000);
    return () => clearInterval(t);
  }, []);

  const hc = healthScore > 70 ? '#10b981' : healthScore > 40 ? '#f59e0b' : '#ef4444';

  // ✅ ROLE-BASED NAVIGATION
  // Admin: Dashboard, Medicines, Predictions, Alerts, Admin Panel, Settings
  // Customer: sirf Dashboard, Medicines, Settings
  const NAV = [
    { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/medicines',   icon: Pill,            label: 'Medicines' },
    // Ye sirf Admin ko dikhega:
    ...(isAdmin ? [
      { to: '/predictions', icon: TrendingUp,  label: 'Predictions' },
      { to: '/alerts',      icon: Bell,        label: 'Alerts',      badge: true },
      { to: '/admin',       icon: Shield,      label: 'Admin Panel', adminOnly: true },
    ] : []),
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const handleLogout = async () => {
    await logout();
    setShowLogout(false);
    navigate('/login');
  };

  const getUserInitial = () => user?.name?.charAt(0).toUpperCase() || 'U';

  return (
    <>
      <aside style={{
        width: 256, minWidth: 256, height: '100vh', position: 'sticky', top: 0,
        background: 'linear-gradient(180deg,#05091a 0%,#070d1f 60%,#060c1a 100%)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '4px 0 40px rgba(0,0,0,0.4)',
      }}>

        {/* ── Logo ── */}
        <div style={{ padding: '22px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 14 }}>
            <div style={{
              width: 48, height: 48, flexShrink: 0,
              background: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#10b981 100%)',
              borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 24px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
              transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s',
              cursor: 'default', position: 'relative',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1) rotate(-5deg)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(99,102,241,0.7)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1) rotate(0deg)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(99,102,241,0.5)'; }}>
              <ShieldCheck size={24} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                <span style={{ color: '#f0f4ff' }}>RxFlow</span>
                <span style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6,#10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 900, marginLeft: 4 }}>AI</span>
              </div>
              <div style={{ fontSize: 9, color: '#4ade80', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, marginTop: 1 }}>
                Smart Pharma Pro
              </div>
            </div>
          </div>

          {/* Live Clock */}
          <div style={{
            background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)',
            borderRadius: 11, padding: '9px 13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: `0 0 ${pulse ? '10px' : '4px'} rgba(16,185,129,0.7)`, transition: 'box-shadow 0.5s' }} />
              <span style={{ fontSize: 10, color: '#10b981', fontWeight: 800, letterSpacing: 0.5 }}>LIVE</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13.5, fontWeight: 900, color: '#f0f4ff', fontVariantNumeric: 'tabular-nums', letterSpacing: 0.5 }}>
                {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div style={{ fontSize: 9, color: '#475569', marginTop: 1 }}>
                {time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav style={{ padding: '14px 10px', flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: 9.5, color: '#253456', letterSpacing: 1.3, textTransform: 'uppercase', fontWeight: 800, padding: '0 10px 10px' }}>
            Navigation
          </div>
          {NAV.map(({ to, icon: Icon, label, badge, adminOnly }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div style={{ position: 'absolute', inset: 0, borderRadius: 10, background: 'linear-gradient(90deg,rgba(99,102,241,0.15),rgba(99,102,241,0.04))', pointerEvents: 'none' }} />
                  )}
                  <Icon size={16} />
                  <span style={{ flex: 1, position: 'relative', zIndex: 1, fontSize: 13.5 }}>{label}</span>
                  {badge && alertCount > 0 && (
                    <span style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: 'white', borderRadius: 12, padding: '1px 7px', fontSize: 10, fontWeight: 800, boxShadow: '0 0 10px rgba(239,68,68,0.5)', animation: 'pulse-dot 2s infinite' }}>
                      {alertCount}
                    </span>
                  )}
                  {adminOnly && (
                    <span style={{ fontSize: 9, background: 'rgba(139,92,246,0.2)', color: '#8b5cf6', borderRadius: 5, padding: '1px 6px', fontWeight: 700 }}>
                      ADMIN
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}

          {/* ✅ Customer ke liye info box */}
          {!isAdmin && (
            <div style={{
              margin: '14px 4px 0', padding: '12px', borderRadius: 12,
              background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
            }}>
              <div style={{ fontSize: 10, color: '#10b981', fontWeight: 700, marginBottom: 4 }}>🟢 Customer View</div>
              <div style={{ fontSize: 10, color: '#475569', lineHeight: 1.5 }}>
                You have read-only access. Contact admin for full access.
              </div>
            </div>
          )}
        </nav>

        {/* ── Health Widget ── */}
        <div style={{ padding: '0 10px 10px', flexShrink: 0 }}>
          <div style={{ padding: 14, borderRadius: 14, background: 'linear-gradient(135deg,rgba(99,102,241,0.07),rgba(16,185,129,0.04))', border: '1px solid rgba(99,102,241,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Inventory Health</span>
              <span style={{ fontSize: 17, fontWeight: 900, color: hc }}>{healthScore}%</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden', marginBottom: 11 }}>
              <div style={{ height: '100%', borderRadius: 2, width: `${healthScore}%`, background: healthScore > 70 ? 'linear-gradient(90deg,#10b981,#34d399)' : healthScore > 40 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#ef4444,#f87171)', transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)', boxShadow: `0 0 8px ${hc}55` }} />
            </div>
            {[
              { k: 'Total SKUs', v: String(stats.totalMedicines) },
              { k: 'Alerts', v: String(stats.outOfStock + stats.expiringIn30Days) },
              ...(isAdmin ? [
                { k: 'Today Revenue', v: `₹${stats.todayRevenue >= 1000 ? (stats.todayRevenue / 1000).toFixed(1) + 'K' : Math.round(stats.todayRevenue)}` },
                { k: 'Inv. Value', v: `₹${(stats.totalInventoryValue / 100000).toFixed(1)}L` },
              ] : []),
            ].map(({ k, v }) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontSize: 10.5, color: '#64748b' }}>{k}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── User Profile ── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
          <div style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer', transition: 'background 0.2s' }}
            onClick={() => navigate('/settings')}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.07)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: isAdmin
                ? 'linear-gradient(135deg,#ef4444,#dc2626)'
                : 'linear-gradient(135deg,#10b981,#059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 900, color: 'white',
              boxShadow: isAdmin ? '0 3px 14px rgba(239,68,68,0.45)' : '0 3px 14px rgba(16,185,129,0.45)',
              border: isAdmin ? '2px solid rgba(239,68,68,0.35)' : '2px solid rgba(16,185,129,0.35)',
            }}>
              {getUserInitial()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'User'}
              </div>
              <div style={{ fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, color: isAdmin ? '#ef4444' : '#10b981' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: isAdmin ? '#ef4444' : '#10b981' }} />
                {user?.displayRole || (isAdmin ? 'Admin' : 'Customer')}
              </div>
            </div>
            <div
              title="Logout"
              onClick={e => { e.stopPropagation(); setShowLogout(true); }}
              style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', color: '#475569', background: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}>
              <LogOut size={15} />
            </div>
          </div>
        </div>
      </aside>

      {/* Logout Confirm Modal */}
      {showLogout && (
        <Overlay onClose={() => setShowLogout(false)}>
          <div style={{
            background: 'linear-gradient(135deg,#0a1020,#0d1630)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 22, padding: '32px 28px', width: 380, textAlign: 'center',
            boxShadow: '0 30px 100px rgba(0,0,0,0.7)', animation: 'scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: 28 }}>👋</div>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 900, color: '#f0f4ff' }}>
              Leaving, {user?.name?.split(' ')[0]}?
            </h2>
            <p style={{ margin: '0 0 26px', color: '#94a3b8', fontSize: 13, lineHeight: 1.7 }}>
              Are you sure you want to logout from RxFlow AI?<br/>
              <span style={{ fontSize: 11, color: '#475569' }}>Your session will end securely.</span>
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setShowLogout(false)} style={{ padding: '10px 24px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 11, color: '#94a3b8', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                Stay Here
              </button>
              <button onClick={handleLogout} style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', borderRadius: 11, color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 800, boxShadow: '0 4px 15px rgba(239,68,68,0.4)' }}>
                Yes, Logout
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </>
  );
}