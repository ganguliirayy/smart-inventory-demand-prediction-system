import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { AlertTriangle, PackageX, Clock, ShieldAlert, CheckCircle, X } from '../components/Icons';

const SCHED_C = {
  'Schedule X':  { c:'#8b5cf6', bg:'rgba(139,92,246,0.08)', b:'rgba(139,92,246,0.25)' },
  'Schedule H1': { c:'#ef4444', bg:'rgba(239,68,68,0.08)',  b:'rgba(239,68,68,0.25)'  },
  'Schedule H':  { c:'#f59e0b', bg:'rgba(245,158,11,0.08)', b:'rgba(245,158,11,0.25)' },
  'OTC':         { c:'#10b981', bg:'rgba(16,185,129,0.08)', b:'rgba(16,185,129,0.25)' },
};

const AlertCard = ({ icon:Icon, color, bg, border, title, subtitle, badge, action, onDismiss, children }) => (
  <div style={{ padding:'14px 16px',background:bg||`${color}08`,border:`1px solid ${border||color+'30'}`,borderRadius:12,marginBottom:10,display:'flex',alignItems:'flex-start',gap:12,transition:'all 0.15s' }}
    onMouseEnter={e=>e.currentTarget.style.borderColor=`${color}55`}
    onMouseLeave={e=>e.currentTarget.style.borderColor=border||`${color}30`}>
    <div style={{ width:38,height:38,borderRadius:11,background:`${color}18`,border:`1px solid ${color}30`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
      <Icon size={18} color={color}/>
    </div>
    <div style={{ flex:1 }}>
      <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:3 }}>
        <span style={{ fontSize:13,fontWeight:700,color:'#f0f4ff' }}>{title}</span>
        {badge && <span style={{ fontSize:9.5,fontWeight:700,padding:'1px 7px',borderRadius:5,background:`${color}20`,color,border:`1px solid ${color}30` }}>{badge}</span>}
      </div>
      <div style={{ fontSize:12,color:'#94a3b8',marginBottom:children?6:0 }}>{subtitle}</div>
      {children}
      {action && (
        <button onClick={action.fn} style={{ marginTop:8,fontSize:11,fontWeight:700,color,background:`${color}15`,border:`1px solid ${color}30`,borderRadius:7,padding:'5px 12px',cursor:'pointer',transition:'all 0.15s' }}
          onMouseEnter={e=>e.currentTarget.style.background=`${color}25`}
          onMouseLeave={e=>e.currentTarget.style.background=`${color}15`}>
          {action.label}
        </button>
      )}
    </div>
    {onDismiss && (
      <button onClick={onDismiss} style={{ background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:6,width:28,height:28,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.15s' }}
        onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.1)';e.currentTarget.style.borderColor='rgba(255,255,255,0.15)';}}
        onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.05)';e.currentTarget.style.borderColor='rgba(255,255,255,0.08)';}}>
        <X size={13} color="#64748b"/>
      </button>
    )}
  </div>
);

