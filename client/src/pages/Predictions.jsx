import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area,
} from 'recharts';

const C = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#f97316','#14b8a6'];
const vel = m => Math.max(0.5, (m.mrp/50)*(1/(m.reorderLevel||1))*8);
const TT = (p) => <Tooltip {...p} contentStyle={{ background:'#1e293b',border:'1px solid #334155',borderRadius:10,color:'#e2e8f0',fontSize:12,boxShadow:'0 8px 30px rgba(0,0,0,0.4)' }} cursor={{ fill:'rgba(255,255,255,0.02)' }}/>;

export default function Predictions() {
  const { medicines, getDaysToExpiry } = useStore();
  const [selId, setSelId] = useState(medicines[0]?.id||'');
  const sel = medicines.find(m=>m.id===selId)||medicines[0];

  const forecast = sel ? Array.from({length:15},(_,i)=>({
    day:i===0?'Today':`Day ${i}`,
    stock:Math.max(0,Math.round(sel.stockQty - vel(sel)*i)),
    reorder:sel.reorderLevel,
  })) : [];

  const reorderDay = forecast.findIndex(f=>f.stock<=sel?.reorderLevel);
  const daysLeft   = reorderDay > 0 ? reorderDay : 14;

  const catVel = Object.entries(
    medicines.reduce((a,m)=>({...a,[m.category]:(a[m.category]||0)+vel(m)}),{})
  ).map(([name,velocity])=>({name,velocity:+velocity.toFixed(1)})).sort((a,b)=>b.velocity-a.velocity).slice(0,8);

  const topVel = [...medicines].map(m=>({...m,velocity:vel(m)})).sort((a,b)=>b.velocity-a.velocity);

  return (
    <div style={{ color:'#e2e8f0', paddingBottom:32 }}>
      <div style={{ marginBottom:22 }} className="fade-up">
        <h1 style={{ margin:0,fontSize:22,fontWeight:900,color:'#f0f4ff',letterSpacing:'-0.3px' }}>📈 Demand Predictions</h1>
        <p style={{ margin:'5px 0 0',fontSize:13,color:'#64748b' }}>14-day forecasts based on inventory velocity & movement patterns</p>
      </div>

      {/* Selector + Chart */}
      <div style={{ background:'#0d1630',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,padding:22,marginBottom:18 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18 }}>
          <div>
            <h3 style={{ margin:0,fontSize:15,fontWeight:700,color:'#f0f4ff' }}>📉 Stock Depletion Forecast</h3>
            <p style={{ margin:'3px 0 0',fontSize:12,color:'#64748b' }}>14-day projected stock levels for selected medicine</p>
          </div>
          <select value={selId} onChange={e=>setSelId(e.target.value)} style={{
            background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',
            borderRadius:9,padding:'8px 14px',color:'#e2e8f0',fontSize:13,outline:'none',maxWidth:300,
          }}>
            {medicines.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>

        {sel && (
          <>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20 }}>
              {[
                { l:'Current Stock',   v:`${sel.stockQty} units`,           c:'#6366f1' },
                { l:'Daily Velocity',  v:`~${vel(sel).toFixed(1)} u/day`,   c:'#f59e0b' },
                { l:'Reorder In',      v:`${daysLeft === 14 ? '14d+' : `${daysLeft}d`}`, c: daysLeft<=3?'#ef4444':daysLeft<=7?'#f59e0b':'#10b981' },
                { l:'Reorder Level',   v:`${sel.reorderLevel} units`,        c:'#ef4444' },
              ].map(x=>(
                <div key={x.l} style={{ padding:'14px 16px',background:'rgba(255,255,255,0.03)',borderRadius:12,border:`1px solid ${x.c}25` }}>
                  <div style={{ fontSize:11,color:'#64748b',marginBottom:5 }}>{x.l}</div>
                  <div style={{ fontSize:17,fontWeight:900,color:x.c }}>{x.v}</div>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={forecast}>
                <defs>
                  <linearGradient id="stk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="day" tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false}/>
                <TT formatter={(v,n)=>[`${v} units`,n==='stock'?'Stock':'Reorder Level']}/>
                <Area type="monotone" dataKey="stock" stroke="#6366f1" strokeWidth={2.5} fill="url(#stk)" dot={false} name="stock"/>
                <Line type="monotone" dataKey="reorder" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="6 3" dot={false} name="Reorder Level"/>
              </AreaChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
        <div style={{ background:'#0d1630',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,padding:20 }}>
          <h3 style={{ margin:'0 0 4px',fontSize:15,fontWeight:700,color:'#f0f4ff' }}>🗂️ Demand by Category</h3>
          <p style={{ margin:'0 0 16px',fontSize:12,color:'#64748b' }}>Daily velocity (units/day)</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={catVel} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false}/>
              <XAxis type="number" tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="name" tick={{fill:'#94a3b8',fontSize:11}} axisLine={false} tickLine={false} width={75}/>
              <TT formatter={v=>[`${v} u/day`,'Velocity']}/>
              <Bar dataKey="velocity" radius={[0,5,5,0]}>
                {catVel.map((_,i)=><Cell key={i} fill={C[i%C.length]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background:'#0d1630',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,padding:20 }}>
          <h3 style={{ margin:'0 0 4px',fontSize:15,fontWeight:700,color:'#f0f4ff' }}>🏆 Top Moving Medicines</h3>
          <p style={{ margin:'0 0 16px',fontSize:12,color:'#64748b' }}>Ranked by daily sales velocity</p>
          <div style={{ display:'flex',flexDirection:'column',gap:11 }}>
            {topVel.slice(0,8).map((m,i)=>(
              <div key={m.id} style={{ display:'flex',alignItems:'center',gap:10 }}>
                <div style={{ width:26,height:26,borderRadius:8,flexShrink:0,background:i<3?C[i]+'20':'rgba(255,255,255,0.04)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:900,color:i<3?C[i]:'#64748b' }}>{i+1}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}>
                    <span style={{ fontSize:12,fontWeight:600,color:'#e2e8f0' }}>{m.name}</span>
                    <span style={{ fontSize:12,fontWeight:900,color:C[i%C.length] }}>~{m.velocity.toFixed(1)}/day</span>
                  </div>
                  <div className="progress">
                    <div className="progress-fill" style={{ width:`${(m.velocity/topVel[0].velocity)*100}%`,background:C[i%C.length] }}/>
                  </div>
                  <div style={{ fontSize:10,color:'#64748b',marginTop:2 }}>₹{m.mrp} MRP · {m.stockQty} units · {m.category}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}