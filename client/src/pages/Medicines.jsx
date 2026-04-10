import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Plus, Search, Download, Edit2, Trash2, RefreshCw,
  Eye, X, ChevronUp, ChevronDown, Pill, Filter,
} from '../components/Icons';
import {
  MEDICINE_CATEGORIES, SCHEDULES, STORAGE_CONDITIONS,
  MANUFACTURERS, SUPPLIERS, GST_RATES, THERAPEUTIC_CLASSES,
} from '../data/medicines';
import { useAuth } from '../context/AuthContext'; // ✅ ADD

const iStyle = {
  background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)',
  borderRadius:9, padding:'9px 13px', color:'#f0f4ff',
  fontSize:13, outline:'none', width:'100%', boxSizing:'border-box',
  transition:'border-color 0.2s, box-shadow 0.2s',
};
const iFocusStyle = { borderColor:'rgba(16,185,129,0.5)', boxShadow:'0 0 0 3px rgba(16,185,129,0.1)' };
const sStyle = { ...iStyle, cursor:'pointer', appearance:'none' };

const SCHED = {
  'OTC':         { c:'#10b981', bg:'rgba(16,185,129,0.1)',  b:'rgba(16,185,129,0.25)' },
  'Schedule H':  { c:'#f59e0b', bg:'rgba(245,158,11,0.1)', b:'rgba(245,158,11,0.25)' },
  'Schedule H1': { c:'#ef4444', bg:'rgba(239,68,68,0.1)',  b:'rgba(239,68,68,0.25)'  },
  'Schedule X':  { c:'#8b5cf6', bg:'rgba(139,92,246,0.1)', b:'rgba(139,92,246,0.25)' },
};
const STK = {
  out:  { l:'OUT',  c:'#ef4444' },
  low:  { l:'LOW',  c:'#f59e0b' },
  good: { l:'OK',   c:'#10b981' },
};
const EXP = { expired:'#ef4444', critical:'#ef4444', warning:'#f59e0b', caution:'#eab308', good:'#10b981' };

const EMPTY = {
  name:'', genericName:'', manufacturer:'', supplier:'',
  category:'Tablet', therapeuticClass:'Analgesic/Antipyretic',
  schedule:'OTC', batchNumber:'', manufacturingDate:'', expiryDate:'',
  mrp:'', purchasePrice:'', sellingPrice:'', hsnCode:'',
  gstRate:12, stockQty:'', reorderLevel:'',
  packSize:'', rackLocation:'', storageCondition:'Room Temperature (15-30°C)',
  description:'', requiresPrescription:false,
};

const FORM_TABS = [
  { k:'basic',      l:'🏷️ Basic Info'     },
  { k:'pricing',    l:'💰 Pricing & GST'  },
  { k:'inventory',  l:'📦 Inventory'      },
  { k:'compliance', l:'🛡️ Compliance'     },
];

const FG = ({ label, req, error, children }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
    <label style={{ fontSize:11, color:'#94a3b8', fontWeight:700, letterSpacing:0.3 }}>
      {label} {req && <span style={{ color:'#ef4444' }}>*</span>}
    </label>
    {children}
    {error && <span style={{ color:'#ef4444', fontSize:11, marginTop:2 }}>{error}</span>}
  </div>
);

const Inp = ({ value, onChange, error, ...rest }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input value={value} onChange={onChange}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ ...iStyle, ...(focused ? iFocusStyle : {}), ...(error ? { borderColor:'#ef4444' } : {}) }}
      {...rest}
    />
  );
};

const Sel = ({ value, onChange, children }) => (
  <select value={value} onChange={onChange} style={sStyle}>{children}</select>
);

const Overlay = ({ children }) => (
  <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.78)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20, animation:'fadeIn 0.2s ease' }}>
    {children}
  </div>
);

const ActionBtn = ({ onClick, color, icon:Icon, label, small }) => {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={label}
      style={{
        width: small ? 30 : 'auto',
        height: 30, borderRadius:8, border:'none',
        cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
        gap: small ? 0 : 5,
        padding: small ? '0' : '0 10px',
        background: hov ? color : `${color}18`,
        color: hov ? 'white' : color,
        fontSize:11, fontWeight:700,
        transition:'all 0.18s',
        transform: hov ? 'scale(1.08)' : 'scale(1)',
        boxShadow: hov ? `0 4px 12px ${color}44` : 'none',
      }}>
      <Icon size={13} />
      {!small && <span>{label}</span>}
    </button>
  );
};

