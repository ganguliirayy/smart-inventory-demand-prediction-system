// FILE: client/src/context/StoreContext.jsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, useAuth } from './AuthContext';

const StoreContext = createContext(null);

export const StoreProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [activities, setActivities] = useState([]);
  const [salesLog, setSalesLog] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('[fetchData] Fetching store data from API...');
      const [medsRes, actsRes, salesRes] = await Promise.all([
        api.get('/medicines?limit=1000'),
        api.get('/activities?limit=100'),
        api.get('/sales?limit=200')
      ]);

      console.log('[fetchData] Medicines raw response:', medsRes);

      if (medsRes.data?.success) {
        console.log('[fetchData] Received medicines count:', medsRes.data.data.length);
        setMedicines(medsRes.data.data.map(m => ({ 
          ...m, 
          id: m._id,
          name: m.name || 'Unknown',
          stockQty: m.stockQty ?? m.stock ?? 0,
          mrp: m.mrp ?? m.price ?? 0,
          purchasePrice: m.purchasePrice ?? m.price ?? 0,
          sellingPrice: m.sellingPrice ?? m.price ?? 0,
          category: m.category || 'General',
          expiryDate: m.expiryDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
        })));
      } else {
        console.error('[fetchData] Medicines fetch error or unexpected format:', medsRes.data);
      }

      if (actsRes.data?.success) {
        setActivities(actsRes.data.data.map(a => ({ ...a, id: a._id, timestamp: a.createdAt })));
      }
      if (salesRes.data?.success) {
        setSalesLog(salesRes.data.data.map(s => ({
          ...s, id: s._id, timestamp: s.soldAt, medicineId: s.medicine
        })));
      }
    } catch (err) {
      console.error('[fetchData] Error while fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    } else {
      setMedicines([]);
      setActivities([]);
      setSalesLog([]);
    }
  }, [isAuthenticated, fetchData]);

  const addActivityLocal = (type, message, icon, color, meta = {}) => {
    setActivities(prev => [{
      id: Date.now().toString(), type, message, icon, color, meta, timestamp: new Date().toISOString()
    }, ...prev]);
  };

  // ── ADD MEDICINE ─────────────────────────────────────────────────────────
  const addMedicine = async (medicine) => {
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
      if (res.data?.success && res.data?.data) {
        const newMed = { ...res.data.data, id: res.data.data._id };
        setMedicines(prev => [...prev, newMed]);
        fetchData(); // Refresh DB data mapping
        return newMed;
      }
    } catch (err) {
      console.error('Add medicine failed:', err);
    }
    return null;
  };

  // ── UPDATE MEDICINE ──────────────────────────────────────────────────────
  const updateMedicine = async (id, updates) => {
    try {
      const numF = ['mrp','purchasePrice','sellingPrice','stockQty','reorderLevel'];
      const payload = {};
      Object.entries(updates).forEach(([k, v]) => {
        payload[k] = numF.includes(k) ? (parseFloat(v) || 0) : v;
      });
      const res = await api.put(`/medicines/${id}`, payload);
      if (res.data?.success) {
        setMedicines(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
        fetchData(); // Fetch full fresh activities and stats
      }
    } catch (err) {
      console.error('Update medicine failed:', err);
    }
  };

  // ── DELETE MEDICINE ──────────────────────────────────────────────────────
  const deleteMedicine = async (id) => {
    try {
      const res = await api.delete(`/medicines/${id}`);
      if (res.data?.success) {
        setMedicines(prev => prev.filter(m => m.id !== id));
        fetchData();
      }
    } catch (err) {
      console.error('Delete medicine failed:', err);
    }
  };

  // ── SELL MEDICINE ────────────────────────────────────────────────────────
  const sellMedicine = async (id, quantity, patientName = '') => {
    try {
      console.log("Sell API call: /api/sales", { medicineId: id, quantity: parseInt(quantity) });
      const res = await api.post('/sales', { medicineId: id, quantity: parseInt(quantity), patientName: patientName || '' });
      console.log("Sell API response:", res);

      if (res.data?.success) {
        // Instant visual update
        setMedicines(prev => prev.map(m => m.id === id ? { ...m, stockQty: m.stockQty - quantity } : m));
        // Refresh full DB context for logs
        await fetchData();
        return true;
      } else {
        console.error("Sell failed:", res.data?.message);
      }
    } catch (err) {
      console.error('Sell medicine failed:', err);
    }
    return false;
  };

  const clearActivities = async () => {
    try {
      await api.delete('/activities/clear');
      setActivities([]);
    } catch (err) {
      console.error('Clear activities failed:', err);
    }
  };

  const getDaysToExpiry = (d) => Math.ceil((new Date(d) - new Date()) / 86400000);
  const getExpiryStatus = (d) => {
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
      medicines, stats, activities, salesLog, loading,
      addMedicine, updateMedicine, deleteMedicine, sellMedicine,
      addActivity: addActivityLocal, clearActivities, getDaysToExpiry, getExpiryStatus, getStockStatus,
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