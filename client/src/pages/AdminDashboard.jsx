// FILE: client/src/pages/AdminPanel.jsx
// (App.jsx imports this as: import AdminDashboard from './pages/AdminDashboard')
// Copy this file as BOTH AdminPanel.jsx and AdminDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';

export default function AdminDashboard() {
  const { user, isAdmin, logout } = useAuth();
  const { medicines, activities: localActivities, stats: localStats, salesLog } = useStore();
  const navigate = useNavigate();

  const [loading, setLoading]     = useState(true);
  const [serverStats, setServerStats] = useState(null);
  const [users, setUsers]         = useState([]);
  const [serverActivities, setServerActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [serverOnline, setServerOnline] = useState(true);

  useEffect(() => {
    if (!isAdmin) { navigate('/dashboard'); return; }
    fetchData();
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, actRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users?limit=50'),
        api.get('/admin/activities?limit=40'),
      ]);
      if (statsRes.data.success)  setServerStats(statsRes.data.data);
      if (usersRes.data.success)  setUsers(usersRes.data.data);
      if (actRes.data.success)    setServerActivities(actRes.data.data);
      setServerOnline(true);
    } catch (err) {
      console.error('Admin fetch error:', err);
      setServerOnline(false);
    }
    setLoading(false);
  };

  const toggleUserStatus = async (userId) => {
    try {
      const res = await api.put(`/admin/users/${userId}/toggle`);
      if (res.data.success) fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const toggleAdminRole = async (userId, currentIsAdmin) => {
    try {
      const res = await api.put(`/admin/users/${userId}/role`, { isAdmin: !currentIsAdmin });
      if (res.data.success) fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const deleteUser = async (userId, userName) => {
    if (!window.confirm(`Delete user "${userName}" and all their data? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  if (!isAdmin) return null;

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Use server stats when available, fallback to local stats
  const displayStats = serverStats ? {
    totalUsers:      serverStats.users.total,
    activeUsers:     serverStats.users.active,
    totalMedicines:  serverStats.inventory.totalMedicines,
    totalSales:      serverStats.sales.total,
    todayRevenue:    serverStats.sales.todayRevenue,
    todayCount:      serverStats.sales.todayCount,
    monthRevenue:    serverStats.sales.monthRevenue,
    monthCount:      serverStats.sales.monthCount,
  } : {
    totalUsers:      1,
    activeUsers:     1,
    totalMedicines:  localStats.totalMedicines,
    totalSales:      localStats.totalSalesCount,
    todayRevenue:    localStats.todayRevenue,
    todayCount:      localStats.todaySalesCount,
    monthRevenue:    salesLog.filter(s => new Date(s.timestamp) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)).reduce((a, b) => a + b.revenue, 0),
    monthCount:      salesLog.filter(s => new Date(s.timestamp) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)).length,
  };

  const displayActivities = serverActivities.length > 0 ? serverActivities : localActivities;

  const TABS = [
    { id:'overview',   icon:'📊', label:'Overview'   },
    { id:'inventory',  icon:'💊', label:'Inventory'  },
    { id:'users',      icon:'👥', label:'Users'      },
    { id:'activities', icon:'📝', label:'Activities' },
  ];

  const btnStyle = (active) => ({
    padding:'12px 22px',
    background: active ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.05)',
    border: active ? 'none' : '1px solid rgba(255,255,255,0.1)',
    borderRadius:'12px', color: active ? '#fff' : '#94a3b8',
    fontSize:'14px', fontWeight:'700', cursor:'pointer', transition:'all 0.2s',
    display:'flex', alignItems:'center', gap:'8px',
    boxShadow: active ? '0 4px 20px rgba(99,102,241,0.4)' : 'none',
  });

  const card = (children, extra = {}) => ({
    background:'rgba(255,255,255,0.05)', backdropFilter:'blur(20px)',
    border:'1px solid rgba(255,255,255,0.1)', borderRadius:'20px',
    padding:'28px', transition:'all 0.3s', ...extra,
  });

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)', padding:0 }}>

      {/* ── Header ── */}
      <div style={{
        background:'rgba(15,23,42,0.95)', backdropFilter:'blur(20px)',
        borderBottom:'1px solid rgba(255,255,255,0.1)',
        padding:'18px 40px', display:'flex', justifyContent:'space-between', alignItems:'center',
        position:'sticky', top:0, zIndex:100, boxShadow:'0 4px 20px rgba(0,0,0,0.3)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          <div style={{ width:'46px', height:'46px', background:'linear-gradient(135deg,#8b5cf6,#6366f1)', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', boxShadow:'0 4px 20px rgba(139,92,246,0.4)' }}>🛡️</div>
          <div>
            <h1 style={{ fontSize:'22px', fontWeight:'800', color:'#e2e8f0', margin:0 }}>Admin Panel</h1>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:2 }}>
              <p style={{ fontSize:'12px', color:'#64748b', margin:0 }}>System Control Center</p>
              <div style={{ width:6, height:6, borderRadius:'50%', background: serverOnline ? '#10b981' : '#ef4444' }} />
              <span style={{ fontSize:'11px', color: serverOnline ? '#10b981' : '#ef4444', fontWeight:600 }}>
                {serverOnline ? 'Server Online' : 'Offline Mode'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          {/* Logged in as */}
          <div style={{ padding:'8px 16px', background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.25)', borderRadius:'10px' }}>
            <div style={{ color:'#8b5cf6', fontSize:'10px', fontWeight:'700', textTransform:'uppercase', letterSpacing:0.5 }}>Logged in as</div>
            <div style={{ color:'#e2e8f0', fontSize:'13px', fontWeight:'700', marginTop:2 }}>{user?.name}</div>
          </div>

          <button onClick={() => navigate('/dashboard')} style={{ padding:'9px 18px', background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.25)', borderRadius:'10px', color:'#6366f1', fontSize:'13px', fontWeight:'700', cursor:'pointer', transition:'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(99,102,241,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(99,102,241,0.1)'}>
            ← Back to App
          </button>

          <button onClick={fetchData} style={{ padding:'9px 18px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:'10px', color:'#10b981', fontSize:'13px', fontWeight:'700', cursor:'pointer', transition:'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(16,185,129,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(16,185,129,0.1)'}>
            🔄 Refresh
          </button>

          <button onClick={async () => { await logout(); navigate('/login'); }} style={{ padding:'9px 18px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'10px', color:'#ef4444', fontSize:'13px', fontWeight:'700', cursor:'pointer', transition:'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(239,68,68,0.1)'}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ padding:'36px 40px' }}>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'10px', marginBottom:'32px', flexWrap:'wrap' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={btnStyle(activeTab===t.id)}
              onMouseEnter={e => { if (activeTab!==t.id) e.currentTarget.style.background='rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { if (activeTab!==t.id) e.currentTarget.style.background='rgba(255,255,255,0.05)'; }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign:'center', padding:'60px', color:'#64748b' }}>
            <div style={{ fontSize:'36px', marginBottom:'12px', animation:'spin 1s linear infinite', display:'inline-block' }}>⚙️</div>
            <p style={{ fontSize:'15px' }}>Loading admin data...</p>
          </div>
        )}

        {/* ── OVERVIEW TAB ── */}
        {!loading && activeTab === 'overview' && (
          <div>
            {/* Stats grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))', gap:'20px', marginBottom:'32px' }}>
              {[
                { icon:'👥', label:'Total Users',      value: displayStats.totalUsers,     sub:`${displayStats.activeUsers} active`, color:'#6366f1' },
                { icon:'💊', label:'Total Medicines',  value: displayStats.totalMedicines, sub:`${localStats.outOfStock} out of stock`, color:'#8b5cf6' },
                { icon:'🛒', label:'Total Sales',      value: displayStats.totalSales,     sub:`${displayStats.todayCount} today`, color:'#f59e0b' },
                { icon:'📈', label:"Today's Revenue",  value:`₹${displayStats.todayRevenue.toLocaleString()}`, sub:`${displayStats.todayCount} transactions`, color:'#10b981', highlight:true },
                { icon:'📊', label:'This Month',       value:`₹${displayStats.monthRevenue.toLocaleString()}`, sub:`${displayStats.monthCount} sales`, color:'#6366f1', highlight:true },
                { icon:'⚠️', label:'Critical Alerts',  value: localStats.outOfStock + localStats.expired, sub:`${localStats.outOfStock} OOS, ${localStats.expired} expired`, color:'#ef4444' },
              ].map((s, i) => (
                <div key={i}
                  style={{ ...card(), border: s.highlight ? `1px solid ${s.color}44` : '1px solid rgba(255,255,255,0.1)', cursor:'default' }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 12px 40px ${s.color}30`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}>
                  <div style={{ fontSize:'36px', marginBottom:'10px' }}>{s.icon}</div>
                  <div style={{ color:'#94a3b8', fontSize:'12px', fontWeight:'700', textTransform:'uppercase', letterSpacing:0.5, marginBottom:'8px' }}>{s.label}</div>
                  <div style={{ color: s.highlight ? s.color : '#e2e8f0', fontSize:'32px', fontWeight:'900', marginBottom:'8px' }}>{s.value}</div>
                  <div style={{ fontSize:'12px', color:'#64748b' }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Inventory Health Row */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'16px' }}>
              {[
                { label:'In Stock',        value: localStats.totalMedicines - localStats.outOfStock, color:'#10b981' },
                { label:'Low Stock',       value: localStats.lowStock,       color:'#f59e0b' },
                { label:'Out of Stock',    value: localStats.outOfStock,     color:'#ef4444' },
                { label:'Expiring <30d',   value: localStats.expiringIn30Days, color:'#f97316' },
                { label:'Expired',         value: localStats.expired,        color:'#dc2626' },
                { label:'Total Value',     value:`₹${(localStats.totalInventoryValue/1000).toFixed(1)}K`, color:'#6366f1' },
              ].map((s, i) => (
                <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${s.color}30`, borderRadius:'14px', padding:'18px 20px', borderLeft:`3px solid ${s.color}` }}>
                  <div style={{ color:'#64748b', fontSize:'11px', fontWeight:'700', textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>{s.label}</div>
                  <div style={{ color: s.color, fontSize:'26px', fontWeight:'900' }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── INVENTORY TAB ── */}
        {!loading && activeTab === 'inventory' && (
          <div>
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'16px', overflow:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
                <thead>
                  <tr style={{ background:'rgba(255,255,255,0.05)' }}>
                    {['Medicine','Category','Stock','Expiry','MRP','Status'].map(h => (
                      <th key={h} style={{ padding:'14px 18px', textAlign:'left', color:'#94a3b8', fontSize:'11px', fontWeight:'700', textTransform:'uppercase', letterSpacing:0.5, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {medicines.slice(0, 20).map((m, i) => {
                    const days = Math.ceil((new Date(m.expiryDate) - new Date()) / 86400000);
                    const expired = days < 0;
                    const expiring = days >= 0 && days <= 30;
                    const oos = m.stockQty === 0;
                    const low = !oos && m.stockQty <= m.reorderLevel;
                    return (
                      <tr key={m.id || i} style={{ borderTop:'1px solid rgba(255,255,255,0.04)', transition:'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <td style={{ padding:'14px 18px' }}>
                          <div style={{ color:'#e2e8f0', fontSize:'13px', fontWeight:'600' }}>{m.name}</div>
                          <div style={{ color:'#475569', fontSize:'11px', marginTop:2 }}>{m.genericName}</div>
                        </td>
                        <td style={{ padding:'14px 18px', color:'#94a3b8', fontSize:'12px' }}>{m.category}</td>
                        <td style={{ padding:'14px 18px', color: oos ? '#ef4444' : low ? '#f59e0b' : '#10b981', fontWeight:'700', fontSize:'14px' }}>{m.stockQty}</td>
                        <td style={{ padding:'14px 18px', color: expired ? '#ef4444' : expiring ? '#f97316' : '#94a3b8', fontSize:'12px' }}>
                          {expired ? 'EXPIRED' : expiring ? `${days}d left ⚠️` : new Date(m.expiryDate).toLocaleDateString('en-IN')}
                        </td>
                        <td style={{ padding:'14px 18px', color:'#e2e8f0', fontSize:'13px' }}>₹{m.mrp}</td>
                        <td style={{ padding:'14px 18px' }}>
                          <span style={{ padding:'4px 10px', borderRadius:6, fontSize:'11px', fontWeight:'700', background: oos||expired ? 'rgba(239,68,68,0.15)' : low||expiring ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)', color: oos||expired ? '#ef4444' : low||expiring ? '#f59e0b' : '#10b981', border:`1px solid ${oos||expired ? 'rgba(239,68,68,0.3)' : low||expiring ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}` }}>
                            {expired ? 'Expired' : oos ? 'Out of Stock' : low ? 'Low Stock' : expiring ? 'Expiring Soon' : 'OK'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {medicines.length > 20 && (
                <div style={{ padding:'14px 18px', textAlign:'center', color:'#475569', fontSize:'12px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                  Showing 20 of {medicines.length} medicines. Go to Medicines page for full list.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── USERS TAB ── */}
        {!loading && activeTab === 'users' && (
          <div>
            <div style={{ marginBottom:'20px', display:'flex', alignItems:'center', gap:12 }}>
              <input type="text" placeholder="🔍 Search by name or email..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ flex:1, maxWidth:440, padding:'12px 18px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', color:'#e2e8f0', fontSize:'14px', outline:'none' }}
                onFocus={e => { e.target.style.borderColor='rgba(99,102,241,0.5)'; }}
                onBlur={e  => { e.target.style.borderColor='rgba(255,255,255,0.1)'; }}
              />
              {!serverOnline && <span style={{ color:'#f59e0b', fontSize:'12px', fontWeight:'600' }}>⚠️ Server offline — user management unavailable</span>}
            </div>

            {users.length === 0 && !serverOnline ? (
              <div style={{ textAlign:'center', padding:'60px', color:'#475569' }}>
                <div style={{ fontSize:'40px', marginBottom:'12px' }}>🔌</div>
                <p style={{ fontSize:'14px' }}>Connect to server to manage users</p>
              </div>
            ) : (
              <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'16px', overflow:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
                  <thead>
                    <tr style={{ background:'rgba(255,255,255,0.05)' }}>
                      {['User','Email','Role','Status','Joined','Actions'].map(h => (
                        <th key={h} style={{ padding:'14px 20px', textAlign:'left', color:'#94a3b8', fontSize:'11px', fontWeight:'700', textTransform:'uppercase', letterSpacing:0.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u._id} style={{ borderTop:'1px solid rgba(255,255,255,0.05)', transition:'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <td style={{ padding:'16px 20px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ width:36, height:36, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'14px', fontWeight:'700', flexShrink:0 }}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ color:'#e2e8f0', fontSize:'13px', fontWeight:'600' }}>{u.name}</div>
                              <div style={{ color:'#475569', fontSize:'11px' }}>{u.role}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:'16px 20px', color:'#94a3b8', fontSize:'13px' }}>{u.email}</td>
                        <td style={{ padding:'16px 20px' }}>
                          <span style={{ padding:'4px 10px', borderRadius:6, fontSize:'11px', fontWeight:'700', background: u.isAdmin ? 'rgba(139,92,246,0.15)' : 'rgba(100,116,139,0.15)', color: u.isAdmin ? '#8b5cf6' : '#64748b', border:`1px solid ${u.isAdmin ? 'rgba(139,92,246,0.3)' : 'rgba(100,116,139,0.3)'}` }}>
                            {u.isAdmin ? '👑 Admin' : 'User'}
                          </span>
                        </td>
                        <td style={{ padding:'16px 20px' }}>
                          <span style={{ padding:'4px 10px', borderRadius:6, fontSize:'11px', fontWeight:'700', background: u.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: u.isActive ? '#10b981' : '#ef4444', border:`1px solid ${u.isActive ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                            {u.isActive ? '✓ Active' : '✗ Inactive'}
                          </span>
                        </td>
                        <td style={{ padding:'16px 20px', color:'#64748b', fontSize:'12px' }}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td style={{ padding:'16px 20px' }}>
                          <div style={{ display:'flex', gap:8 }}>
                            <button onClick={() => toggleUserStatus(u._id)} disabled={u._id===user.id}
                              style={{ padding:'6px 12px', background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:7, color:'#6366f1', fontSize:'11px', fontWeight:'700', cursor: u._id===user.id ? 'not-allowed':'pointer', opacity: u._id===user.id ? 0.5 : 1, transition:'all 0.2s' }}
                              onMouseEnter={e => { if (u._id!==user.id) e.currentTarget.style.background='rgba(99,102,241,0.2)'; }}
                              onMouseLeave={e => { if (u._id!==user.id) e.currentTarget.style.background='rgba(99,102,241,0.1)'; }}>
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button onClick={() => toggleAdminRole(u._id, u.isAdmin)} disabled={u._id===user.id}
                              style={{ padding:'6px 12px', background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.2)', borderRadius:7, color:'#8b5cf6', fontSize:'11px', fontWeight:'700', cursor: u._id===user.id ? 'not-allowed':'pointer', opacity: u._id===user.id ? 0.5 : 1, transition:'all 0.2s' }}
                              onMouseEnter={e => { if (u._id!==user.id) e.currentTarget.style.background='rgba(139,92,246,0.2)'; }}
                              onMouseLeave={e => { if (u._id!==user.id) e.currentTarget.style.background='rgba(139,92,246,0.1)'; }}>
                              {u.isAdmin ? 'Remove Admin' : 'Make Admin'}
                            </button>
                            <button onClick={() => deleteUser(u._id, u.name)} disabled={u._id===user.id}
                              style={{ padding:'6px 10px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:7, color:'#ef4444', fontSize:'13px', cursor: u._id===user.id ? 'not-allowed':'pointer', opacity: u._id===user.id ? 0.4 : 1, transition:'all 0.2s' }}
                              onMouseEnter={e => { if (u._id!==user.id) e.currentTarget.style.background='rgba(239,68,68,0.18)'; }}
                              onMouseLeave={e => { if (u._id!==user.id) e.currentTarget.style.background='rgba(239,68,68,0.08)'; }}>
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && (
                  <div style={{ textAlign:'center', padding:'40px', color:'#475569', fontSize:'13px' }}>No users found.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── ACTIVITIES TAB ── */}
        {!loading && activeTab === 'activities' && (
          <div>
            <div style={{ marginBottom:'12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ color:'#64748b', fontSize:'13px' }}>
                {serverActivities.length > 0 ? `${serverActivities.length} activities from server` : `${localActivities.length} local activities`}
              </span>
            </div>
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'16px', overflow:'hidden' }}>
              {displayActivities.slice(0, 40).map((act, i) => (
                <div key={act._id || act.id || i}
                  style={{ padding:'16px 24px', borderBottom: i < displayActivities.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', display:'flex', alignItems:'center', gap:'16px', transition:'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <div style={{ width:42, height:42, borderRadius:10, background:'rgba(99,102,241,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>
                    {act.icon || '📋'}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ color:'#e2e8f0', fontSize:'13px', fontWeight:'600', marginBottom:4 }}>{act.message}</div>
                    <div style={{ color:'#475569', fontSize:'11px' }}>
                      {act.user?.name || act.type || 'System'} &nbsp;•&nbsp;
                      {new Date(act.createdAt || act.timestamp).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                    </div>
                  </div>
                  <div style={{ width:8, height:8, borderRadius:'50%', background: act.color || '#6366f1', flexShrink:0 }} />
                </div>
              ))}
              {displayActivities.length === 0 && (
                <div style={{ textAlign:'center', padding:'60px', color:'#475569' }}>
                  <div style={{ fontSize:'36px', marginBottom:'10px' }}>📝</div>
                  <p style={{ fontSize:'13px' }}>No activity recorded yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}