export default function Medicines() {
  const {
    medicines, stats, addMedicine, updateMedicine, deleteMedicine, sellMedicine,
    getDaysToExpiry, getExpiryStatus, getStockStatus,
  } = useStore();

  const { isAdmin } = useAuth(); // ✅ ADD

  const [search,      setSearch]      = useState('');
  const [fCat,        setFCat]        = useState('All');
  const [fSch,        setFSch]        = useState('All');
  const [fStk,        setFStk]        = useState('All');
  const [fExp,        setFExp]        = useState('All');
  const [sortBy,      setSortBy]      = useState('name');
  const [sortDir,     setSortDir]     = useState('asc');
  const [modal,       setModal]       = useState(false);
  const [editId,      setEditId]      = useState(null);
  const [form,        setForm]        = useState(EMPTY);
  const [errors,      setErrors]      = useState({});
  const [tab,         setTab]         = useState('basic');
  const [delMed,      setDelMed]      = useState(null);
  const [viewMed,     setViewMed]     = useState(null);
  const [restock,     setRestock]     = useState(null);
  const [rstQty,      setRstQty]      = useState('');
  const [sellMed,     setSellMed]     = useState(null);
  const [sellQty,     setSellQty]     = useState('');
  const [sellPatient, setSellPatient] = useState('');
  const [sellSuccess, setSellSuccess] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [hovRow,      setHovRow]      = useState(null);

  const filtered = useMemo(() => {
    let r = [...medicines];
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        m.batchNumber.toLowerCase().includes(q) ||
        m.manufacturer.toLowerCase().includes(q) ||
        (m.hsnCode || '').includes(q) ||
        (m.rackLocation || '').toLowerCase().includes(q)
      );
    }
    if (fCat !== 'All') r = r.filter(m => m.category === fCat);
    if (fSch !== 'All') r = r.filter(m => m.schedule === fSch);
    if (fStk !== 'All') r = r.filter(m => getStockStatus(m) === fStk);
    if (fExp !== 'All') {
      r = r.filter(m => {
        const d = getDaysToExpiry(m.expiryDate);
        if (fExp === 'expired') return d < 0;
        if (fExp === '30')  return d >= 0 && d <= 30;
        if (fExp === '90')  return d >= 0 && d <= 90;
        return true;
      });
    }
    r.sort((a, b) => {
      let av = a[sortBy], bv = b[sortBy];
      if (sortBy === 'expiryDate') { av = new Date(av); bv = new Date(bv); }
      if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
      return sortDir === 'asc' ? (av < bv ? -1 : av > bv ? 1 : 0) : (av > bv ? -1 : av < bv ? 1 : 0);
    });
    return r;
  }, [medicines, search, fCat, fSch, fStk, fExp, sortBy, sortDir]);

  const toggleSort = f => {
    if (sortBy === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(f); setSortDir('asc'); }
  };
  const SortIco = ({ f }) => sortBy === f
    ? (sortDir === 'asc' ? <ChevronUp size={11} color="#6366f1" /> : <ChevronDown size={11} color="#6366f1" />)
    : <span style={{ color:'#475569', fontSize:10, marginLeft:2 }}>↕</span>;

  const openAdd  = () => { setEditId(null); setForm(EMPTY); setErrors({}); setTab('basic'); setModal(true); };
  const openEdit = m  => { setEditId(m.id); setForm({ ...m }); setErrors({}); setTab('basic'); setModal(true); };
  const upd = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: null })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())                                                               e.name = 'Required';
    if (!form.genericName.trim())                                                        e.genericName = 'Required';
    if (!form.manufacturer)                                                              e.manufacturer = 'Required';
    if (!form.batchNumber.trim())                                                        e.batchNumber = 'Required';
    if (!form.expiryDate)                                                                e.expiryDate = 'Required';
    if (!form.mrp || isNaN(form.mrp) || +form.mrp <= 0)                                 e.mrp = 'Valid MRP required';
    if (!form.purchasePrice || isNaN(form.purchasePrice) || +form.purchasePrice <= 0)   e.purchasePrice = 'Required';
    if (!form.sellingPrice  || isNaN(form.sellingPrice)  || +form.sellingPrice  <= 0)   e.sellingPrice = 'Required';
    if (form.stockQty === ''    || isNaN(form.stockQty)    || +form.stockQty    < 0)    e.stockQty = 'Required';
    if (form.reorderLevel === '' || isNaN(form.reorderLevel))                           e.reorderLevel = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = () => {
    if (!validate()) return;
    const data = {
      ...form,
      mrp:+form.mrp, purchasePrice:+form.purchasePrice,
      sellingPrice:+form.sellingPrice, stockQty:+form.stockQty,
      reorderLevel:+form.reorderLevel, gstRate:+form.gstRate,
    };
    editId ? updateMedicine(editId, data) : addMedicine(data);
    setModal(false);
  };

  const doRestock = () => {
    if (!rstQty || Number(rstQty) <= 0) return;
    updateMedicine(restock.id, { stockQty: restock.stockQty + Number(rstQty) });
    setRestock(null); setRstQty('');
  };

  const doSell = () => {
    if (!sellQty || Number(sellQty) <= 0) return;
    if (Number(sellQty) > sellMed.stockQty) return;
    const ok = sellMedicine(sellMed.id, Number(sellQty), sellPatient.trim());
    if (ok) {
      const revenue = sellMed.sellingPrice * Number(sellQty);
      setSellSuccess({ name:sellMed.name, qty:Number(sellQty), revenue });
      setTimeout(() => setSellSuccess(null), 3500);
      setSellMed(null); setSellQty(''); setSellPatient('');
    }
  };

  const exportCSV = () => {
    const cols = ['id','name','genericName','manufacturer','supplier','category','therapeuticClass','schedule','batchNumber','expiryDate','mrp','purchasePrice','sellingPrice','gstRate','stockQty','reorderLevel','hsnCode','rackLocation','storageCondition'];
    const csv  = [cols.join(','), ...filtered.map(m => cols.map(c => `"${m[c] ?? ''}"`).join(','))].join('\n');
    const a    = document.createElement('a');
    const date = new Date().toISOString().slice(0,10);
    a.href     = URL.createObjectURL(new Blob([csv], { type:'text/csv' }));
    a.download = `rxflow_medicines_${date}.csv`;
    a.click();
  };

  const margin = form.purchasePrice && form.sellingPrice
    ? (((+form.sellingPrice - +form.purchasePrice) / +form.purchasePrice) * 100).toFixed(1)
    : null;

  const activeFilters = [fCat!=='All', fSch!=='All', fStk!=='All', fExp!=='All'].filter(Boolean).length;

  const COLS = [
    { l:'MEDICINE',       f:'name',          w:'210px' },
    { l:'BATCH / EXPIRY', f:'expiryDate',    w:'148px' },
    { l:'SCHEDULE',       f:'schedule',      w:'108px' },
    { l:'STOCK',          f:'stockQty',      w:'95px'  },
    { l:'MRP',            f:'mrp',           w:'78px'  },
    { l:'MARGIN',         f:null,            w:'70px'  },
    { l:'LOCATION',       f:'rackLocation',  w:'85px'  },
    { l:'ACTIONS',        f:null,            w:'180px' },
  ];

  return (
    <div style={{ color:'#e2e8f0', paddingBottom:32 }}>

      {/* ── Sell Success Toast ── */}
      {sellSuccess && (
        <div style={{
          position:'fixed', top:20, right:20, zIndex:2000,
          background:'#0d1630', border:'1px solid rgba(16,185,129,0.4)',
          borderRadius:14, padding:'16px 20px', minWidth:280,
          boxShadow:'0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(16,185,129,0.15)',
          animation:'slideInRight 0.3s ease',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:'rgba(16,185,129,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
              💰
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:800, color:'#10b981' }}>Sale Recorded!</div>
              <div style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>{sellSuccess.qty}× {sellSuccess.name}</div>
              <div style={{ fontSize:14, fontWeight:900, color:'#f0f4ff', marginTop:2 }}>₹{sellSuccess.revenue.toFixed(0)} collected</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, animation:'fadeUp 0.3s ease' }}>
        <div>
          <h1 style={{ margin:0, fontSize:22, fontWeight:900, color:'#f0f4ff', letterSpacing:'-0.3px' }}>
            💊 Medicine Inventory
          </h1>
          <p style={{ margin:'5px 0 0', fontSize:13, color:'#64748b' }}>
            {stats.totalMedicines} SKUs · {filtered.length} shown · {stats.outOfStock} OOS · {stats.todaySalesCount} sold today
            {/* ✅ Customer badge */}
            {!isAdmin && (
              <span style={{ marginLeft:10, fontSize:11, background:'rgba(16,185,129,0.1)', color:'#10b981', border:'1px solid rgba(16,185,129,0.25)', borderRadius:6, padding:'1px 8px', fontWeight:700 }}>
                👁️ View Only
              </span>
            )}
          </p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <button onClick={() => setShowFilters(f => !f)} style={{
            display:'flex', alignItems:'center', gap:7, padding:'9px 16px',
            background:'rgba(255,255,255,0.04)', border:`1px solid ${activeFilters>0?'rgba(16,185,129,0.4)':'rgba(255,255,255,0.1)'}`,
            borderRadius:10, color:activeFilters>0?'#10b981':'#94a3b8', cursor:'pointer', fontSize:13, fontWeight:600,
            transition:'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
            <Filter size={14} />
            Filters
            {activeFilters > 0 && (
              <span style={{ background:'#10b981', color:'white', borderRadius:10, padding:'0 6px', fontSize:10, fontWeight:800 }}>{activeFilters}</span>
            )}
          </button>

          {/* ✅ Sirf Admin ko Add Medicine dikhega */}
          {isAdmin && (
            <button onClick={openAdd} style={{
              display:'flex', alignItems:'center', gap:7, padding:'9px 18px',
              background:'linear-gradient(135deg,#10b981,#059669)', border:'none',
              borderRadius:10, color:'white', cursor:'pointer', fontSize:13, fontWeight:700,
              boxShadow:'0 4px 15px rgba(16,185,129,0.35)', transition:'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(16,185,129,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(16,185,129,0.35)'; }}>
              <Plus size={15} /> Add Medicine
            </button>
          )}
        </div>
      </div>

      {/* ── Quick Stats ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:16 }}>
        {[
          { l:'All',          v:stats.totalMedicines,   c:'#6366f1', fn:() => { setFStk('All');setFCat('All');setFSch('All');setFExp('All'); } },
          { l:'Out of Stock', v:stats.outOfStock,       c:'#ef4444', fn:() => setFStk('out')     },
          { l:'Low Stock',    v:stats.lowStock,         c:'#f59e0b', fn:() => setFStk('low')     },
          { l:'Expiring <30d',v:stats.expiringIn30Days, c:'#f97316', fn:() => setFExp('30')      },
          { l:'Expired',      v:stats.expired,          c:'#ef4444', fn:() => setFExp('expired') },
        ].map(x => (
          <button key={x.l} onClick={x.fn} style={{
            padding:'10px 14px', background:'rgba(255,255,255,0.03)',
            border:`1px solid ${x.v>0?x.c+'33':'rgba(255,255,255,0.06)'}`,
            borderRadius:11, cursor:'pointer', textAlign:'left', transition:'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.transform='translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.transform='translateY(0)'; }}>
            <div style={{ fontSize:21, fontWeight:900, color:x.v>0?x.c:'#475569' }}>{x.v}</div>
            <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>{x.l}</div>
          </button>
        ))}
      </div>

      {/* ── Search + Filters ── */}
      <div style={{ background:'#0a1122', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:16, marginBottom:16 }}>
        <div style={{ position:'relative' }}>
          <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#475569' }} />
          <input placeholder="Search name, generic, batch no., HSN, manufacturer, rack..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...iStyle, paddingLeft:36, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}
            onFocus={e => { e.target.style.borderColor='rgba(16,185,129,0.4)'; e.target.style.boxShadow='0 0 0 3px rgba(16,185,129,0.08)'; }}
            onBlur={e  => { e.target.style.borderColor='rgba(255,255,255,0.07)'; e.target.style.boxShadow='none'; }}
          />
        </div>
        {showFilters && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginTop:14 }}>
            {[
              { label:'Dosage Form',  v:fCat, fn:setFCat, opts:['All',...new Set(medicines.map(m=>m.category))] },
              { label:'Schedule',     v:fSch, fn:setFSch, opts:['All',...SCHEDULES] },
              { label:'Stock Status', v:fStk, fn:setFStk, opts:['All','good','low','out'] },
              { label:'Expiry', v:fExp, fn:setFExp, opts:[{v:'All',l:'All Expiry'},{v:'30',l:'<30 Days'},{v:'90',l:'<90 Days'},{v:'expired',l:'Expired'}] },
            ].map(f => (
              <div key={f.label}>
                <div style={{ fontSize:10, color:'#475569', marginBottom:6, fontWeight:700, letterSpacing:0.5 }}>{f.label}</div>
                <select value={f.v} onChange={e => f.fn(e.target.value)} style={sStyle}>
                  {f.opts.map(o => typeof o==='object'
                    ? <option key={o.v} value={o.v}>{o.l}</option>
                    : <option key={o} value={o}>{o}</option>
                  )}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div style={{ background:'#0a1122', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:1080 }}>
            <thead>
              <tr style={{ background:'rgba(255,255,255,0.02)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                {COLS.map(h => (
                  <th key={h.l} onClick={() => h.f && toggleSort(h.f)} style={{
                    padding:'11px 14px', textAlign:'left', fontSize:10, color:'#475569',
                    fontWeight:700, letterSpacing:0.8, textTransform:'uppercase',
                    whiteSpace:'nowrap', cursor:h.f?'pointer':'default',
                    userSelect:'none', minWidth:h.w, position:'sticky', top:0,
                    background:'#0a1122', zIndex:1,
                  }}>
                    <span style={{ display:'flex', alignItems:'center' }}>
                      {h.l}{h.f && <SortIco f={h.f} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign:'center', padding:52, color:'#475569' }}>
                    <Pill size={36} color="#1e293b" style={{ display:'block', margin:'0 auto 12px' }} />
                    <div style={{ fontSize:15, fontWeight:600, color:'#334155', marginBottom:4 }}>No medicines found</div>
                    <div style={{ fontSize:12 }}>Try adjusting your search or filters</div>
                  </td>
                </tr>
              )}
              {filtered.map((m, i) => {
                const days  = getDaysToExpiry(m.expiryDate);
                const expSt = getExpiryStatus(m.expiryDate);
                const stkSt = getStockStatus(m);
                const sc    = SCHED[m.schedule] || { c:'#64748b', bg:'rgba(100,116,139,0.1)', b:'transparent' };
                const ec    = EXP[expSt];
                const sk    = STK[stkSt];
                const mgn   = m.purchasePrice > 0
                  ? (((m.sellingPrice - m.purchasePrice) / m.purchasePrice) * 100).toFixed(0)
                  : 0;
                const isHov = hovRow === m.id;

                return (
                  <tr key={m.id}
                    onMouseEnter={() => setHovRow(m.id)}
                    onMouseLeave={() => setHovRow(null)}
                    style={{
                      borderBottom:'1px solid rgba(255,255,255,0.03)',
                      background: isHov ? 'rgba(255,255,255,0.04)' : i%2===0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                      transition:'background 0.15s',
                    }}>
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#f0f4ff' }}>{m.name}</div>
                      <div style={{ fontSize:11, color:'#64748b', marginTop:1 }}>{m.genericName}</div>
                      <div style={{ fontSize:10, color:'#475569' }}>{m.manufacturer}</div>
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ fontSize:10, color:'#94a3b8', fontFamily:'monospace', letterSpacing:0.3 }}>{m.batchNumber}</div>
                      <div style={{ fontSize:11, color:ec, fontWeight:700, marginTop:2 }}>
                        {new Date(m.expiryDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'})}
                      </div>
                      <div style={{ fontSize:10, background:`${ec}18`, color:ec, padding:'1px 6px', borderRadius:4, display:'inline-block', marginTop:2, fontWeight:700 }}>
                        {days < 0 ? 'EXPIRED' : `${days}d left`}
                      </div>
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      <span style={{ fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:7, background:sc.bg, color:sc.c, border:`1px solid ${sc.b}` }}>
                        {m.schedule}
                      </span>
                      {m.requiresPrescription && <div style={{ fontSize:9, color:'#64748b', marginTop:4 }}>Rx Required</div>}
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ fontSize:16, fontWeight:900, color:sk.c }}>{m.stockQty}</div>
                      <span style={{ fontSize:10, fontWeight:700, padding:'1px 7px', borderRadius:5, background:`${sk.c}18`, color:sk.c, display:'inline-block' }}>{sk.l}</span>
                      <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>Min:{m.reorderLevel}</div>
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ fontSize:14, fontWeight:800, color:'#f0f4ff' }}>₹{m.mrp}</div>
                      <div style={{ fontSize:10, color:'#475569' }}>₹{m.sellingPrice} sell</div>
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      {/* ✅ Customer ko margin nahi dikhega (financial data hide) */}
                      {isAdmin ? (
                        <span style={{ fontSize:12, fontWeight:800, color:+mgn>30?'#10b981':+mgn>15?'#f59e0b':'#ef4444' }}>
                          {mgn}%
                        </span>
                      ) : (
                        <span style={{ fontSize:11, color:'#334155' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding:'11px 14px', fontSize:11, color:'#94a3b8' }}>{m.rackLocation || '—'}</td>
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ display:'flex', gap:5, alignItems:'center' }}>

                        {/* Sell Button — Sell sirf admin karta hai, customer nahi */}
                        {isAdmin && (
                          <button
                            onClick={() => { setSellMed(m); setSellQty(''); setSellPatient(''); }}
                            disabled={m.stockQty === 0}
                            style={{
                              display:'flex', alignItems:'center', gap:5,
                              padding:'5px 11px', borderRadius:8, border:'none',
                              cursor: m.stockQty === 0 ? 'not-allowed' : 'pointer',
                              fontSize:11, fontWeight:700,
                              background: m.stockQty === 0 ? 'rgba(100,116,139,0.1)' : 'rgba(16,185,129,0.15)',
                              color: m.stockQty === 0 ? '#334155' : '#10b981',
                              transition:'all 0.18s', opacity: m.stockQty === 0 ? 0.5 : 1,
                            }}
                            onMouseEnter={e => { if(m.stockQty>0){ e.currentTarget.style.background='#10b981'; e.currentTarget.style.color='white'; e.currentTarget.style.boxShadow='0 4px 12px rgba(16,185,129,0.4)'; e.currentTarget.style.transform='scale(1.05)'; }}}
                            onMouseLeave={e => { e.currentTarget.style.background=m.stockQty===0?'rgba(100,116,139,0.1)':'rgba(16,185,129,0.15)'; e.currentTarget.style.color=m.stockQty===0?'#334155':'#10b981'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='scale(1)'; }}>
                            💊 Sell
                          </button>
                        )}

                        {/* Restock — sirf Admin */}
                        {isAdmin && (
                          <button
                            onClick={() => { setRestock(m); setRstQty(''); }}
                            style={{ width:30, height:30, borderRadius:8, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(59,130,246,0.15)', color:'#3b82f6', transition:'all 0.18s' }}
                            title="Restock"
                            onMouseEnter={e => { e.currentTarget.style.background='#3b82f6'; e.currentTarget.style.color='white'; e.currentTarget.style.transform='scale(1.1)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(59,130,246,0.4)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background='rgba(59,130,246,0.15)'; e.currentTarget.style.color='#3b82f6'; e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='none'; }}>
                            <RefreshCw size={13} />
                          </button>
                        )}

                        {/* View — Sabko dikhega (Admin aur Customer dono) */}
                        <button onClick={() => setViewMed(m)}
                          style={{ width:30, height:30, borderRadius:8, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(99,102,241,0.15)', color:'#6366f1', transition:'all 0.18s' }}
                          title="View Details"
                          onMouseEnter={e => { e.currentTarget.style.background='#6366f1'; e.currentTarget.style.color='white'; e.currentTarget.style.transform='scale(1.1)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background='rgba(99,102,241,0.15)'; e.currentTarget.style.color='#6366f1'; e.currentTarget.style.transform='scale(1)'; }}>
                          <Eye size={13} />
                        </button>

                        {/* ✅ Edit — SIRF ADMIN */}
                        {isAdmin && (
                          <button onClick={() => openEdit(m)}
                            style={{ width:30, height:30, borderRadius:8, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(245,158,11,0.15)', color:'#f59e0b', transition:'all 0.18s' }}
                            title="Edit"
                            onMouseEnter={e => { e.currentTarget.style.background='#f59e0b'; e.currentTarget.style.color='white'; e.currentTarget.style.transform='scale(1.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background='rgba(245,158,11,0.15)'; e.currentTarget.style.color='#f59e0b'; e.currentTarget.style.transform='scale(1)'; }}>
                            <Edit2 size={13} />
                          </button>
                        )}

                        {/* ✅ Delete — SIRF ADMIN */}
                        {isAdmin && (
                          <button onClick={() => setDelMed(m)}
                            style={{ width:30, height:30, borderRadius:8, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(239,68,68,0.12)', color:'#ef4444', transition:'all 0.18s' }}
                            title="Delete"
                            onMouseEnter={e => { e.currentTarget.style.background='#ef4444'; e.currentTarget.style.color='white'; e.currentTarget.style.transform='scale(1.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background='rgba(239,68,68,0.12)'; e.currentTarget.style.color='#ef4444'; e.currentTarget.style.transform='scale(1)'; }}>
                            <Trash2 size={13} />
                          </button>
                        )}

                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding:'10px 18px', borderTop:'1px solid rgba(255,255,255,0.04)', fontSize:12, color:'#475569', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span>Showing <strong style={{ color:'#94a3b8' }}>{filtered.length}</strong> of <strong style={{ color:'#94a3b8' }}>{medicines.length}</strong> medicines</span>
          {isAdmin && (
            <span>Filtered retail: <strong style={{ color:'#10b981' }}>₹{new Intl.NumberFormat('en-IN').format(Math.round(filtered.reduce((s,m)=>s+m.mrp*m.stockQty,0)))}</strong></span>
          )}
        </div>
      </div>

      {/* ═══ SELL MODAL (Admin only) ═══ */}
      {sellMed && isAdmin && (
        <Overlay>
          <div style={{ background:'#0a1122', border:'1px solid rgba(16,185,129,0.2)', borderRadius:20, padding:28, width:430, boxShadow:'0 25px 80px rgba(0,0,0,0.7)', animation:'scaleIn 0.25s ease' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
              <div>
                <h3 style={{ margin:0, fontSize:18, fontWeight:900, color:'#f0f4ff' }}>💊 Sell Medicine</h3>
                <p style={{ margin:'4px 0 0', fontSize:12, color:'#64748b' }}>Record a sale from your inventory</p>
              </div>
              <button onClick={() => setSellMed(null)} style={{ background:'rgba(255,255,255,0.07)', border:'none', borderRadius:8, width:34, height:34, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <X size={16} color="#94a3b8" />
              </button>
            </div>
            <div style={{ padding:'14px 16px', background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.15)', borderRadius:13, marginBottom:20 }}>
              <div style={{ fontSize:15, fontWeight:800, color:'#f0f4ff', marginBottom:4 }}>{sellMed.name}</div>
              <div style={{ fontSize:12, color:'#64748b', marginBottom:10 }}>{sellMed.genericName} · {sellMed.category}</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                {[
                  { l:'In Stock',   v:`${sellMed.stockQty} units`, c:'#10b981' },
                  { l:'Sell Price', v:`₹${sellMed.sellingPrice}`,  c:'#f59e0b' },
                  { l:'MRP',        v:`₹${sellMed.mrp}`,           c:'#6366f1' },
                ].map(x => (
                  <div key={x.l} style={{ textAlign:'center', padding:'8px', background:'rgba(255,255,255,0.04)', borderRadius:9 }}>
                    <div style={{ fontSize:14, fontWeight:900, color:x.c }}>{x.v}</div>
                    <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>{x.l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ fontSize:11, color:'#94a3b8', fontWeight:700, display:'block', marginBottom:6 }}>Quantity to Sell *</label>
                <Inp type="number" min="1" max={sellMed.stockQty} value={sellQty} onChange={e => setSellQty(e.target.value)} placeholder={`Max: ${sellMed.stockQty} units`} />
              </div>
              <div>
                <label style={{ fontSize:11, color:'#94a3b8', fontWeight:700, display:'block', marginBottom:6 }}>Patient Name <span style={{ color:'#475569', fontWeight:400 }}>(optional)</span></label>
                <Inp value={sellPatient} onChange={e => setSellPatient(e.target.value)} placeholder="e.g. Ramesh Kumar" />
              </div>
            </div>
            {sellQty && Number(sellQty) > 0 && Number(sellQty) <= sellMed.stockQty && (
              <div style={{ marginTop:16, padding:14, background:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:12 }}>
                <div style={{ fontSize:11, color:'#64748b', marginBottom:8, fontWeight:700 }}>📋 Sale Summary</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[
                    { l:'Units',      v:`${Number(sellQty)} units`,                                                                   c:'#94a3b8' },
                    { l:'Revenue',    v:`₹${(sellMed.sellingPrice * Number(sellQty)).toFixed(0)}`,                                    c:'#10b981' },
                    { l:'GST Amt',    v:`₹${(sellMed.sellingPrice * Number(sellQty) * sellMed.gstRate / 100).toFixed(0)}`,            c:'#f59e0b' },
                    { l:'Your Profit',v:`₹${((sellMed.sellingPrice - sellMed.purchasePrice) * Number(sellQty)).toFixed(0)}`,          c:'#6366f1' },
                  ].map(x => (
                    <div key={x.l}><span style={{ fontSize:11, color:'#64748b' }}>{x.l}: </span><strong style={{ fontSize:13, color:x.c }}>{x.v}</strong></div>
                  ))}
                </div>
                <div style={{ marginTop:10, fontSize:12, color:'#64748b' }}>
                  Remaining stock: <strong style={{ color: sellMed.stockQty - Number(sellQty) <= sellMed.reorderLevel ? '#f59e0b' : '#10b981' }}>{sellMed.stockQty - Number(sellQty)} units</strong>
                  {sellMed.stockQty - Number(sellQty) <= sellMed.reorderLevel && <span style={{ color:'#f59e0b', marginLeft:8 }}>⚠ Low stock alert!</span>}
                </div>
              </div>
            )}
            {sellQty && Number(sellQty) > sellMed.stockQty && (
              <div style={{ marginTop:14, padding:12, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:10, fontSize:13, color:'#ef4444', fontWeight:700 }}>
                ⚠ Cannot sell {sellQty} units — only {sellMed.stockQty} in stock!
              </div>
            )}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}>
              <button onClick={() => setSellMed(null)} style={{ padding:'10px 20px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#94a3b8', cursor:'pointer', fontSize:13, fontWeight:600 }}>Cancel</button>
              <button onClick={doSell} disabled={!sellQty || Number(sellQty) <= 0 || Number(sellQty) > sellMed.stockQty}
                style={{ padding:'10px 24px', background:(!sellQty || Number(sellQty) <= 0 || Number(sellQty) > sellMed.stockQty)?'rgba(16,185,129,0.3)':'linear-gradient(135deg,#10b981,#059669)', border:'none', borderRadius:10, color:'white', cursor:'pointer', fontSize:13, fontWeight:800, boxShadow:'0 4px 15px rgba(16,185,129,0.3)', transition:'all 0.2s' }}>
                ✅ Confirm Sale
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ═══ ADD / EDIT MODAL (Admin only) ═══ */}
      {modal && isAdmin && (
        <Overlay>
          <div style={{ background:'#0a1122', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, width:'100%', maxWidth:780, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 25px 80px rgba(0,0,0,0.7)', animation:'scaleIn 0.25s ease' }}>
            <div style={{ padding:'22px 26px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
              <div>
                <h2 style={{ margin:0, fontSize:18, fontWeight:900, color:'#f0f4ff' }}>{editId ? '✏️ Edit Medicine' : '➕ Add New Medicine'}</h2>
                <p style={{ margin:'4px 0 0', fontSize:12, color:'#64748b' }}>All fields marked * are mandatory</p>
              </div>
              <button onClick={() => setModal(false)} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9, width:36, height:36, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <X size={16} color="#94a3b8" />
              </button>
            </div>
            <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0, padding:'0 4px' }}>
              {FORM_TABS.map(t => (
                <button key={t.k} onClick={() => setTab(t.k)} style={{ padding:'12px 18px', background:'none', border:'none', cursor:'pointer', fontSize:12, fontWeight:tab===t.k?700:500, color:tab===t.k?'#10b981':'#64748b', borderBottom:`2px solid ${tab===t.k?'#10b981':'transparent'}`, transition:'all 0.15s', whiteSpace:'nowrap' }}>
                  {t.l}
                </button>
              ))}
            </div>
            <div style={{ padding:24, overflowY:'auto', flex:1 }}>
              {tab === 'basic' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div style={{ gridColumn:'1/-1' }}>
                    <FG label="Brand / Trade Name" req error={errors.name}>
                      <Inp value={form.name} onChange={e=>upd('name',e.target.value)} error={errors.name} placeholder="e.g. Paracetamol 500mg"/>
                    </FG>
                  </div>
                  <FG label="Generic / INN Name" req error={errors.genericName}>
                    <Inp value={form.genericName} onChange={e=>upd('genericName',e.target.value)} error={errors.genericName} placeholder="e.g. Paracetamol"/>
                  </FG>
                  <FG label="Dosage Form" req>
                    <Sel value={form.category} onChange={e=>upd('category',e.target.value)}>{MEDICINE_CATEGORIES.map(o=><option key={o}>{o}</option>)}</Sel>
                  </FG>
                  <FG label="Manufacturer" req error={errors.manufacturer}>
                    <Sel value={form.manufacturer} onChange={e=>upd('manufacturer',e.target.value)}>
                      <option value="">-- Select Manufacturer --</option>
                      {MANUFACTURERS.map(o=><option key={o}>{o}</option>)}
                    </Sel>
                  </FG>
                  <FG label="Supplier / Distributor">
                    <Sel value={form.supplier} onChange={e=>upd('supplier',e.target.value)}>
                      <option value="">-- Select Supplier --</option>
                      {SUPPLIERS.map(o=><option key={o}>{o}</option>)}
                    </Sel>
                  </FG>
                  <FG label="Therapeutic Class" req>
                    <Sel value={form.therapeuticClass} onChange={e=>upd('therapeuticClass',e.target.value)}>{THERAPEUTIC_CLASSES.map(o=><option key={o}>{o}</option>)}</Sel>
                  </FG>
                  <div style={{ gridColumn:'1/-1' }}>
                    <FG label="Description">
                      <textarea value={form.description} onChange={e=>upd('description',e.target.value)} rows={2} placeholder="Brief pharmacological description..." style={{ ...iStyle, resize:'vertical', lineHeight:1.5 }}/>
                    </FG>
                  </div>
                </div>
              )}
              {tab === 'pricing' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <FG label="MRP (₹)" req error={errors.mrp}><Inp type="number" min="0" step="0.01" value={form.mrp} onChange={e=>upd('mrp',e.target.value)} error={errors.mrp} placeholder="0.00"/></FG>
                  <FG label="Purchase Price (₹)" req error={errors.purchasePrice}><Inp type="number" min="0" step="0.01" value={form.purchasePrice} onChange={e=>upd('purchasePrice',e.target.value)} error={errors.purchasePrice} placeholder="0.00"/></FG>
                  <FG label="Selling Price (₹)" req error={errors.sellingPrice}><Inp type="number" min="0" step="0.01" value={form.sellingPrice} onChange={e=>upd('sellingPrice',e.target.value)} error={errors.sellingPrice} placeholder="0.00"/></FG>
                  <FG label="HSN / SAC Code"><Inp value={form.hsnCode} onChange={e=>upd('hsnCode',e.target.value)} placeholder="e.g. 30049099"/></FG>
                  <FG label="GST Rate">
                    <Sel value={form.gstRate} onChange={e=>upd('gstRate',+e.target.value)}>{GST_RATES.map(r=><option key={r} value={r}>{r}% GST</option>)}</Sel>
                  </FG>
                  {margin !== null && (
                    <div style={{ padding:16, background:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:12 }}>
                      <div style={{ fontSize:11, color:'#64748b', marginBottom:6 }}>💹 Gross Margin Preview</div>
                      <div style={{ fontSize:28, fontWeight:900, color:+margin>20?'#10b981':+margin>0?'#f59e0b':'#ef4444' }}>{margin}%</div>
                      <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>₹{(+form.sellingPrice - +form.purchasePrice).toFixed(2)} profit / unit</div>
                    </div>
                  )}
                </div>
              )}
              {tab === 'inventory' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <FG label="Current Stock (Units)" req error={errors.stockQty}><Inp type="number" min="0" value={form.stockQty} onChange={e=>upd('stockQty',e.target.value)} error={errors.stockQty} placeholder="0"/></FG>
                  <FG label="Reorder Level (Units)" req error={errors.reorderLevel}><Inp type="number" min="0" value={form.reorderLevel} onChange={e=>upd('reorderLevel',e.target.value)} error={errors.reorderLevel} placeholder="0"/></FG>
                  <FG label="Pack Size"><Inp value={form.packSize} onChange={e=>upd('packSize',e.target.value)} placeholder="e.g. 10 tablets/strip"/></FG>
                  <FG label="Rack / Bin Location"><Inp value={form.rackLocation} onChange={e=>upd('rackLocation',e.target.value)} placeholder="e.g. A-1-01"/></FG>
                  <div style={{ gridColumn:'1/-1' }}>
                    <FG label="Storage Condition">
                      <Sel value={form.storageCondition} onChange={e=>upd('storageCondition',e.target.value)}>{STORAGE_CONDITIONS.map(o=><option key={o}>{o}</option>)}</Sel>
                    </FG>
                  </div>
                </div>
              )}
              {tab === 'compliance' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <FG label="Drug Schedule" req>
                    <Sel value={form.schedule} onChange={e=>upd('schedule',e.target.value)}>{SCHEDULES.map(o=><option key={o}>{o}</option>)}</Sel>
                  </FG>
                  <FG label="Batch Number" req error={errors.batchNumber}><Inp value={form.batchNumber} onChange={e=>upd('batchNumber',e.target.value)} error={errors.batchNumber} placeholder="e.g. MFR-B2025-0001"/></FG>
                  <FG label="Manufacturing Date"><Inp type="date" value={form.manufacturingDate} onChange={e=>upd('manufacturingDate',e.target.value)}/></FG>
                  <FG label="Expiry Date" req error={errors.expiryDate}><Inp type="date" value={form.expiryDate} onChange={e=>upd('expiryDate',e.target.value)} error={errors.expiryDate}/></FG>
                  <div style={{ gridColumn:'1/-1' }}>
                    <FG label="Requires Prescription?">
                      <div style={{ display:'flex', gap:20, marginTop:6 }}>
                        {[['Yes',true],['No',false]].map(([l,v])=>(
                          <label key={l} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                            <input type="radio" name="rx" checked={form.requiresPrescription===v} onChange={()=>upd('requiresPrescription',v)} style={{ accentColor:'#10b981', width:16, height:16 }}/>
                            <span style={{ fontSize:14, color:'#94a3b8' }}>{l}</span>
                          </label>
                        ))}
                      </div>
                    </FG>
                  </div>
                  {form.schedule==='Schedule X' && (
                    <div style={{ gridColumn:'1/-1', padding:16, background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.3)', borderRadius:12 }}>
                      <div style={{ fontSize:13, fontWeight:800, color:'#8b5cf6', marginBottom:6 }}>⚠️ NDPS Act — Schedule X</div>
                      <div style={{ fontSize:12, color:'#94a3b8', lineHeight:1.6 }}>Maintain separate narcotic register. Store in locked cupboard. Sale only against valid written prescription.</div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={{ padding:'16px 26px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
              <div style={{ fontSize:11, color:'#475569' }}>
                {Object.keys(errors).length > 0 && <span style={{ color:'#ef4444' }}>⚠ Fix {Object.keys(errors).length} error(s)</span>}
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={()=>setModal(false)} style={{ padding:'9px 20px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#94a3b8', cursor:'pointer', fontSize:13, fontWeight:600 }}>Cancel</button>
                <button onClick={save} style={{ padding:'9px 24px', background:'linear-gradient(135deg,#10b981,#059669)', border:'none', borderRadius:10, color:'white', cursor:'pointer', fontSize:13, fontWeight:800, boxShadow:'0 4px 15px rgba(16,185,129,0.3)', transition:'all 0.2s' }}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 8px 25px rgba(16,185,129,0.4)';}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 4px 15px rgba(16,185,129,0.3)';}}>
                  {editId ? '💾 Update' : '✅ Save Medicine'}
                </button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {/* ═══ VIEW MODAL (Admin + Customer dono dekh sakte hain) ═══ */}
      {viewMed && (
        <Overlay>
          <div style={{ background:'#0a1122', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, width:'100%', maxWidth:620, maxHeight:'88vh', display:'flex', flexDirection:'column', boxShadow:'0 25px 80px rgba(0,0,0,0.7)', animation:'scaleIn 0.25s ease' }}>
            <div style={{ padding:'20px 24px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:42, height:42, borderRadius:13, background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Pill size={20} color="#10b981"/>
                </div>
                <div>
                  <h2 style={{ margin:0, fontSize:16, fontWeight:800, color:'#f0f4ff' }}>{viewMed.name}</h2>
                  <p style={{ margin:0, fontSize:11, color:'#64748b' }}>{viewMed.genericName} · {viewMed.id}</p>
                </div>
              </div>
              <button onClick={()=>setViewMed(null)} style={{ background:'rgba(255,255,255,0.07)', border:'none', borderRadius:8, width:34, height:34, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <X size={16} color="#94a3b8"/>
              </button>
            </div>
            <div style={{ padding:24, overflowY:'auto', flex:1 }}>
              {[
                { s:'🏭 Manufacturer', rows:[['Manufacturer',viewMed.manufacturer],['Supplier',viewMed.supplier||'—'],['Batch No.',viewMed.batchNumber],['Pack Size',viewMed.packSize||'—']] },
                { s:'💊 Classification', rows:[['Category',viewMed.category],['Therapeutic Class',viewMed.therapeuticClass],['Schedule',viewMed.schedule],['Rx Required',viewMed.requiresPrescription?'Yes':'No']] },
                { s:'📅 Dates', rows:[['Mfg Date',viewMed.manufacturingDate?new Date(viewMed.manufacturingDate).toLocaleDateString('en-IN'):'—'],['Expiry',new Date(viewMed.expiryDate).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})],['Days Left',getDaysToExpiry(viewMed.expiryDate)<0?'EXPIRED':getDaysToExpiry(viewMed.expiryDate)+' days'],['Storage',viewMed.storageCondition]] },
                { s:'📦 Inventory', rows:[['Stock',`${viewMed.stockQty} units`],['Reorder At',`${viewMed.reorderLevel} units`],['Rack',viewMed.rackLocation||'—']] },
                // ✅ Pricing sirf Admin ko dikhega
                ...(isAdmin ? [{ s:'💰 Pricing', rows:[['MRP',`₹${viewMed.mrp}`],['Purchase',`₹${viewMed.purchasePrice}`],['Selling',`₹${viewMed.sellingPrice}`],['GST',`${viewMed.gstRate}%`],['HSN',viewMed.hsnCode||'—'],['Margin',viewMed.purchasePrice>0?`${(((viewMed.sellingPrice-viewMed.purchasePrice)/viewMed.purchasePrice)*100).toFixed(1)}%`:'—']] }] : [{ s:'💰 Price', rows:[['MRP',`₹${viewMed.mrp}`]] }]),
              ].map(({ s, rows }) => (
                <div key={s} style={{ marginBottom:18 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#64748b', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5 }}>{s}</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
                    {rows.map(([k,v]) => (
                      <div key={k} style={{ padding:'9px 12px', background:'rgba(255,255,255,0.03)', borderRadius:9, border:'1px solid rgba(255,255,255,0.05)', transition:'all 0.2s', cursor:'default' }}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.06)'}
                        onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}>
                        <div style={{ fontSize:10, color:'#64748b', marginBottom:2 }}>{k}</div>
                        <div style={{ fontSize:13, fontWeight:600, color:'#e2e8f0' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding:'14px 24px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'flex-end', gap:10 }}>
              {/* Edit button sirf Admin ko */}
              {isAdmin && (
                <button onClick={()=>{setViewMed(null);openEdit(viewMed);}} style={{ padding:'8px 18px', background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:9, color:'#f59e0b', cursor:'pointer', fontSize:13, fontWeight:600, transition:'all 0.2s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(245,158,11,0.25)'}
                  onMouseLeave={e=>e.currentTarget.style.background='rgba(245,158,11,0.15)'}>
                  ✏️ Edit
                </button>
              )}
              <button onClick={()=>setViewMed(null)} style={{ padding:'8px 18px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9, color:'#94a3b8', cursor:'pointer', fontSize:13, fontWeight:600 }}>Close</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ═══ RESTOCK MODAL (Admin only) ═══ */}
      {restock && isAdmin && (
        <Overlay>
          <div style={{ background:'#0a1122', border:'1px solid rgba(59,130,246,0.2)', borderRadius:18, padding:28, width:430, boxShadow:'0 25px 80px rgba(0,0,0,0.7)', animation:'scaleIn 0.25s ease' }}>
            <h3 style={{ margin:'0 0 6px', color:'#f0f4ff', fontSize:17, fontWeight:900 }}>📦 Quick Restock</h3>
            <p style={{ margin:'0 0 20px', color:'#64748b', fontSize:13 }}>{restock.name}</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:18 }}>
              {[['Current Stock',`${restock.stockQty} units`,'#f0f4ff'],['Reorder Level',`${restock.reorderLevel} units`,'#f59e0b']].map(([l,v,c])=>(
                <div key={l} style={{ padding:'10px 14px', background:'rgba(255,255,255,0.03)', borderRadius:10 }}>
                  <div style={{ fontSize:10, color:'#64748b', marginBottom:4 }}>{l}</div>
                  <div style={{ fontSize:16, fontWeight:800, color:c }}>{v}</div>
                </div>
              ))}
            </div>
            <Inp type="number" min="1" value={rstQty} onChange={e=>setRstQty(e.target.value)} placeholder="Enter quantity to add..."/>
            {rstQty && Number(rstQty) > 0 && (
              <div style={{ marginTop:12, padding:12, background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:9, fontSize:13, color:'#3b82f6', fontWeight:700 }}>
                📦 New total: <strong>{restock.stockQty + Number(rstQty)} units</strong>
              </div>
            )}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}>
              <button onClick={()=>setRestock(null)} style={{ padding:'9px 20px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#94a3b8', cursor:'pointer', fontSize:13 }}>Cancel</button>
              <button onClick={doRestock} style={{ padding:'9px 22px', background:'linear-gradient(135deg,#3b82f6,#2563eb)', border:'none', borderRadius:10, color:'white', cursor:'pointer', fontSize:13, fontWeight:800, boxShadow:'0 4px 15px rgba(59,130,246,0.35)' }}>
                Add Stock
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ═══ DELETE CONFIRM (Admin only) ═══ */}
      {delMed && isAdmin && (
        <Overlay>
          <div style={{ background:'#0a1122', border:'1px solid rgba(239,68,68,0.3)', borderRadius:18, padding:32, width:380, textAlign:'center', boxShadow:'0 25px 80px rgba(0,0,0,0.7)', animation:'scaleIn 0.25s ease' }}>
            <div style={{ fontSize:52, marginBottom:14 }}>🗑️</div>
            <h3 style={{ margin:'0 0 8px', color:'#f0f4ff', fontSize:17, fontWeight:900 }}>Delete Medicine?</h3>
            <p style={{ margin:'0 0 24px', color:'#64748b', fontSize:13, lineHeight:1.7 }}>
              <strong style={{ color:'#e2e8f0' }}>{delMed.name}</strong> will be permanently removed from inventory. This cannot be undone!
            </p>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button onClick={()=>setDelMed(null)} style={{ padding:'9px 22px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#94a3b8', cursor:'pointer', fontSize:13, fontWeight:600 }}>Cancel</button>
              <button onClick={()=>{deleteMedicine(delMed.id);setDelMed(null);}} style={{ padding:'9px 22px', background:'linear-gradient(135deg,#ef4444,#dc2626)', border:'none', borderRadius:10, color:'white', cursor:'pointer', fontSize:13, fontWeight:800, boxShadow:'0 4px 15px rgba(239,68,68,0.35)', transition:'all 0.2s' }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 25px rgba(239,68,68,0.45)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 4px 15px rgba(239,68,68,0.35)';}}>
                🗑️ Yes, Delete
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}