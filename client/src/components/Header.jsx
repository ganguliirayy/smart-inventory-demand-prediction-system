// FILE: client/src/components/Header.jsx

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';

const PAGES = {
  '/dashboard':   { t:'Dashboard',          s:'Live pharmacy intelligence overview' },
  '/medicines':   { t:'Medicine Inventory', s:'Manage stock, batches & compliance' },
  '/predictions': { t:'Demand Predictions', s:'AI-powered 14-day stock forecasts' },
  '/alerts':      { t:'Alerts & Compliance',s:'Critical stock & expiry notifications' },
  '/settings':    { t:'Settings',           s:'Manage your RxFlow AI preferences' },
  '/admin':       { t:'Admin Panel',        s:'System management & user controls' },
};

const GREETINGS = [
  "What's the stock situation today? 🩺",
  "Let's keep every medicine accounted for 💊",
  "Stay on top of expiry dates today! ⏰",
  "Smart pharma decisions start here 🎯",
  "Your patients depend on this inventory 💪",
  "Another productive day at the pharmacy! 🏥",
];

export default function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { stats } = useStore();
  const { isAuthenticated } = useAuth();
  const [greeting]   = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
  const [refreshing, setRefreshing] = useState(false);

  const page = PAGES[pathname] || { t:'RxFlow AI', s:'' };

  const handleRefresh = () => {
    setRefreshing(true);
    // Force re-render by briefly navigating away and back
    const cur = pathname;
    navigate('/dashboard', { replace: true });
    setTimeout(() => { navigate(cur, { replace: true }); setRefreshing(false); }, 300);
  };

  return (
    <header style={{
      height:68, background:'rgba(5,9,26,0.97)',
      borderBottom:'1px solid rgba(255,255,255,0.05)',
      display:'flex', alignItems:'center', padding:'0 28px', gap:14,
      backdropFilter:'blur(16px)', position:'sticky', top:0, zIndex:100,
      boxShadow:'0 1px 30px rgba(0,0,0,0.4)',
    }}>
      {/* Breadcrumb */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
          <span style={{ fontWeight:900, fontSize:12, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>RxFlow AI</span>
          <span style={{ color:'#1e3a5a', fontSize:11 }}>›</span>
          <span style={{ color:'#4a6fa5', fontWeight:600, fontSize:11 }}>{page.t}</span>
          {stats.todaySalesCount > 0 && (
            <div style={{ padding:'1px 8px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:10, fontSize:10, color:'#10b981', fontWeight:700 }}>
              {stats.todaySalesCount} sold today
            </div>
          )}
        </div>
        <div style={{ fontSize:11, color:'#253456', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {pathname === '/dashboard' ? greeting : page.s}
        </div>
      </div>

      {/* Today Revenue */}
      {stats.todayRevenue > 0 && (
        <div style={{ padding:'6px 13px', background:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.18)', borderRadius:10, minWidth:100, textAlign:'center', transition:'all 0.2s', cursor:'default' }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(16,185,129,0.12)'; e.currentTarget.style.transform='translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background='rgba(16,185,129,0.07)'; e.currentTarget.style.transform='translateY(0)'; }}>
          <div style={{ color:'#10b981', fontWeight:900, fontSize:14 }}>
            ₹{stats.todayRevenue >= 1000 ? (stats.todayRevenue/1000).toFixed(1)+'K' : Math.round(stats.todayRevenue)}
          </div>
          <div style={{ color:'#64748b', fontSize:9, marginTop:1 }}>Today's Revenue</div>
        </div>
      )}

      {/* Refresh Button */}
      <button onClick={handleRefresh} disabled={refreshing} title="Refresh page data" style={{
        padding:'7px 14px', background:'rgba(99,102,241,0.08)',
        border:'1px solid rgba(99,102,241,0.2)', borderRadius:10,
        cursor: refreshing ? 'not-allowed' : 'pointer',
        color:'#6366f1', fontSize:12, fontWeight:600,
        display:'flex', alignItems:'center', gap:6, transition:'all 0.2s',
      }}
      onMouseEnter={e => { if (!refreshing) { e.currentTarget.style.background='rgba(99,102,241,0.15)'; e.currentTarget.style.transform='translateY(-1px)'; }}}
      onMouseLeave={e => { e.currentTarget.style.background='rgba(99,102,241,0.08)'; e.currentTarget.style.transform='translateY(0)'; }}>
        <span style={{ display:'inline-block', animation: refreshing ? 'spin 0.6s linear infinite' : 'none' }}>🔄</span>
        Refresh
      </button>

      {/* Login Button — only when logged out */}
      {!isAuthenticated && (
        <button onClick={() => navigate('/login')} style={{
          padding:'8px 18px',
          background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
          border:'none', borderRadius:10, cursor:'pointer',
          color:'#fff', fontSize:13, fontWeight:700,
          boxShadow:'0 4px 14px rgba(99,102,241,0.35)', transition:'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(99,102,241,0.5)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 14px rgba(99,102,241,0.35)'; }}>
          Login →
        </button>
      )}

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </header>
  );
}