import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { Pill, Clock, PackageX, IndianRupee, Activity, Zap } from '../components/Icons';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area,
} from 'recharts';
import { useAuth } from '../context/AuthContext'; // ✅ ADD

const C = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f97316','#84cc16'];

const money = n => {
  if (n >= 10000000) return `₹${(n/10000000).toFixed(2)}Cr`;
  if (n >= 100000)   return `₹${(n/100000).toFixed(2)}L`;
  if (n >= 1000)     return `₹${(n/1000).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
};
const fmt = n => new Intl.NumberFormat('en-IN').format(n);

const EXP_C = { expired:'#ef4444', critical:'#ef4444', warning:'#f59e0b', caution:'#eab308', good:'#10b981' };
const SCHED_CFG = {
  'OTC':         { c:'#10b981', bg:'rgba(16,185,129,0.1)'  },
  'Schedule H':  { c:'#f59e0b', bg:'rgba(245,158,11,0.1)'  },
  'Schedule H1': { c:'#ef4444', bg:'rgba(239,68,68,0.1)'   },
  'Schedule X':  { c:'#8b5cf6', bg:'rgba(139,92,246,0.1)'  },
};

const TT = (p) => (
  <Tooltip {...p} contentStyle={{
    background:'#111827', border:'1px solid #1e293b', borderRadius:10,
    color:'#e2e8f0', fontSize:12, boxShadow:'0 12px 40px rgba(0,0,0,0.5)',
  }} cursor={{ fill:'rgba(255,255,255,0.02)' }} />
);

function AnimNum({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const target = parseFloat(value) || 0;
    const step   = target / 25;
    let cur = 0;
    const t = setInterval(() => {
      cur = Math.min(cur + step, target);
      setDisplay(cur);
      if (cur >= target) clearInterval(t);
    }, 40);
    return () => clearInterval(t);
  }, [value]);
  return <span>{Math.round(display)}</span>;
}

function SmartMessage({ stats, medicines, getDaysToExpiry, userName }) {
  const msgs = [];

  if (stats.outOfStock > 0)
    msgs.push({ icon:'🚨', color:'#ef4444', bg:'rgba(239,68,68,0.08)', border:'rgba(239,68,68,0.2)', text:`${userName}, ${stats.outOfStock} medicine${stats.outOfStock > 1 ? 's are' : ' is'} out of stock right now. Patients could be affected — please reorder immediately!` });

  if (stats.expiringIn30Days > 0)
    msgs.push({ icon:'⏰', color:'#f59e0b', bg:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.2)', text:`${stats.expiringIn30Days} medicine${stats.expiringIn30Days > 1 ? 's are' : ' is'} expiring in under 30 days. Don't let them go to waste — consider discounts or returns.` });

  if (stats.expired > 0)
    msgs.push({ icon:'☠️', color:'#ef4444', bg:'rgba(239,68,68,0.08)', border:'rgba(239,68,68,0.25)', text:`Expired medicines detected on your shelves! Selling expired drugs is illegal under DPCO. Remove them immediately.` });

  if (stats.todaySalesCount >= 5)
    msgs.push({ icon:'🔥', color:'#10b981', bg:'rgba(16,185,129,0.08)', border:'rgba(16,185,129,0.2)', text:`Great work today, ${userName}! ${stats.todaySalesCount} sales already. Revenue is at ₹${stats.todayRevenue.toFixed(0)} — you're on track for a great day!` });

  if (stats.lowStock >= 3)
    msgs.push({ icon:'📦', color:'#6366f1', bg:'rgba(99,102,241,0.08)', border:'rgba(99,102,241,0.2)', text:`${stats.lowStock} medicines are running below reorder levels. Time to call your distributors before the weekend rush!` });

  const maxProfit = medicines.reduce((a, m) => {
    const p = (m.sellingPrice - m.purchasePrice) * m.stockQty;
    return p > a.profit ? { name: m.name, profit: p } : a;
  }, { name:'', profit:0 });

  if (maxProfit.profit > 0 && msgs.length < 3)
    msgs.push({ icon:'💡', color:'#8b5cf6', bg:'rgba(139,92,246,0.08)', border:'rgba(139,92,246,0.2)', text:`"${maxProfit.name}" is your most profitable product in stock. Push sales here — potential: ${money(maxProfit.profit)} gross margin!` });

  if (msgs.length === 0)
    msgs.push({ icon:'✅', color:'#10b981', bg:'rgba(16,185,129,0.06)', border:'rgba(16,185,129,0.15)', text:`Everything looks great, ${userName}! Inventory is healthy, no critical alerts. Keep up the good work — your pharmacy is running smoothly today! 🎉` });

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {msgs.slice(0, 3).map((m, i) => (
        <div key={i} style={{
          display:'flex', gap:12, alignItems:'flex-start',
          padding:'12px 16px', background:m.bg,
          border:`1px solid ${m.border}`, borderRadius:12,
          animation:'slideInLeft 0.4s ease both',
          animationDelay:`${i * 0.1}s`,
          transition:'all 0.25s',
          cursor:'default',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = `0 4px 20px ${m.border}`; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
          <span style={{ fontSize:20, flexShrink:0, lineHeight:1.3 }}>{m.icon}</span>
          <p style={{ margin:0, fontSize:12.5, color:'#94a3b8', lineHeight:1.7 }}>{m.text}</p>
        </div>
      ))}
    </div>
  );
}

function ActivityTimeline({ activities, clearActivities }) {
  const bottomRef = useRef(null);

  const timeAgo = (ts) => {
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (diff < 60)   return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400)return `${Math.floor(diff/3600)}h ago`;
    return new Date(ts).toLocaleDateString('en-IN', { day:'2-digit', month:'short' });
  };

  const TYPE_STYLES = {
    add:     { dot:'#10b981', glow:'rgba(16,185,129,0.4)'  },
    edit:    { dot:'#f59e0b', glow:'rgba(245,158,11,0.4)'  },
    delete:  { dot:'#ef4444', glow:'rgba(239,68,68,0.4)'   },
    sell:    { dot:'#6366f1', glow:'rgba(99,102,241,0.4)'  },
    restock: { dot:'#3b82f6', glow:'rgba(59,130,246,0.4)'  },
    alert:   { dot:'#ef4444', glow:'rgba(239,68,68,0.4)'   },
    system:  { dot:'#8b5cf6', glow:'rgba(139,92,246,0.4)'  },
  };

  return (
    <div style={{ background:'#0a1122', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, overflow:'hidden' }}>
      <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <h3 style={{ margin:0, fontSize:14, fontWeight:700, color:'#f0f4ff', display:'flex', alignItems:'center', gap:8 }}>
            <Activity size={16} color="#6366f1" /> Activity Timeline
          </h3>
          <p style={{ margin:'3px 0 0', fontSize:11, color:'#64748b' }}>Real-time inventory events</p>
        </div>
        {activities.length > 0 && (
          <button onClick={clearActivities} style={{ fontSize:11, color:'#475569', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:7, padding:'4px 10px', cursor:'pointer', transition:'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
            Clear All
          </button>
        )}
      </div>

      <div style={{ maxHeight:320, overflowY:'auto', padding:'12px 0' }}>
        {activities.length === 0 ? (
          <div style={{ textAlign:'center', padding:'32px 20px', color:'#334155', fontSize:13 }}>
            No activity yet — start managing medicines!
          </div>
        ) : (
          activities.slice(0, 20).map((a, i) => {
            const ts = TYPE_STYLES[a.type] || TYPE_STYLES.system;
            return (
              <div key={a.id} style={{
                display:'flex', gap:14, padding:'9px 20px',
                animation:'fadeIn 0.3s ease both',
                animationDelay:`${Math.min(i * 0.03, 0.3)}s`,
                transition:'background 0.15s', position:'relative',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {i < activities.length - 1 && (
                  <div style={{ position:'absolute', left:28, top:28, bottom:0, width:1, background:'rgba(255,255,255,0.04)' }} />
                )}
                <div style={{
                  width:16, height:16, borderRadius:'50%', flexShrink:0, marginTop:2,
                  background:ts.dot, boxShadow:`0 0 8px ${ts.glow}`, border:`2px solid ${ts.dot}44`,
                }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                    <div style={{ fontSize:12.5, color:'#94a3b8', lineHeight:1.5, display:'flex', gap:6, alignItems:'flex-start' }}>
                      <span style={{ fontSize:14 }}>{a.icon}</span>
                      <span>{a.message}</span>
                    </div>
                    <span style={{ fontSize:10, color:'#334155', whiteSpace:'nowrap', flexShrink:0, marginTop:2 }}>
                      {timeAgo(a.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { medicines, stats, activities, clearActivities, getDaysToExpiry, getExpiryStatus } = useStore();
  const { isAdmin, user } = useAuth(); // ✅ ADD

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const greetEmoji = hour < 12 ? '🌅' : hour < 17 ? '☀️' : '🌙';
  const userName = user?.name || 'Ganguliii'; // ✅ Dynamic name

  const catData = Object.entries(
    medicines.reduce((a, m) => ({ ...a, [m.category]: (a[m.category]||0)+1 }), {})
  ).map(([name,value]) => ({ name, value })).sort((a,b) => b.value-a.value);

  const schedData = Object.entries(
    medicines.reduce((a, m) => ({ ...a, [m.schedule]: (a[m.schedule]||0)+1 }), {})
  );

  const expiryAlerts = [...medicines]
    .filter(m => getDaysToExpiry(m.expiryDate) <= 90)
    .sort((a,b) => getDaysToExpiry(a.expiryDate) - getDaysToExpiry(b.expiryDate));

  const topByValue = [...medicines]
    .sort((a,b) => (b.mrp*b.stockQty) - (a.mrp*a.stockQty))
    .slice(0,5);

  const therapyData = Object.entries(
    medicines.reduce((a,m) => {
      const k = m.therapeuticClass.split('/')[0];
      return { ...a, [k]: (a[k]||0)+m.purchasePrice*m.stockQty };
    }, {})
  ).map(([name,value]) => ({ name, value:Math.round(value) }))
    .sort((a,b)=>b.value-a.value).slice(0,7);

  const trendData = Array.from({length:7}, (_,i) => ({
    day:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],
    sales: 9000 + Math.random()*7000,
    items: 8 + Math.floor(Math.random()*14),
  }));

  // ✅ Stat cards — Customer ko Revenue/Profit card nahi dikhega
  const adminStatCards = [
    { label:'Total Medicines',  value:stats.totalMedicines,          sub:`${catData.length} categories`,      icon:Pill,       color:'#6366f1', bg:'rgba(99,102,241,0.08)',  trend:'+5.2%',   urgent:false, isStr:false },
    { label:'Expiry Alerts',    value:stats.expiringIn90Days,        sub:`${stats.expiringIn30Days} critical`, icon:Clock,      color:stats.expiringIn30Days>0?'#ef4444':'#f59e0b', bg:stats.expiringIn30Days>0?'rgba(239,68,68,0.08)':'rgba(245,158,11,0.08)', trend:stats.expiringIn30Days>0?'⚠ URGENT':'Normal', urgent:stats.expiringIn30Days>0, isStr:false },
    { label:'Out of Stock',     value:stats.outOfStock,              sub:`${stats.lowStock} items low`,        icon:PackageX,   color:stats.outOfStock>0?'#ef4444':'#10b981',    bg:stats.outOfStock>0?'rgba(239,68,68,0.08)':'rgba(16,185,129,0.06)', trend:stats.outOfStock>0?'CRITICAL':'✓ Clear', urgent:stats.outOfStock>0, isStr:false },
    { label:'Inventory Value',  value:money(stats.totalInventoryValue), sub:`${money(stats.grossProfitPotential)} profit`, icon:IndianRupee, color:'#10b981', bg:'rgba(16,185,129,0.08)', trend:'+3.8%', urgent:false, isStr:true },
  ];

  const customerStatCards = [
    { label:'Total Medicines',  value:stats.totalMedicines,          sub:`${catData.length} categories`,      icon:Pill,       color:'#6366f1', bg:'rgba(99,102,241,0.08)',  trend:'+5.2%',   urgent:false, isStr:false },
    { label:'Expiry Alerts',    value:stats.expiringIn90Days,        sub:`${stats.expiringIn30Days} critical`, icon:Clock,      color:stats.expiringIn30Days>0?'#ef4444':'#f59e0b', bg:stats.expiringIn30Days>0?'rgba(239,68,68,0.08)':'rgba(245,158,11,0.08)', trend:stats.expiringIn30Days>0?'⚠ URGENT':'Normal', urgent:stats.expiringIn30Days>0, isStr:false },
    { label:'Out of Stock',     value:stats.outOfStock,              sub:`${stats.lowStock} items low`,        icon:PackageX,   color:stats.outOfStock>0?'#ef4444':'#10b981',    bg:stats.outOfStock>0?'rgba(239,68,68,0.08)':'rgba(16,185,129,0.06)', trend:stats.outOfStock>0?'CRITICAL':'✓ Clear', urgent:stats.outOfStock>0, isStr:false },
  ];

  const statCards = isAdmin ? adminStatCards : customerStatCards; // ✅ Role-based cards

  return (
    <div style={{ color:'#e2e8f0', paddingBottom:40 }}>

      {/* ── Greeting Banner ── */}
      <div style={{
        background:'linear-gradient(135deg, rgba(16,185,129,0.07), rgba(59,130,246,0.04), rgba(139,92,246,0.03))',
        border:'1px solid rgba(16,185,129,0.12)',
        borderRadius:20, padding:'22px 28px', marginBottom:24,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        position:'relative', overflow:'hidden', animation:'fadeUp 0.4s ease',
      }}>
        <div style={{ position:'absolute', right:-60, top:-60, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(16,185,129,0.05), transparent)', pointerEvents:'none' }} />
        <div>
          <p style={{ fontSize:12, color:'#4ade80', marginBottom:5, fontWeight:600, letterSpacing:0.5 }}>
            {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </p>
          <h1 style={{ fontSize:28, fontWeight:900, color:'#f0f4ff', margin:'0 0 6px', letterSpacing:'-0.6px' }}>
            {greeting}, {userName} {greetEmoji}
            {/* ✅ Role badge next to name */}
            <span style={{
              marginLeft:12, fontSize:12, fontWeight:700,
              padding:'3px 10px', borderRadius:20,
              background: isAdmin ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
              color: isAdmin ? '#ef4444' : '#10b981',
              border: `1px solid ${isAdmin ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
              verticalAlign:'middle',
            }}>
              {isAdmin ? '🔴 Admin' : '🟢 Customer'}
            </span>
          </h1>
          <p style={{ fontSize:13, color:'#64748b', margin:0 }}>
            RxFlow Pro — Your smart pharmacy intelligence dashboard is live.
          </p>
        </div>

        {/* ✅ Right side cards — Admin full, Customer sirf Sales */}
        <div style={{ display:'flex', gap:14 }}>
          {/* Today's Sales — Sabko dikhega */}
          <div style={{
            textAlign:'center', padding:'14px 20px',
            background:'rgba(255,255,255,0.04)', borderRadius:14,
            border:'1px solid rgba(255,255,255,0.08)', cursor:'default', transition:'all 0.25s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
            <div style={{ fontSize:18, marginBottom:4 }}>🛒</div>
            <div style={{ fontSize:20, fontWeight:900, color:'#6366f1' }}>{stats.todaySalesCount}</div>
            <div style={{ fontSize:10, color:'#64748b', marginTop:3 }}>Today's Sales</div>
          </div>

          {/* ✅ Revenue aur Profit — SIRF ADMIN ko dikhega */}
          {isAdmin && (
            <>
              <div style={{
                textAlign:'center', padding:'14px 20px',
                background:'rgba(255,255,255,0.04)', borderRadius:14,
                border:'1px solid rgba(255,255,255,0.08)', cursor:'default', transition:'all 0.25s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ fontSize:18, marginBottom:4 }}>💰</div>
                <div style={{ fontSize:20, fontWeight:900, color:'#10b981' }}>{money(stats.todayRevenue)}</div>
                <div style={{ fontSize:10, color:'#64748b', marginTop:3 }}>Today's Revenue</div>
              </div>

              <div style={{
                textAlign:'center', padding:'14px 20px',
                background:'rgba(255,255,255,0.04)', borderRadius:14,
                border:'1px solid rgba(255,255,255,0.08)', cursor:'default', transition:'all 0.25s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ fontSize:18, marginBottom:4 }}>📈</div>
                <div style={{ fontSize:20, fontWeight:900, color:'#f59e0b' }}>{money(stats.grossProfitPotential)}</div>
                <div style={{ fontSize:10, color:'#64748b', marginTop:3 }}>Profit Potential</div>
              </div>
            </>
          )}

          {/* ✅ Customer ko ek simple Stock Overview card dikhega */}
          {!isAdmin && (
            <div style={{
              textAlign:'center', padding:'14px 20px',
              background:'rgba(255,255,255,0.04)', borderRadius:14,
              border:'1px solid rgba(255,255,255,0.08)', cursor:'default', transition:'all 0.25s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <div style={{ fontSize:18, marginBottom:4 }}>📦</div>
              <div style={{ fontSize:20, fontWeight:900, color:'#f59e0b' }}>{stats.totalMedicines}</div>
              <div style={{ fontSize:10, color:'#64748b', marginTop:3 }}>Total Medicines</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Smart Human Messages ── */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:11, color:'#334155', fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
          <Zap size={13} color="#f59e0b" /> RxFlow Intelligence — Personalized Insights
        </div>
        <SmartMessage stats={stats} medicines={medicines} getDaysToExpiry={getDaysToExpiry} userName={userName} />
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${statCards.length},1fr)`, gap:16, marginBottom:22 }}>
        {statCards.map((c, i) => (
          <div key={c.label} className="stat-card" style={{
            animationDelay:`${i*0.07}s`,
            border: c.urgent ? `1px solid ${c.color}44` : '1px solid rgba(255,255,255,0.06)',
            cursor:'default',
          }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, borderRadius:'16px 16px 0 0', background:`linear-gradient(90deg, transparent, ${c.color}99, transparent)` }} />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
              <div style={{ width:44, height:44, background:c.bg, borderRadius:13, display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid ${c.color}25` }}>
                <c.icon size={21} color={c.color} />
              </div>
              <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:c.urgent ? `${c.color}22` : 'rgba(255,255,255,0.05)', color:c.urgent ? c.color : '#64748b', border:`1px solid ${c.urgent ? c.color+'33' : 'transparent'}` }}>
                {c.trend}
              </span>
            </div>
            <div style={{ fontSize:33, fontWeight:900, color:'#f0f4ff', letterSpacing:'-0.5px', marginBottom:3, lineHeight:1 }}>
              {c.isStr ? c.value : <AnimNum value={c.value} />}
            </div>
            <div style={{ fontSize:13, fontWeight:700, color:'#94a3b8', marginBottom:2 }}>{c.label}</div>
            <div style={{ fontSize:11, color:'#64748b' }}>{c.sub}</div>
            <div style={{ position:'absolute', bottom:0, right:0, display:'flex', alignItems:'flex-end', gap:2, padding:'0 12px 8px', opacity:0.1, pointerEvents:'none' }}>
              {[40,60,35,75,50,85,65].map((h,j) => (
                <div key={j} style={{ width:5, height:h*0.38, background:c.color, borderRadius:2 }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Row: Trend + Expiry Watchlist ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        {/* Weekly Sales Trend — Admin ko full chart, Customer ko simplified */}
        <div style={{ background:'#0a1122', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, padding:22, transition:'border-color 0.3s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(16,185,129,0.2)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <h3 style={{ margin:0, fontSize:14, fontWeight:700, color:'#f0f4ff' }}>📊 Weekly Sales Trend</h3>
              <p style={{ margin:'3px 0 0', fontSize:11, color:'#64748b' }}>Last 7 days estimated revenue</p>
            </div>
            {isAdmin && <div style={{ padding:'4px 10px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:8, fontSize:11, color:'#10b981', fontWeight:700 }}>+12.4% WoW</div>}
          </div>
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="day" tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false}/>
              {/* ✅ Customer ko Y-axis value nahi dikhega (revenue hide) */}
              {isAdmin && <YAxis tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`}/>}
              {isAdmin && <TT formatter={v => [`₹${fmt(Math.round(v))}`,'Sales']}/>}
              <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2.5} fill="url(#sg)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Expiry Watchlist — sabko dikhega */}
        <div style={{ background:'#0a1122', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, padding:22, transition:'border-color 0.3s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(245,158,11,0.2)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
            <div>
              <h3 style={{ margin:0, fontSize:14, fontWeight:700, color:'#f0f4ff' }}>⏰ Expiry Watchlist</h3>
              <p style={{ margin:'3px 0 0', fontSize:11, color:'#64748b' }}>Expiring within 90 days</p>
            </div>
            <span style={{ fontSize:13, fontWeight:800, color:'#ef4444' }}>{expiryAlerts.length}</span>
          </div>
          {expiryAlerts.length === 0 ? (
            <div style={{ textAlign:'center', padding:32, color:'#10b981', fontSize:13 }}>✅ All medicines within safe range!</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {expiryAlerts.slice(0,5).map(m => {
                const days = getDaysToExpiry(m.expiryDate);
                const col  = EXP_C[getExpiryStatus(m.expiryDate)];
                return (
                  <div key={m.id} style={{
                    display:'flex', alignItems:'center', gap:10, padding:'9px 12px',
                    background:'rgba(255,255,255,0.02)', borderRadius:11, border:`1px solid ${col}22`,
                    transition:'all 0.2s', cursor:'default',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${col}08`; e.currentTarget.style.borderColor = `${col}44`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = `${col}22`; }}>
                    <div style={{ width:38,height:38, borderRadius:10, background:`${col}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Clock size={16} color={col}/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.name}</div>
                      <div style={{ fontSize:10, color:'#64748b' }}>{m.batchNumber} · {m.stockQty} units</div>
                    </div>
                    <div style={{ fontSize:12, fontWeight:900, color:col, background:`${col}18`, padding:'3px 10px', borderRadius:8, flexShrink:0, minWidth:50, textAlign:'center' }}>
                      {days < 0 ? 'EXP' : `${days}d`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Activity Timeline + Top Value + Schedule — Admin only ── */}
      {isAdmin && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
          <ActivityTimeline activities={activities} clearActivities={clearActivities} />

          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Top Value */}
            <div style={{ background:'#0a1122', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, padding:20, flex:1, transition:'border-color 0.3s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(245,158,11,0.2)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}>
              <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:700, color:'#f0f4ff' }}>💎 High-Value Stock</h3>
              {topByValue.map((m,i) => {
                const val    = m.mrp * m.stockQty;
                const maxVal = topByValue[0]?.mrp * topByValue[0]?.stockQty || 1;
                return (
                  <div key={m.id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, transition:'all 0.2s', cursor:'default', padding:'4px 6px', borderRadius:8 }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ width:26,height:26, borderRadius:8, flexShrink:0, background:i===0?'rgba(245,158,11,0.2)':'rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:900, color:i===0?'#f59e0b':'#64748b' }}>{i+1}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <div>
                          <div style={{ fontSize:12, fontWeight:700, color:'#e2e8f0' }}>{m.name}</div>
                          <div style={{ fontSize:10, color:'#64748b' }}>{m.stockQty} u · {m.manufacturer}</div>
                        </div>
                        <span style={{ fontSize:12, fontWeight:900, color:'#f0f4ff' }}>{money(val)}</span>
                      </div>
                      <div style={{ height:3, background:'rgba(255,255,255,0.05)', borderRadius:2 }}>
                        <div style={{ height:'100%', borderRadius:2, background:C[i], width:`${(val/maxVal)*100}%`, transition:'width 1s ease' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Schedules */}
            <div style={{ background:'#0a1122', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, padding:18 }}>
              <h3 style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:'#f0f4ff' }}>🛡️ Schedule Breakdown</h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
                {schedData.map(([sched,count]) => {
                  const sc = SCHED_CFG[sched] || { c:'#64748b', bg:'rgba(100,116,139,0.1)' };
                  return (
                    <div key={sched} style={{ padding:'11px 10px', background:sc.bg, border:`1px solid ${sc.c}30`, borderRadius:11, textAlign:'center', cursor:'default', transition:'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = `0 6px 20px ${sc.c}25`; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}>
                      <div style={{ fontSize:24, fontWeight:900, color:sc.c, lineHeight:1 }}>{count}</div>
                      <div style={{ fontSize:9.5, color:'#94a3b8', marginTop:4 }}>{sched}</div>
                      {sched==='Schedule X' && <div style={{ fontSize:9, color:'#ef4444', fontWeight:700, marginTop:3 }}>NDPS ⚠</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Customer ke liye simple Activity + Medicines list */}
      {!isAdmin && (
        <div style={{ background:'#0a1122', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, padding:22, marginBottom:20 }}>
          <h3 style={{ margin:'0 0 16px', fontSize:14, fontWeight:700, color:'#f0f4ff' }}>📋 Available Medicines Overview</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {medicines.slice(0,6).map(m => {
              const stkColor = m.stockQty === 0 ? '#ef4444' : m.stockQty <= m.reorderLevel ? '#f59e0b' : '#10b981';
              const stkLabel = m.stockQty === 0 ? 'Out of Stock' : m.stockQty <= m.reorderLevel ? 'Low Stock' : 'In Stock';
              return (
                <div key={m.id} style={{ padding:'12px 14px', background:'rgba(255,255,255,0.03)', borderRadius:12, border:`1px solid ${stkColor}22`, transition:'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = `${stkColor}44`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = `${stkColor}22`; }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#e2e8f0', marginBottom:2 }}>{m.name}</div>
                  <div style={{ fontSize:11, color:'#64748b', marginBottom:8 }}>{m.category}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:12, fontWeight:700, color:'#f0f4ff' }}>₹{m.mrp}</span>
                    <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:6, background:`${stkColor}18`, color:stkColor }}>
                      {stkLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {medicines.length > 6 && (
            <div style={{ textAlign:'center', marginTop:12, fontSize:12, color:'#64748b' }}>
              + {medicines.length - 6} more medicines — go to Medicines page to see all
            </div>
          )}
        </div>
      )}

      {/* ── Therapy Bar Chart — Admin only ── */}
      {isAdmin && (
        <div style={{ background:'#0a1122', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, padding:22, transition:'border-color 0.3s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <h3 style={{ margin:0, fontSize:14, fontWeight:700, color:'#f0f4ff' }}>📈 Inventory by Therapeutic Class</h3>
              <p style={{ margin:'4px 0 0', fontSize:11, color:'#64748b' }}>Purchase value distribution — click bars to explore</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={therapyData} margin={{ left:10 }}>
              <defs>
                {therapyData.map((_,i) => (
                  <linearGradient key={i} id={`tg${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={C[i%C.length]} stopOpacity={0.9}/>
                    <stop offset="100%" stopColor={C[i%C.length]} stopOpacity={0.4}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="name" tick={{fill:'#64748b',fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}K`}/>
              <TT formatter={v=>[`₹${fmt(v)}`,'Inventory Value']}/>
              <Bar dataKey="value" radius={[6,6,0,0]} cursor="pointer">
                {therapyData.map((_,i) => <Cell key={i} fill={`url(#tg${i})`}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}