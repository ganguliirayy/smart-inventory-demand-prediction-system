// FILE: client/src/context/StoreContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialMedicines } from '../data/medicines';
import { api } from './AuthContext';

const StoreContext = createContext(null);
const MAX_ACT = 50;

const mkAct = (type, message, icon, color, meta = {}) => ({
  id: Date.now() + Math.random(), type, message, icon, color, meta,
  timestamp: new Date().toISOString(),
});

export const StoreProvider = ({ children }) => {
  const [medicines, setMedicines] = useState(() => {
    try { const s = localStorage.getItem('rxflow_v1'); return s ? JSON.parse(s) : initialMedicines; }
    catch { return initialMedicines; }
  });
  const [activities, setActivities] = useState(() => {
    try { const s = localStorage.getItem('rxflow_activities'); return s ? JSON.parse(s) : [
      mkAct('system', 'RxFlow Pro initialized successfully', '🚀', '#10b981'),
      mkAct('system', 'Inventory loaded — 15 medicines ready', '💊', '#6366f1'),
    ]; } catch { return []; }
  });
  const [salesLog, setSalesLog] = useState(() => {
    try { const s = localStorage.getItem('rxflow_sales'); return s ? JSON.parse(s) : []; }
    catch { return []; }
  });

  useEffect(() => { localStorage.setItem('rxflow_v1', JSON.stringify(medicines)); }, [medicines]);
  useEffect(() => { localStorage.setItem('rxflow_activities', JSON.stringify(activities)); }, [activities]);
  useEffect(() => { localStorage.setItem('rxflow_sales', JSON.stringify(salesLog)); }, [salesLog]);

  const addActivity = (type, message, icon, color, meta = {}) => {
    setActivities(prev => [mkAct(type, message, icon, color, meta), ...prev.slice(0, MAX_ACT - 1)]);
  };

  // ── ADD MEDICINE ─────────────────────────────────────────────────────────
  const addMedicine = async (medicine) => {
    const localId = `RX${Date.now().toString().slice(-6)}`;
    const newMed = { ...medicine, id: localId };

    // Instant local update
    setMedicines(prev => [...prev, newMed]);
    addActivity('add', `Added "${medicine.name}" to inventory`, '➕', '#10b981', { medicineId: localId });

    // Background sync to backend
    try {
      const payload = {
        name:         medicine.name,
        genericName:  medicine.genericName || medicine.name,
        manufacturer: medicine.manufacturer || 'Unknown',
        category:     medicine.category     || 'Tablet',
        schedule:     medicine.schedule     || 'OTC',
        batchNumber:  medicine.batchNumber  || `BN-${Date.now()}`,
        expiryDate:   medicine.expiryDate,
        mrp:           parseFloat(medicine.mrp)           || 0,
        purchasePrice: parseFloat(medicine.purchasePrice) || 0,
        sellingPrice:  parseFloat(medicine.sellingPrice)  || 0,
        stockQty:      parseInt(medicine.stockQty)        || 0,
        reorderLevel:  parseInt(medicine.reorderLevel)    || 10,
        storageCondition: medicine.storageCondition || 'Room Temperature (15-30°C)',
        requiresPrescription: !!medicine.requiresPrescription,
      };
      const res = await api.post('/medicines', payload);
      if (res.data?.success && res.data?.data?._id) {
        const bid = res.data.data._id;
        // Store backend _id for later PUT/DELETE
        setMedicines(prev => prev.map(m => m.id === localId ? { ...m, _backendId: bid } : m));
        const stored = JSON.parse(localStorage.getItem('rxflow_v1') || '[]');
        localStorage.setItem('rxflow_v1', JSON.stringify(
          stored.map(m => m.id === localId ? { ...m, _backendId: bid } : m)
        ));
      }
    } catch (_) {
      // Server unavailable — data safe in localStorage
    }

    return newMed;
  };

  // ── UPDATE MEDICINE ──────────────────────────────────────────────────────
  const updateMedicine = async (id, updates) => {
    const med = medicines.find(m => m.id === id);
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    if (med && updates.stockQty !== undefined && updates.stockQty > med.stockQty)
      addActivity('restock', `Restocked "${med.name}" +${updates.stockQty - med.stockQty} units`, '📦', '#6366f1', { medicineId: id });

    if (med?._backendId) {
      try {
        const numF = ['mrp','purchasePrice','sellingPrice','stockQty','reorderLevel'];
        const payload = {};
        Object.entries(updates).forEach(([k, v]) => {
          payload[k] = numF.includes(k) ? (parseFloat(v) || 0) : v;
        });
        await api.put(`/medicines/${med._backendId}`, payload);
      } catch (_) {}
    }
  };

  // ── DELETE MEDICINE ──────────────────────────────────────────────────────
  const deleteMedicine = async (id) => {
    const med = medicines.find(m => m.id === id);
    setMedicines(prev => prev.filter(m => m.id !== id));
    if (med) addActivity('delete', `Removed "${med.name}" from inventory`, '🗑️', '#ef4444', { medicineId: id });
    if (med?._backendId) {
      try { await api.delete(`/medicines/${med._backendId}`); } catch (_) {}
    }
  };

  // ── SELL MEDICINE ────────────────────────────────────────────────────────
  const sellMedicine = async (id, qty, patientName = '') => {
    const med = medicines.find(m => m.id === id);
    if (!med || med.stockQty < qty) return false;

    const revenue = med.sellingPrice * qty;
    const profit  = (med.sellingPrice - med.purchasePrice) * qty;

    setMedicines(prev => prev.map(m => m.id === id ? { ...m, stockQty: m.stockQty - qty } : m));
    const sale = { id: Date.now(), medicineId: id, medicineName: med.name, qty, revenue, profit, patientName, timestamp: new Date().toISOString() };
    setSalesLog(prev => [sale, ...prev.slice(0, 199)]);
    addActivity('sell', `Sold ${qty}× "${med.name}"${patientName ? ` to ${patientName}` : ''} — ₹${revenue.toFixed(0)}`, '💰', '#f59e0b', { medicineId: id, revenue, profit });
    if (med.stockQty - qty <= med.reorderLevel)
      addActivity('alert', `Low stock alert: "${med.name}" needs reorder`, '⚠️', '#ef4444', { medicineId: id });

    if (med._backendId) {
      try { await api.post('/sales', { medicineId: med._backendId, qty: parseInt(qty), patientName: patientName || '' }); }
      catch (_) {}
    }
    return true;
  };

  const clearActivities = () => setActivities([]);
  const getDaysToExpiry  = (d) => Math.ceil((new Date(d) - new Date()) / 86400000);
  const getExpiryStatus  = (d) => {
    const n = getDaysToExpiry(d);
    if (n < 0) return 'expired'; if (n <= 30) return 'critical';
    if (n <= 90) return 'warning'; if (n <= 180) return 'caution'; return 'good';
  };
  const getStockStatus = (m) => m.stockQty === 0 ? 'out' : m.stockQty <= m.reorderLevel ? 'low' : 'good';

  const todaySales = salesLog.filter(s => new Date(s.timestamp).toDateString() === new Date().toDateString());

  const stats = {
    totalMedicines:       medicines.length,
    totalInventoryValue:  medicines.reduce((s, m) => s + m.purchasePrice * m.stockQty, 0),
    totalRetailValue:     medicines.reduce((s, m) => s + m.mrp * m.stockQty, 0),
    grossProfitPotential: medicines.reduce((s, m) => s + (m.sellingPrice - m.purchasePrice) * m.stockQty, 0),
    outOfStock:           medicines.filter(m => m.stockQty === 0).length,
    lowStock:             medicines.filter(m => m.stockQty > 0 && m.stockQty <= m.reorderLevel).length,
    expiringIn30Days:     medicines.filter(m => { const d = getDaysToExpiry(m.expiryDate); return d >= 0 && d <= 30; }).length,
    expiringIn90Days:     medicines.filter(m => { const d = getDaysToExpiry(m.expiryDate); return d >= 0 && d <= 90; }).length,
    expired:              medicines.filter(m => getDaysToExpiry(m.expiryDate) < 0).length,
    scheduleXCount:       medicines.filter(m => m.schedule === 'Schedule X').length,
    todayRevenue:         todaySales.reduce((s, x) => s + x.revenue, 0),
    todayProfit:          todaySales.reduce((s, x) => s + x.profit, 0),
    todaySalesCount:      todaySales.length,
    totalSalesCount:      salesLog.length,
  };

  return (
    <StoreContext.Provider value={{
      medicines, stats, activities, salesLog,
      addMedicine, updateMedicine, deleteMedicine, sellMedicine,
      addActivity, clearActivities, getDaysToExpiry, getExpiryStatus, getStockStatus,
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
};