export default function Alerts() {
  const { medicines, getDaysToExpiry, updateMedicine } = useStore();
  const [dismissed, setDismissed] = useState(new Set());
  const [tab, setTab] = useState('all');

  const dismiss = key => setDismissed(p => new Set([...p,key]));

  const expired    = medicines.filter(m=>getDaysToExpiry(m.expiryDate)<0&&!dismissed.has(m.id+'_exp'));
  const critical   = medicines.filter(m=>{const d=getDaysToExpiry(m.expiryDate);return d>=0&&d<=30&&!dismissed.has(m.id+'_crit');});
  const warning    = medicines.filter(m=>{const d=getDaysToExpiry(m.expiryDate);return d>30&&d<=90&&!dismissed.has(m.id+'_warn');});
  const outOfStock = medicines.filter(m=>m.stockQty===0&&!dismissed.has(m.id+'_oos'));
  const lowStock   = medicines.filter(m=>m.stockQty>0&&m.stockQty<=m.reorderLevel&&!dismissed.has(m.id+'_low'));
  const schedX     = medicines.filter(m=>m.schedule==='Schedule X'&&!dismissed.has(m.id+'_sx'));

  const totalCritical = expired.length+critical.length+outOfStock.length;

  const TABS = [
    { k:'all',        l:'All',            count:totalCritical },
    { k:'expired',    l:'Expired',        count:expired.length },
    { k:'expiring',   l:'Expiring Soon',  count:critical.length+warning.length },
    { k:'stock',      l:'Stock Issues',   count:outOfStock.length+lowStock.length },
    { k:'compliance', l:'Compliance',     count:schedX.length },
  ];

  return (
    <div style={{ color:'#e2e8f0', paddingBottom:32 }}>
      <div style={{ marginBottom:22 }} className="fade-up">
        <h1 style={{ margin:0,fontSize:22,fontWeight:900,color:'#f0f4ff',letterSpacing:'-0.3px' }}>🔔 Alerts & Notifications</h1>
        <p style={{ margin:'5px 0 0',fontSize:13,color:'#64748b' }}>
          {totalCritical>0 ? `${totalCritical} critical alerts require immediate attention.` : 'All systems normal — no critical alerts.'}
        </p>
      </div>

      {/* Summary */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:22 }}>
        {[
          { l:'Expired',        v:expired.length,    c:'#ef4444', icon:X          },
          { l:'Expiring <30d',  v:critical.length,   c:'#f97316', icon:Clock      },
          { l:'Out of Stock',   v:outOfStock.length, c:'#ef4444', icon:PackageX   },
          { l:'Low Stock',      v:lowStock.length,   c:'#f59e0b', icon:AlertTriangle },
          { l:'Schedule X',     v:schedX.length,     c:'#8b5cf6', icon:ShieldAlert },
        ].map(x=>(
          <div key={x.l} style={{ padding:'16px 14px',background:'#0d1630',border:`1px solid ${x.v>0?x.c+'40':'rgba(255,255,255,0.06)'}`,borderRadius:14,transition:'all 0.2s' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10 }}>
              <div style={{ width:32,height:32,background:`${x.v>0?x.c:'#475569'}18`,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center' }}>
                <x.icon size={15} color={x.v>0?x.c:'#475569'}/>
              </div>
            </div>
            <div style={{ fontSize:28,fontWeight:900,color:x.v>0?x.c:'#2d3f5a',lineHeight:1 }}>{x.v}</div>
            <div style={{ fontSize:11,color:'#64748b',marginTop:5 }}>{x.l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex',borderBottom:'1px solid rgba(255,255,255,0.06)',marginBottom:20 }}>
        {TABS.map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{
            padding:'10px 18px',background:'none',border:'none',cursor:'pointer',
            fontSize:13,fontWeight:tab===t.k?700:400,
            color:tab===t.k?'#10b981':'#64748b',
            borderBottom:`2px solid ${tab===t.k?'#10b981':'transparent'}`,
            display:'flex',alignItems:'center',gap:7,transition:'all 0.15s',
          }}>
            {t.l}
            {t.count>0&&<span style={{ fontSize:10,background:'#ef4444',color:'white',borderRadius:10,padding:'1px 7px',fontWeight:800,boxShadow:'0 0 8px rgba(239,68,68,0.3)' }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {totalCritical===0&&dismissed.size===0 ? (
        <div style={{ textAlign:'center',padding:'60px 0',background:'#0d1630',borderRadius:18,border:'1px solid rgba(16,185,129,0.15)' }}>
          <div style={{ width:64,height:64,background:'rgba(16,185,129,0.1)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',border:'1px solid rgba(16,185,129,0.2)' }}>
            <CheckCircle size={32} color="#10b981"/>
          </div>
          <div style={{ fontSize:20,fontWeight:800,color:'#f0f4ff',marginBottom:8 }}>All Clear! ✅</div>
          <div style={{ fontSize:13,color:'#64748b' }}>No alerts at this time. Your inventory is in great health.</div>
        </div>
      ) : (
        <div>
          {(tab==='all'||tab==='expired')&&expired.length>0&&(
            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:11,fontWeight:800,color:'#ef4444',marginBottom:10,textTransform:'uppercase',letterSpacing:1,display:'flex',alignItems:'center',gap:8 }}>
                <span style={{ width:8,height:8,borderRadius:'50%',background:'#ef4444',display:'inline-block',boxShadow:'0 0 8px #ef4444' }}/>
                Expired Medicines — Remove from shelf immediately ({expired.length})
              </div>
              {expired.map(m=>(
                <AlertCard key={m.id} icon={X} color="#ef4444"
                  title={m.name} badge="EXPIRED"
                  subtitle={`Batch: ${m.batchNumber} · Expired: ${new Date(m.expiryDate).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}`}
                  onDismiss={()=>dismiss(m.id+'_exp')}>
                  <div style={{ fontSize:11,color:'#64748b' }}>{m.stockQty} units still in stock · {m.manufacturer} · Rack: {m.rackLocation||'—'}</div>
                </AlertCard>
              ))}
            </div>
          )}

          {(tab==='all'||tab==='expiring')&&critical.length>0&&(
            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:11,fontWeight:800,color:'#f97316',marginBottom:10,textTransform:'uppercase',letterSpacing:1,display:'flex',alignItems:'center',gap:8 }}>
                <span style={{ width:8,height:8,borderRadius:'50%',background:'#f97316',display:'inline-block' }}/>
                Expiring Within 30 Days ({critical.length})
              </div>
              {critical.map(m=>{
                const d=getDaysToExpiry(m.expiryDate);
                return (
                  <AlertCard key={m.id} icon={Clock} color="#f97316"
                    title={m.name} badge={`${d}d left`}
                    subtitle={`Expires: ${new Date(m.expiryDate).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}`}
                    onDismiss={()=>dismiss(m.id+'_crit')}>
                    <div style={{ fontSize:11,color:'#64748b' }}>Batch: {m.batchNumber} · {m.stockQty} units · {m.supplier||'—'}</div>
                  </AlertCard>
                );
              })}
            </div>
          )}

          {(tab==='all'||tab==='expiring')&&warning.length>0&&(
            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:11,fontWeight:800,color:'#eab308',marginBottom:10,textTransform:'uppercase',letterSpacing:1,display:'flex',alignItems:'center',gap:8 }}>
                <span style={{ width:8,height:8,borderRadius:'50%',background:'#eab308',display:'inline-block' }}/>
                Expiring Within 90 Days ({warning.length})
              </div>
              {warning.map(m=>{
                const d=getDaysToExpiry(m.expiryDate);
                return (
                  <AlertCard key={m.id} icon={Clock} color="#eab308"
                    title={m.name} badge={`${d}d`}
                    subtitle={`Expires: ${new Date(m.expiryDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'})}`}
                    onDismiss={()=>dismiss(m.id+'_warn')}>
                    <div style={{ fontSize:11,color:'#64748b' }}>{m.stockQty} units · {m.manufacturer}</div>
                  </AlertCard>
                );
              })}
            </div>
          )}

          {(tab==='all'||tab==='stock')&&outOfStock.length>0&&(
            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:11,fontWeight:800,color:'#ef4444',marginBottom:10,textTransform:'uppercase',letterSpacing:1,display:'flex',alignItems:'center',gap:8 }}>
                <span style={{ width:8,height:8,borderRadius:'50%',background:'#ef4444',display:'inline-block',boxShadow:'0 0 8px #ef4444' }}/>
                Out of Stock ({outOfStock.length})
              </div>
              {outOfStock.map(m=>(
                <AlertCard key={m.id} icon={PackageX} color="#ef4444"
                  title={m.name} badge="OUT OF STOCK"
                  subtitle={`${m.category} · ${m.manufacturer} · Supplier: ${m.supplier||'—'}`}
                  action={{ label:'✅ Mark as Reordered', fn:()=>{updateMedicine(m.id,{stockQty:m.reorderLevel*3});dismiss(m.id+'_oos');} }}
                  onDismiss={()=>dismiss(m.id+'_oos')}>
                  <div style={{ fontSize:11,color:'#64748b' }}>Reorder Level: {m.reorderLevel} units · MRP: ₹{m.mrp}</div>
                </AlertCard>
              ))}
            </div>
          )}

          {(tab==='all'||tab==='stock')&&lowStock.length>0&&(
            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:11,fontWeight:800,color:'#f59e0b',marginBottom:10,textTransform:'uppercase',letterSpacing:1,display:'flex',alignItems:'center',gap:8 }}>
                <span style={{ width:8,height:8,borderRadius:'50%',background:'#f59e0b',display:'inline-block' }}/>
                Low Stock — Below Reorder Level ({lowStock.length})
              </div>
              {lowStock.map(m=>(
                <AlertCard key={m.id} icon={AlertTriangle} color="#f59e0b"
                  title={m.name}
                  subtitle={`${m.stockQty} units remaining — Reorder at ${m.reorderLevel} units`}
                  onDismiss={()=>dismiss(m.id+'_low')}>
                  <div className="progress" style={{ marginTop:6, maxWidth:200 }}>
                    <div className="progress-fill" style={{ width:`${Math.min(100,(m.stockQty/m.reorderLevel)*100)}%`,background:'linear-gradient(90deg,#ef4444,#f59e0b)' }}/>
                  </div>
                  <div style={{ fontSize:10,color:'#64748b',marginTop:4 }}>Supplier: {m.supplier||'—'} · MRP: ₹{m.mrp}</div>
                </AlertCard>
              ))}
            </div>
          )}

          {(tab==='all'||tab==='compliance')&&(
            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:11,fontWeight:800,color:'#8b5cf6',marginBottom:10,textTransform:'uppercase',letterSpacing:1,display:'flex',alignItems:'center',gap:8 }}>
                <span style={{ width:8,height:8,borderRadius:'50%',background:'#8b5cf6',display:'inline-block' }}/>
                Controlled Substances — NDPS Act Compliance ({schedX.length})
              </div>
              {schedX.length===0?(
                <div style={{ padding:20,background:'rgba(255,255,255,0.02)',borderRadius:12,fontSize:13,color:'#64748b',textAlign:'center',border:'1px solid rgba(255,255,255,0.06)' }}>
                  No Schedule X medicines in current inventory
                </div>
              ):schedX.map(m=>{
                const sc=SCHED_C[m.schedule]||SCHED_C['Schedule H'];
                return (
                  <AlertCard key={m.id} icon={ShieldAlert} color={sc.c} bg={sc.bg} border={sc.b}
                    title={`${m.name}`} badge={m.schedule}
                    subtitle="NDPS Act compliance required — Maintain separate narcotic register"
                    onDismiss={()=>dismiss(m.id+'_sx')}>
                    <div style={{ fontSize:11,color:'#94a3b8',marginTop:3 }}>
                      Batch: {m.batchNumber} · Stock: {m.stockQty} units · Location: {m.rackLocation||'SECURE CUPBOARD'}
                    </div>
                  </AlertCard>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}