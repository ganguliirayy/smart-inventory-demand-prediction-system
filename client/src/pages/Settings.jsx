import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';

const iStyle = {
  background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)',
  borderRadius:9, padding:'10px 14px', color:'#f0f4ff',
  fontSize:13, outline:'none', width:'100%', boxSizing:'border-box',
  transition:'border-color 0.2s, box-shadow 0.2s',
};
const iFocus = { borderColor:'rgba(99,102,241,0.5)', boxShadow:'0 0 0 3px rgba(99,102,241,0.1)' };

const TABS = [
  { k:'profile',   l:'👤 Profile',      desc:'Your personal information'       },
  { k:'pharmacy',  l:'🏥 Pharmacy',     desc:'Store & license details'         },
  { k:'alerts',    l:'🔔 Alerts',       desc:'Notification preferences'        },
  { k:'data',      l:'💾 Data',         desc:'Export, backup & reset'          },
  { k:'about',     l:'ℹ️ About',        desc:'App info & version'              },
];

const FG = ({ label, hint, children }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
    <label style={{ fontSize:11, color:'#94a3b8', fontWeight:700, letterSpacing:0.3 }}>{label}</label>
    {children}
    {hint && <span style={{ fontSize:10.5, color:'#475569', lineHeight:1.5 }}>{hint}</span>}
  </div>
);

const Inp = ({ value, onChange, ...rest }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input value={value} onChange={onChange}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ ...iStyle, ...(focused ? iFocus : {}) }} {...rest} />
  );
};

const Toggle = ({ checked, onChange, color = '#6366f1' }) => (
  <div onClick={onChange} style={{
    width:44, height:24, borderRadius:12, cursor:'pointer',
    background: checked ? color : 'rgba(255,255,255,0.1)',
    position:'relative', transition:'background 0.3s',
    border:`1px solid ${checked ? color : 'rgba(255,255,255,0.15)'}`,
    boxShadow: checked ? `0 0 10px ${color}44` : 'none',
    flexShrink:0,
  }}>
    <div style={{
      width:18, height:18, borderRadius:'50%',
      background:'white', position:'absolute', top:2,
      left: checked ? 22 : 2, transition:'left 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      boxShadow:'0 1px 4px rgba(0,0,0,0.3)',
    }} />
  </div>
);

const SectionCard = ({ title, subtitle, children }) => (
  <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:24, marginBottom:20 }}>
    {(title || subtitle) && (
      <div style={{ marginBottom:20, paddingBottom:14, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        {title    && <div style={{ fontSize:14, fontWeight:700, color:'#f0f4ff' }}>{title}</div>}
        {subtitle && <div style={{ fontSize:11, color:'#64748b', marginTop:4 }}>{subtitle}</div>}
      </div>
    )}
    {children}
  </div>
);

const Toast = ({ msg, color }) => (
  <div style={{
    position:'fixed', bottom:30, right:30, zIndex:9999,
    background:'#0d1630', border:`1px solid ${color}55`,
    borderRadius:14, padding:'14px 20px',
    boxShadow:'0 12px 40px rgba(0,0,0,0.5)',
    animation:'slideInRight 0.3s ease',
    display:'flex', alignItems:'center', gap:12, minWidth:260,
  }}>
    <div style={{ width:36, height:36, borderRadius:10, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
      {color === '#10b981' ? '✅' : '⚠️'}
    </div>
    <div style={{ fontSize:13, fontWeight:700, color:'#f0f4ff' }}>{msg}</div>
  </div>
);

export default function Settings() {
  const { medicines, stats, salesLog, clearActivities } = useStore();
  const navigate = useNavigate();

  const [tab, setTab] = useState('profile');
  const [toast, setToast] = useState(null);

  const showToast = (msg, color = '#10b981') => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Profile State ── */
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rxflow_profile')) || {}; } catch { return {}; }
  });
  const [pForm, setPForm] = useState({
    name:      profile.name      || 'Ganguliii',
    role:      profile.role      || 'Senior Pharmacist',
    phone:     profile.phone     || '',
    email:     profile.email     || '',
    license:   profile.license   || '',
    regNo:     profile.regNo     || '',
  });

  /* ── Pharmacy State ── */
  const [pharma, setPharma] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rxflow_pharma')) || {}; } catch { return {}; }
  });
  const [phForm, setPhForm] = useState({
    storeName:    pharma.storeName    || 'My Pharmacy',
    address:      pharma.address      || '',
    city:         pharma.city         || '',
    pincode:      pharma.pincode      || '',
    gstNumber:    pharma.gstNumber    || '',
    drugLicense:  pharma.drugLicense  || '',
    phone:        pharma.phone        || '',
    email:        pharma.email        || '',
  });

  /* ── Alert Prefs State ── */
  const [alertPrefs, setAlertPrefs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('rxflow_alert_prefs')) || {
        expiryAlert:   true,
        lowStockAlert: true,
        outOfStock:    true,
        scheduleX:     true,
        dailySummary:  false,
        soundEnabled:  true,
        expiryDays:    30,
        lowStockPct:   20,
      };
    } catch {
      return { expiryAlert:true, lowStockAlert:true, outOfStock:true, scheduleX:true, dailySummary:false, soundEnabled:true, expiryDays:30, lowStockPct:20 };
    }
  });

  const saveProfile = () => {
    localStorage.setItem('rxflow_profile', JSON.stringify(pForm));
    showToast('Profile saved successfully!');
  };

  const savePharmacy = () => {
    localStorage.setItem('rxflow_pharma', JSON.stringify(phForm));
    showToast('Pharmacy details saved!');
  };

  const saveAlertPrefs = () => {
    localStorage.setItem('rxflow_alert_prefs', JSON.stringify(alertPrefs));
    showToast('Alert preferences saved!');
  };

  const exportAllData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      profile: pForm,
      pharmacy: phForm,
      medicines,
      salesLog,
      stats,
    };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type:'application/json' }));
    a.download = `rxflow_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    showToast('Data exported successfully!');
  };

  const exportMedicinesCSV = () => {
    const cols = ['id','name','genericName','manufacturer','supplier','category','therapeuticClass','schedule','batchNumber','expiryDate','mrp','purchasePrice','sellingPrice','gstRate','stockQty','reorderLevel','hsnCode','rackLocation'];
    const csv  = [cols.join(','), ...medicines.map(m => cols.map(c => `"${m[c]??''}"`).join(','))].join('\n');
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(new Blob([csv], { type:'text/csv' }));
    a.download = `rxflow_medicines_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    showToast('CSV exported!');
  };

  const exportSalesCSV = () => {
    if (salesLog.length === 0) { showToast('No sales data yet!', '#f59e0b'); return; }
    const cols = ['id','medicineName','qty','revenue','profit','patientName','timestamp'];
    const csv  = [cols.join(','), ...salesLog.map(s => cols.map(c => `"${s[c]??''}"`).join(','))].join('\n');
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(new Blob([csv], { type:'text/csv' }));
    a.download = `rxflow_sales_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    showToast('Sales data exported!');
  };

  const clearActivityLog = () => {
    clearActivities();
    showToast('Activity log cleared!');
  };

  const resetAll = () => {
    if (!window.confirm('⚠️ This will clear ALL data including medicines, sales, and settings. Are you absolutely sure, Ganguliii?')) return;
    ['rxflow_v1','rxflow_activities','rxflow_sales','rxflow_profile','rxflow_pharma','rxflow_alert_prefs'].forEach(k => localStorage.removeItem(k));
    showToast('All data reset. Reloading...', '#ef4444');
    setTimeout(() => window.location.reload(), 1500);
  };

  const upP  = (k, v) => setPForm(p  => ({ ...p, [k]:v }));
  const upPh = (k, v) => setPhForm(p => ({ ...p, [k]:v }));
  const upAl = (k, v) => setAlertPrefs(p => ({ ...p, [k]:v }));

  const SaveBtn = ({ onClick, label = 'Save Changes' }) => (
    <div style={{ display:'flex', justifyContent:'flex-end', marginTop:24 }}>
      <button onClick={onClick} style={{
        padding:'10px 26px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
        border:'none', borderRadius:11, color:'white', cursor:'pointer',
        fontSize:13, fontWeight:800, boxShadow:'0 4px 16px rgba(99,102,241,0.4)',
        transition:'all 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 28px rgba(99,102,241,0.5)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(99,102,241,0.4)'; }}>
        💾 {label}
      </button>
    </div>
  );

  return (
    <div style={{ color:'#e2e8f0', paddingBottom:40, maxWidth:900 }}>
      {toast && <Toast msg={toast.msg} color={toast.color} />}

      {/* ── Header ── */}
      <div style={{ marginBottom:28, animation:'fadeUp 0.3s ease' }}>
        <h1 style={{ margin:0, fontSize:24, fontWeight:900, color:'#f0f4ff', letterSpacing:'-0.4px' }}>
          ⚙️ Settings
        </h1>
        <p style={{ margin:'6px 0 0', fontSize:13, color:'#64748b' }}>
          Manage your RxFlow AI preferences, pharmacy details & account
        </p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:20 }}>

        {/* ── Tab List ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {TABS.map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} style={{
              padding:'12px 16px', background: tab === t.k ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)',
              border:`1px solid ${tab === t.k ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius:12, cursor:'pointer', textAlign:'left',
              transition:'all 0.2s', borderLeft:`3px solid ${tab === t.k ? '#6366f1' : 'transparent'}`,
            }}
            onMouseEnter={e => { if(tab!==t.k){ e.currentTarget.style.background='rgba(255,255,255,0.05)'; } }}
            onMouseLeave={e => { if(tab!==t.k){ e.currentTarget.style.background='rgba(255,255,255,0.02)'; } }}>
              <div style={{ fontSize:13, fontWeight: tab===t.k ? 700 : 500, color: tab===t.k ? '#a5b4fc' : '#94a3b8' }}>
                {t.l}
              </div>
              <div style={{ fontSize:10.5, color:'#475569', marginTop:3 }}>{t.desc}</div>
            </button>
          ))}

          {/* Quick Back */}
          <button onClick={() => navigate('/dashboard')} style={{
            marginTop:12, padding:'10px 16px',
            background:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.2)',
            borderRadius:12, cursor:'pointer', textAlign:'left', color:'#10b981',
            fontSize:12, fontWeight:700, transition:'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(16,185,129,0.14)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(16,185,129,0.07)'}>
            ← Back to Dashboard
          </button>
        </div>

        {/* ── Tab Content ── */}
        <div style={{ animation:'fadeUp 0.3s ease' }}>

          {/* ──────────────────── PROFILE ──────────────────── */}
          {tab === 'profile' && (
            <div>
              {/* Avatar Card */}
              <SectionCard title="Profile Picture & Identity">
                <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:24 }}>
                  <div style={{
                    width:80, height:80, borderRadius:'50%',
                    background:'linear-gradient(135deg,#6366f1,#8b5cf6,#10b981)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:32, fontWeight:900, color:'white',
                    boxShadow:'0 4px 24px rgba(99,102,241,0.5)',
                    border:'3px solid rgba(99,102,241,0.4)',
                    cursor:'pointer', transition:'all 0.3s',
                    flexShrink:0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform='scale(1.08) rotate(-5deg)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform='scale(1) rotate(0deg)'; }}>
                    {pForm.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize:18, fontWeight:900, color:'#f0f4ff' }}>{pForm.name}</div>
                    <div style={{ fontSize:13, color:'#10b981', fontWeight:600, marginTop:3 }}>{pForm.role}</div>
                    <div style={{ fontSize:11, color:'#475569', marginTop:4 }}>
                      RxFlow AI · Pharmacy Management System
                    </div>
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <FG label="Full Name">
                    <Inp value={pForm.name}    onChange={e => upP('name',e.target.value)}    placeholder="Your full name"/>
                  </FG>
                  <FG label="Role / Designation">
                    <Inp value={pForm.role}    onChange={e => upP('role',e.target.value)}    placeholder="e.g. Senior Pharmacist"/>
                  </FG>
                  <FG label="Phone Number">
                    <Inp value={pForm.phone}   onChange={e => upP('phone',e.target.value)}   placeholder="+91 98765 43210" type="tel"/>
                  </FG>
                  <FG label="Email Address">
                    <Inp value={pForm.email}   onChange={e => upP('email',e.target.value)}   placeholder="ganguliii@rxflow.ai" type="email"/>
                  </FG>
                  <FG label="Pharmacist License No." hint="State Pharmacy Council registration number">
                    <Inp value={pForm.license} onChange={e => upP('license',e.target.value)} placeholder="e.g. MH/2020/12345"/>
                  </FG>
                  <FG label="Reg. No. / ID">
                    <Inp value={pForm.regNo}   onChange={e => upP('regNo',e.target.value)}   placeholder="Employee / Reg ID"/>
                  </FG>
                </div>
                <SaveBtn onClick={saveProfile} />
              </SectionCard>

              {/* Stats */}
              <SectionCard title="Your Activity Stats" subtitle="Your contribution to RxFlow AI">
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                  {[
                    { l:'Total Sales',     v:stats.totalSalesCount,  c:'#6366f1', e:'🛒' },
                    { l:'Today Revenue',   v:`₹${Math.round(stats.todayRevenue)}`, c:'#10b981', e:'💰' },
                    { l:'Medicines Mgd',   v:stats.totalMedicines,  c:'#f59e0b', e:'💊' },
                    { l:'Out of Stock',    v:stats.outOfStock,      c:'#ef4444', e:'📦' },
                    { l:'Expiring <30d',   v:stats.expiringIn30Days,c:'#f97316', e:'⏰' },
                    { l:'Profit Potential',v:`₹${Math.round(stats.grossProfitPotential/1000)}K`, c:'#8b5cf6', e:'📈' },
                  ].map(x => (
                    <div key={x.l} style={{ padding:'14px 16px', background:`${x.c}10`, border:`1px solid ${x.c}25`, borderRadius:12, textAlign:'center', cursor:'default', transition:'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=`0 8px 20px ${x.c}25`; }}
                      onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}>
                      <div style={{ fontSize:20, marginBottom:6 }}>{x.e}</div>
                      <div style={{ fontSize:20, fontWeight:900, color:x.c }}>{x.v}</div>
                      <div style={{ fontSize:10, color:'#64748b', marginTop:4 }}>{x.l}</div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          )}

          {/* ──────────────────── PHARMACY ──────────────────── */}
          {tab === 'pharmacy' && (
            <div>
              <SectionCard title="Pharmacy Details" subtitle="Your store information and legal details">
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div style={{ gridColumn:'1/-1' }}>
                    <FG label="Pharmacy / Store Name">
                      <Inp value={phForm.storeName}   onChange={e => upPh('storeName',e.target.value)}   placeholder="e.g. Ganguliii Medical Store"/>
                    </FG>
                  </div>
                  <div style={{ gridColumn:'1/-1' }}>
                    <FG label="Full Address">
                      <textarea value={phForm.address} onChange={e => upPh('address',e.target.value)}
                        placeholder="Shop No. 12, Main Market, ..."
                        rows={2} style={{ ...iStyle, resize:'vertical', lineHeight:1.5 }}
                        onFocus={e => { e.target.style.borderColor='rgba(99,102,241,0.5)'; e.target.style.boxShadow='0 0 0 3px rgba(99,102,241,0.1)'; }}
                        onBlur={e  => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.boxShadow='none'; }}/>
                    </FG>
                  </div>
                  <FG label="City">
                    <Inp value={phForm.city}        onChange={e => upPh('city',e.target.value)}        placeholder="e.g. Surat"/>
                  </FG>
                  <FG label="PIN Code">
                    <Inp value={phForm.pincode}     onChange={e => upPh('pincode',e.target.value)}     placeholder="e.g. 395003"/>
                  </FG>
                  <FG label="GST Number" hint="15-digit GSTIN for billing compliance">
                    <Inp value={phForm.gstNumber}   onChange={e => upPh('gstNumber',e.target.value)}   placeholder="e.g. 24AADCB2230M1ZP"/>
                  </FG>
                  <FG label="Drug License No." hint="State Drug Control license number">
                    <Inp value={phForm.drugLicense} onChange={e => upPh('drugLicense',e.target.value)} placeholder="e.g. GJ/DL/2023/12345"/>
                  </FG>
                  <FG label="Store Phone">
                    <Inp value={phForm.phone}       onChange={e => upPh('phone',e.target.value)}       placeholder="+91 98765 43210" type="tel"/>
                  </FG>
                  <FG label="Store Email">
                    <Inp value={phForm.email}       onChange={e => upPh('email',e.target.value)}       placeholder="store@rxflow.ai" type="email"/>
                  </FG>
                </div>
                <SaveBtn onClick={savePharmacy} label="Save Pharmacy Details" />
              </SectionCard>

              {/* Compliance Reminder */}
              <SectionCard>
                <div style={{ display:'flex', gap:16, alignItems:'flex-start', padding:'4px 0' }}>
                  <div style={{ fontSize:28, flexShrink:0 }}>⚖️</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#f0f4ff', marginBottom:6 }}>Indian Pharmacy Compliance Reminders</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {[
                        { t:'Drug & Cosmetics Act 1940', d:'Ensure all medicines are procured from licensed distributors only.' },
                        { t:'NDPS Act 1985',             d:'Schedule X medicines require separate register & extra documentation.' },
                        { t:'DPCO Price Control',        d:'Selling above MRP is illegal. Monitor MRP compliance regularly.' },
                        { t:'GST Compliance',            d:'File GSTR-1 & GSTR-3B monthly. Keep HSN codes updated.' },
                      ].map(x => (
                        <div key={x.t} style={{ padding:'10px 14px', background:'rgba(99,102,241,0.05)', border:'1px solid rgba(99,102,241,0.12)', borderRadius:10 }}>
                          <div style={{ fontSize:12, fontWeight:700, color:'#a5b4fc', marginBottom:3 }}>📋 {x.t}</div>
                          <div style={{ fontSize:11.5, color:'#64748b' }}>{x.d}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {/* ──────────────────── ALERTS ──────────────────── */}
          {tab === 'alerts' && (
            <div>
              <SectionCard title="Alert Notifications" subtitle="Control when and how RxFlow AI alerts you">
                {[
                  { k:'expiryAlert',   l:'Expiry Date Alerts',    d:'Alert when medicines are approaching expiry',   c:'#f59e0b' },
                  { k:'lowStockAlert', l:'Low Stock Alerts',       d:'Alert when stock falls below reorder level',    c:'#ef4444' },
                  { k:'outOfStock',    l:'Out of Stock Alerts',    d:'Immediate alert when a medicine hits zero',     c:'#ef4444' },
                  { k:'scheduleX',     l:'Schedule X Compliance',  d:'NDPS compliance reminders for narcotic drugs',  c:'#8b5cf6' },
                  { k:'dailySummary',  l:'Daily Summary',          d:'Get a daily snapshot of inventory health',      c:'#10b981' },
                  { k:'soundEnabled',  l:'Sound Notifications',    d:'Play a sound when critical alerts appear',      c:'#6366f1' },
                ].map(x => (
                  <div key={x.k} style={{
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                    padding:'15px 0', borderBottom:'1px solid rgba(255,255,255,0.05)',
                    transition:'all 0.2s', cursor:'default',
                  }}
                  onMouseEnter={e => e.currentTarget.style.padding = '15px 8px'}
                  onMouseLeave={e => e.currentTarget.style.padding = '15px 0'}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13.5, fontWeight:600, color:'#e2e8f0', display:'flex', alignItems:'center', gap:8 }}>
                        {x.l}
                        {alertPrefs[x.k] && (
                          <span style={{ fontSize:9.5, background:`${x.c}20`, color:x.c, padding:'1px 7px', borderRadius:6, fontWeight:700 }}>
                            ON
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize:11.5, color:'#64748b', marginTop:3 }}>{x.d}</div>
                    </div>
                    <Toggle checked={alertPrefs[x.k]} onChange={() => upAl(x.k, !alertPrefs[x.k])} color={x.c} />
                  </div>
                ))}
              </SectionCard>

              <SectionCard title="Alert Thresholds" subtitle="Customize when alerts are triggered">
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                  <FG label="Expiry Warning Days" hint="Alert when expiry is within this many days">
                    <Inp type="number" min="1" max="365" value={alertPrefs.expiryDays}
                      onChange={e => upAl('expiryDays', Number(e.target.value))} placeholder="30"/>
                  </FG>
                  <FG label="Low Stock Threshold (%)" hint="Alert when stock is below this % of reorder level">
                    <Inp type="number" min="1" max="100" value={alertPrefs.lowStockPct}
                      onChange={e => upAl('lowStockPct', Number(e.target.value))} placeholder="20"/>
                  </FG>
                </div>
              </SectionCard>

              <SaveBtn onClick={saveAlertPrefs} label="Save Alert Preferences" />
            </div>
          )}

          {/* ──────────────────── DATA ──────────────────── */}
          {tab === 'data' && (
            <div>
              <SectionCard title="Export Data" subtitle="Download your pharmacy data in multiple formats">
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {[
                    { l:'Export Medicines CSV',   d:'All medicine data in spreadsheet format',    c:'#10b981', e:'📊', fn:exportMedicinesCSV },
                    { l:'Export Sales CSV',        d:'Complete sales transaction history',         c:'#6366f1', e:'💰', fn:exportSalesCSV     },
                    { l:'Full Backup (JSON)',       d:'Everything including settings & activities', c:'#f59e0b', e:'💾', fn:exportAllData      },
                    { l:'Export Alerts Report',    d:`${stats.outOfStock + stats.expired} items need attention`, c:'#ef4444', e:'⚠️', fn:() => showToast('Coming soon!', '#f59e0b') },
                  ].map(x => (
                    <button key={x.l} onClick={x.fn} style={{
                      padding:'16px 18px', background:`${x.c}08`,
                      border:`1px solid ${x.c}25`, borderRadius:13,
                      cursor:'pointer', textAlign:'left', transition:'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background=`${x.c}15`; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 6px 20px ${x.c}25`; e.currentTarget.style.borderColor=`${x.c}44`; }}
                    onMouseLeave={e => { e.currentTarget.style.background=`${x.c}08`; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.borderColor=`${x.c}25`; }}>
                      <div style={{ fontSize:22, marginBottom:8 }}>{x.e}</div>
                      <div style={{ fontSize:13, fontWeight:700, color:x.c, marginBottom:4 }}>{x.l}</div>
                      <div style={{ fontSize:11, color:'#64748b' }}>{x.d}</div>
                    </button>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Data Management" subtitle="Clear or reset application data">
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {[
                    { l:'Clear Activity Log',  d:'Remove all activity timeline events',    c:'#f59e0b', fn:clearActivityLog, icon:'🗒️'  },
                    { l:'Reset All Data',       d:'⚠️ Permanently delete everything — medicines, sales, settings!', c:'#ef4444', fn:resetAll, icon:'💥', danger:true },
                  ].map(x => (
                    <div key={x.l} style={{
                      display:'flex', justifyContent:'space-between', alignItems:'center',
                      padding:'16px 18px', background:`${x.c}07`,
                      border:`1px solid ${x.c}20`, borderRadius:13,
                      transition:'border-color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor=`${x.c}44`}
                    onMouseLeave={e => e.currentTarget.style.borderColor=`${x.c}20`}>
                      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                        <span style={{ fontSize:22 }}>{x.icon}</span>
                        <div>
                          <div style={{ fontSize:13.5, fontWeight:600, color: x.danger ? '#ef4444' : '#e2e8f0' }}>{x.l}</div>
                          <div style={{ fontSize:11.5, color:'#64748b', marginTop:3 }}>{x.d}</div>
                        </div>
                      </div>
                      <button onClick={x.fn} style={{
                        padding:'8px 18px', background:`${x.c}18`,
                        border:`1px solid ${x.c}35`, borderRadius:9,
                        color:x.c, cursor:'pointer', fontSize:12, fontWeight:700,
                        transition:'all 0.2s', flexShrink:0,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background=x.c; e.currentTarget.style.color='white'; }}
                      onMouseLeave={e => { e.currentTarget.style.background=`${x.c}18`; e.currentTarget.style.color=x.c; }}>
                        {x.l.split(' ')[0]}
                      </button>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* Storage Usage */}
              <SectionCard title="Local Storage Usage">
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                  {[
                    { l:'Medicines',  v:`${medicines.length} items`,   c:'#6366f1' },
                    { l:'Sales Log',  v:`${salesLog.length} records`, c:'#10b981' },
                    { l:'Data Size',  v:`~${Math.round(JSON.stringify(medicines).length/1024)} KB`, c:'#f59e0b' },
                  ].map(x => (
                    <div key={x.l} style={{ padding:'14px', background:`${x.c}10`, border:`1px solid ${x.c}25`, borderRadius:12, textAlign:'center' }}>
                      <div style={{ fontSize:18, fontWeight:900, color:x.c }}>{x.v}</div>
                      <div style={{ fontSize:10, color:'#64748b', marginTop:4 }}>{x.l}</div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          )}

          {/* ──────────────────── ABOUT ──────────────────── */}
          {tab === 'about' && (
            <div>
              <SectionCard>
                <div style={{ textAlign:'center', padding:'20px 0 10px' }}>
                  <div style={{
                    width:80, height:80, borderRadius:24, margin:'0 auto 20px',
                    background:'linear-gradient(135deg,#6366f1,#8b5cf6,#10b981)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:36, boxShadow:'0 4px 24px rgba(99,102,241,0.5)',
                    cursor:'default', transition:'all 0.4s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform='scale(1.1) rotate(-8deg)'; e.currentTarget.style.boxShadow='0 8px 40px rgba(99,102,241,0.7)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform='scale(1) rotate(0deg)'; e.currentTarget.style.boxShadow='0 4px 24px rgba(99,102,241,0.5)'; }}>
                    💊
                  </div>
                  <div style={{ fontSize:28, fontWeight:900, color:'#f0f4ff', marginBottom:4 }}>
                    RxFlow <span style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6,#10b981)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>AI</span>
                  </div>
                  <div style={{ fontSize:13, color:'#64748b', marginBottom:20 }}>
                    Smart Pharmacy Inventory Management System
                  </div>
                  <div style={{ display:'inline-flex', padding:'5px 16px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:20, fontSize:12, color:'#10b981', fontWeight:700, marginBottom:6 }}>
                    Version 2.0.0 — Production Release
                  </div>
                  <div style={{ fontSize:11, color:'#475569', marginTop:8 }}>
                    Built with React + Vite · Optimized for Indian Pharmacies
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Features" subtitle="What RxFlow AI can do for you">
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {[
                    { e:'💊', f:'Medicine Inventory',    d:'Complete pharma-grade stock management'   },
                    { e:'💰', f:'Point of Sale',          d:'Quick sell with revenue & GST tracking'   },
                    { e:'⏰', f:'Expiry Intelligence',    d:'Smart expiry alerts & watchlist'          },
                    { e:'📊', f:'Demand Predictions',    d:'14-day AI-powered stock forecasts'        },
                    { e:'🛡️', f:'Schedule Compliance',   d:'OTC/H/H1/X drug classification system'   },
                    { e:'📋', f:'Activity Timeline',     d:'Real-time inventory event tracking'       },
                    { e:'🧠', f:'Smart Messages',        d:'Personalized AI insights for Ganguliii'   },
                    { e:'💾', f:'Data Export',           d:'CSV & JSON backup for all your data'      },
                  ].map(x => (
                    <div key={x.f} style={{ display:'flex', gap:12, padding:'12px 14px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:11, transition:'all 0.2s', cursor:'default' }}
                      onMouseEnter={e => { e.currentTarget.style.background='rgba(99,102,241,0.07)'; e.currentTarget.style.borderColor='rgba(99,102,241,0.2)'; e.currentTarget.style.transform='translateX(4px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.06)'; e.currentTarget.style.transform='translateX(0)'; }}>
                      <span style={{ fontSize:20, flexShrink:0 }}>{x.e}</span>
                      <div>
                        <div style={{ fontSize:12.5, fontWeight:700, color:'#e2e8f0' }}>{x.f}</div>
                        <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{x.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Tech Stack">
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {['React 18','Vite 5','Recharts','React Router 6','localStorage API','CSS Animations','Indian Pharma Standards','NDPS Act Compliance','GST/HSN Ready'].map(t => (
                    <span key={t} style={{ padding:'5px 12px', background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:8, fontSize:11.5, color:'#a5b4fc', fontWeight:600 }}>{t}</span>
                  ))}
                </div>
              </SectionCard>

              <div style={{ textAlign:'center', padding:'10px 0', fontSize:12, color:'#253456' }}>
                Made with ❤️ for Ganguliii · RxFlow AI © 2026 · Smart Pharma Pro
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}