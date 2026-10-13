import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Award, 
  Activity, 
  Zap, 
  Filter, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  Snowflake, 
  Percent, 
  ArrowDownRight, 
  Calendar, 
  Layers, 
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getJurnal, getMetode, calculateTradeStats } from '../lib/api';

/* ─────────────────────────────────────────────────────────────
   USE CENTRALIZED STATS HELPER
───────────────────────────────────────────────────────────── */
const calculateStats = calculateTradeStats;

export default function Analytics({ dbTrigger, userId }) {
  const [trades, setTrades] = useState([]);
  const [methods, setMethods] = useState([]);

  // ── FILTER STATES ──
  const [dateRange, setDateRange] = useState('all');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterPair, setFilterPair] = useState('');
  const [filterSession, setFilterSession] = useState('');
  const [filterArah, setFilterArah] = useState('');
  const [filterResult, setFilterResult] = useState('');

  useEffect(() => {
    Promise.all([getJurnal(userId), getMetode(userId)]).then(([jData, mData]) => {
      setTrades(jData.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)));
      setMethods(mData);
    });
  }, [dbTrigger, userId]);

  const uniquePairs = useMemo(() => {
    return Array.from(new Set(trades.map(t => t.pair).filter(Boolean)));
  }, [trades]);

  const uniqueSessions = useMemo(() => {
    return Array.from(new Set(trades.map(t => t.sesi).filter(Boolean)));
  }, [trades]);

  const filteredTrades = useMemo(() => {
    const now = new Date();
    return trades.filter(t => {
      if (dateRange !== 'all') {
        if (!t.tanggal) return false;
        const tradeDate = new Date(t.tanggal);
        if (dateRange === '7days') {
          const past7 = new Date(now);
          past7.setDate(past7.getDate() - 7);
          if (tradeDate < past7) return false;
        } else if (dateRange === '30days') {
          const past30 = new Date(now);
          past30.setDate(past30.getDate() - 30);
          if (tradeDate < past30) return false;
        } else if (dateRange === 'this_month') {
          if (tradeDate.getMonth() !== now.getMonth() || tradeDate.getFullYear() !== now.getFullYear()) return false;
        }
      }

      if (filterMethod !== '' && t.metodeId !== filterMethod) return false;
      if (filterPair !== '' && t.pair?.toLowerCase() !== filterPair.toLowerCase()) return false;
      if (filterSession !== '' && t.sesi !== filterSession) return false;
      if (filterArah !== '' && t.arah !== filterArah) return false;
      if (filterResult !== '' && (t.hasilTrade || '').toLowerCase().trim() !== filterResult.toLowerCase().trim()) return false;

      return true;
    });
  }, [trades, dateRange, filterMethod, filterPair, filterSession, filterArah, filterResult]);

  const stats = useMemo(() => calculateStats(filteredTrades), [filteredTrades]);

  const streakStats = useMemo(() => {
    return {
      maxWin: stats.maxWinStreak,
      maxLose: stats.maxLoseStreak,
      maxDD: stats.maxDD
    };
  }, [stats]);

  const recommendations = useMemo(() => {
    if (filteredTrades.length < 3) return null;

    const tagMap = {};
    const comboMap = {};

    filteredTrades.forEach(t => {
      const tags = t.konfirmasiEntry || [];
      if (tags.length > 0) {
        tags.forEach(tag => {
          if (!tagMap[tag]) tagMap[tag] = [];
          tagMap[tag].push(t);
        });

        if (tags.length > 1) {
          const comboKey = [...tags].sort().join(' + ');
          if (!comboMap[comboKey]) comboMap[comboKey] = [];
          comboMap[comboKey].push(t);
        }
      }
    });

    const withSMT = filteredTrades.filter(t => t.konfirmasiEntry?.some(k => k.toLowerCase().includes('smt')));
    const withoutSMT = filteredTrades.filter(t => !t.konfirmasiEntry?.some(k => k.toLowerCase().includes('smt')));
    const smtStatsWith = calculateStats(withSMT);
    const smtStatsWithout = calculateStats(withoutSMT);

    const withCISD = filteredTrades.filter(t => t.konfirmasiEntry?.some(k => k.toLowerCase().includes('cisd')));
    const withoutCISD = filteredTrades.filter(t => !t.konfirmasiEntry?.some(k => k.toLowerCase().includes('cisd')));
    const cisdStatsWith = calculateStats(withCISD);
    const cisdStatsWithout = calculateStats(withoutCISD);

    const comboList = Object.keys(comboMap).map(key => ({
      combo: key,
      stats: calculateStats(comboMap[key])
    })).sort((a, b) => Number(b.stats.wr) - Number(a.stats.wr) || b.stats.pnl - a.stats.pnl);

    const bestCombo = comboList[0] || null;

    const tagList = Object.keys(tagMap).map(key => ({
      tag: key,
      stats: calculateStats(tagMap[key])
    })).sort((a, b) => Number(b.stats.wr) - Number(a.stats.wr));

    const bestTag = tagList[0] || null;
    const worstTag = tagList.length > 1 ? tagList[tagList.length - 1] : null;

    return {
      bestCombo,
      bestTag,
      worstTag,
      smtStatsWith,
      smtStatsWithout,
      cisdStatsWith,
      cisdStatsWithout,
      allCombos: comboList,
      allTags: tagList
    };
  }, [filteredTrades]);

  // ── FILTER VISIBILITY STATE ──
  const [showFilters, setShowFilters] = useState(false);

  // ── ACTIVE FILTERS HELPER ──
  const activeFilters = useMemo(() => {
    const list = [];
    if (dateRange !== 'all') {
      const labels = { '7days': '7 Hari Terakhir', '30days': '30 Hari Terakhir', 'this_month': 'Bulan Ini' };
      list.push({ key: 'dateRange', label: labels[dateRange] || dateRange, clear: () => setDateRange('all') });
    }
    if (filterMethod !== '') {
      const m = methods.find(x => String(x.id) === String(filterMethod));
      list.push({ key: 'method', label: m ? m.nama : 'Metode Terpilih', clear: () => setFilterMethod('') });
    }
    if (filterPair !== '') {
      list.push({ key: 'pair', label: filterPair, clear: () => setFilterPair('') });
    }
    if (filterSession !== '') {
      list.push({ key: 'session', label: filterSession, clear: () => setFilterSession('') });
    }
    if (filterArah !== '') {
      list.push({ key: 'arah', label: filterArah, clear: () => setFilterArah('') });
    }
    if (filterResult !== '') {
      const resLabels = { win: 'Win (TP)', lose: 'Lose (SL)', break_even: 'BE', partial_tp: 'Partial TP', 'sl+': 'SL+' };
      list.push({ key: 'result', label: resLabels[filterResult] || filterResult, clear: () => setFilterResult('') });
    }
    return list;
  }, [dateRange, filterMethod, filterPair, filterSession, filterArah, filterResult, methods]);

  const hasActiveFilters = activeFilters.length > 0;

  const resetFilters = () => {
    setDateRange('all');
    setFilterMethod('');
    setFilterPair('');
    setFilterSession('');
    setFilterArah('');
    setFilterResult('');
  };

  return (
    <div className="animate-fade-in">
      {/* ── HEADER ── */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={24} style={{ color: 'var(--accent)' }} /> Analisis Strategy & Confluences
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Statistik evaluasi lengkap, rekomendasi kombinasi konfirmasi terbaik, dan analisis risiko setup.
          </p>
        </div>

        {/* Action Buttons in Header Corner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {hasActiveFilters && (
            <button 
              onClick={resetFilters} 
              className="btn btn-secondary" 
              style={{ padding: '7px 12px', fontSize: '12px', borderRadius: '8px' }}
              title="Reset semua filter"
            >
              <RefreshCw size={13} /> Reset Filter
            </button>
          )}

          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ 
              padding: '7px 14px', 
              fontSize: '12px', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              border: hasActiveFilters && !showFilters ? '1px solid rgba(99,102,241,0.5)' : undefined
            }}
          >
            <Filter size={13} />
            <span>Filter</span>
            {hasActiveFilters && (
              <span style={{ 
                background: showFilters ? 'rgba(255,255,255,0.25)' : 'var(--accent)', 
                color: '#fff', 
                fontSize: '10px', 
                fontWeight: '700', 
                padding: '1px 6px', 
                borderRadius: '10px',
                lineHeight: '1.2' 
              }}>
                {activeFilters.length}
              </span>
            )}
            {showFilters ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* ── ACTIVE FILTERS MINI BAR (when filter is collapsed) ── */}
      {!showFilters && hasActiveFilters && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          flexWrap: 'wrap', 
          marginBottom: '16px',
          padding: '8px 14px',
          background: 'rgba(99,102,241,0.06)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 'var(--radius-md)'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Filter size={12} style={{ color: 'var(--accent)' }} /> Filter aktif ({filteredTrades.length}/{trades.length} trade):
          </span>
          {activeFilters.map(item => (
            <span 
              key={item.key}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              {item.label}
              <button 
                onClick={item.clear}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                title="Hapus filter ini"
              >
                <X size={11} />
              </button>
            </span>
          ))}
          <button 
            onClick={resetFilters}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--color-lose)', 
              fontSize: '11px', 
              cursor: 'pointer',
              fontWeight: '600',
              padding: '2px 6px',
              textDecoration: 'underline'
            }}
          >
            Reset Semua
          </button>
        </div>
      )}

      {/* ── COLLAPSIBLE FILTER PANEL ── */}
      {showFilters && (
        <div className="glass-card mb-20 animate-fade-in" style={{ padding: '16px 20px', border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(18, 20, 29, 0.95)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '700', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Filter size={14} /> Filter Multi-Kriteria
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '11px', color: '#60a5fa', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '12px', padding: '2px 8px' }}>
                Menampilkan {filteredTrades.length} dari {trades.length} trade
              </span>

              {hasActiveFilters && (
                <button 
                  onClick={resetFilters}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Reset Semua
                </button>
              )}

              <button 
                onClick={() => setShowFilters(false)}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Tutup Filter"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Rentang Waktu</label>
              <select value={dateRange} onChange={e => setDateRange(e.target.value)} style={{ fontSize: '12px', padding: '7px 10px', background: 'rgba(255,255,255,0.03)', width: '100%', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                <option value="all">Semua Waktu</option>
                <option value="7days">7 Hari Terakhir</option>
                <option value="30days">30 Hari Terakhir</option>
                <option value="this_month">Bulan Ini</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Metode Trading</label>
              <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} style={{ fontSize: '12px', padding: '7px 10px', background: 'rgba(255,255,255,0.03)', width: '100%', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                <option value="">Semua Metode</option>
                {methods.map(m => (
                  <option key={m.id} value={m.id}>{m.nama}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Trading Pair</label>
              <select value={filterPair} onChange={e => setFilterPair(e.target.value)} style={{ fontSize: '12px', padding: '7px 10px', background: 'rgba(255,255,255,0.03)', width: '100%', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                <option value="">Semua Pair</option>
                {uniquePairs.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Sesi Trading</label>
              <select value={filterSession} onChange={e => setFilterSession(e.target.value)} style={{ fontSize: '12px', padding: '7px 10px', background: 'rgba(255,255,255,0.03)', width: '100%', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                <option value="">Semua Sesi</option>
                {uniqueSessions.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Arah Posisi</label>
              <select value={filterArah} onChange={e => setFilterArah(e.target.value)} style={{ fontSize: '12px', padding: '7px 10px', background: 'rgba(255,255,255,0.03)', width: '100%', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                <option value="">Semua Arah</option>
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Hasil Outcome</label>
              <select value={filterResult} onChange={e => setFilterResult(e.target.value)} style={{ fontSize: '12px', padding: '7px 10px', background: 'rgba(255,255,255,0.03)', width: '100%', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                <option value="">Semua Hasil</option>
                <option value="win">Win (Full TP)</option>
                <option value="lose">Lose (Full SL)</option>
                <option value="break_even">Break Even</option>
                <option value="partial_tp">Partial TP</option>
                <option value="sl+">SL+</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── UNIFIED METRICS & RISK DASHBOARD (1 SINGLE CARD) ── */}
      <div className="glass-card mb-30" style={{ padding: '20px 22px', position: 'relative' }}>
        {/* Card Header with Corner Filter Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
              <Layers size={17} />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                Ringkasan Performa & Risiko Setup
              </h2>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Evaluasi komprehensif dari {filteredTrades.length} trade tereksekusi
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {hasActiveFilters ? (
              <span style={{ fontSize: '11px', color: '#60a5fa', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '12px', padding: '3px 10px' }}>
                Filter Aktif: {filteredTrades.length}/{trades.length} Trade
              </span>
            ) : (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '3px 10px' }}>
                Semua Trade ({trades.length})
              </span>
            )}
          </div>
        </div>

        {/* Unified 8 Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
          {/* 1. Total Trades */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'var(--transition-normal)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
              <Activity size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Trades</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff', lineHeight: '1.2', marginTop: '2px' }}>{stats.total}</div>
            </div>
          </div>

          {/* 2. Win Rate */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'var(--transition-normal)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--color-win-bg)', border: '1px solid var(--color-win-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-win)', flexShrink: 0 }}>
              <Award size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Win Rate</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-win)', lineHeight: '1.2', marginTop: '2px' }}>{stats.wr}%</div>
            </div>
          </div>

          {/* 3. Net Profit */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'var(--transition-normal)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: stats.pnl >= 0 ? 'var(--color-win-bg)' : 'var(--color-lose-bg)', border: `1px solid ${stats.pnl >= 0 ? 'var(--color-win-border)' : 'var(--color-lose-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stats.pnl >= 0 ? 'var(--color-win)' : 'var(--color-lose)', flexShrink: 0 }}>
              <DollarSign size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Net Profit</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: stats.pnl >= 0 ? 'var(--color-win)' : 'var(--color-lose)', lineHeight: '1.2', marginTop: '2px' }}>
                {stats.pnl >= 0 ? '+' : ''}${stats.pnl}
              </div>
            </div>
          </div>

          {/* 4. Profit Factor */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'var(--transition-normal)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-secondary)', flexShrink: 0 }}>
              <TrendingUp size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Profit Factor</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent-secondary)', lineHeight: '1.2', marginTop: '2px' }}>{stats.profitFactor}</div>
            </div>
          </div>

          {/* 5. Max Win Streak */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'var(--transition-normal)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f97316', flexShrink: 0 }}>
              <Flame size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Max Win Streak</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-win)', lineHeight: '1.2', marginTop: '2px' }}>{streakStats.maxWin} <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>Trade</span></div>
            </div>
          </div>

          {/* 6. Max Lose Streak */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'var(--transition-normal)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', flexShrink: 0 }}>
              <Snowflake size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Max Lose Streak</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-lose)', lineHeight: '1.2', marginTop: '2px' }}>{streakStats.maxLose} <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>Trade</span></div>
            </div>
          </div>

          {/* 7. Expectancy / Trade */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'var(--transition-normal)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}>
              <Percent size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Expectancy / Trade</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: Number(stats.expectancy) >= 0 ? 'var(--color-win)' : 'var(--color-lose)', lineHeight: '1.2', marginTop: '2px' }}>
                {Number(stats.expectancy) >= 0 ? '+' : ''}${stats.expectancy}
              </div>
            </div>
          </div>

          {/* 8. Max Drawdown */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'var(--transition-normal)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-lose)', flexShrink: 0 }}>
              <ArrowDownRight size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Max Drawdown</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-lose)', lineHeight: '1.2', marginTop: '2px' }}>
                -${streakStats.maxDD}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SMART STRATEGY RECOMMENDATIONS SECTION ── */}
      <div className="glass-card mb-30" style={{ border: '1px solid rgba(99,102,241,0.25)', background: 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(13,14,21,0.95) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
          <Sparkles size={20} style={{ color: 'var(--accent)' }} />
          <div>
            <h2 style={{ fontSize: '16px', margin: 0, fontWeight: '700', color: '#fff' }}>Smart Strategy Recommendations Engine</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Rekomendasi otomatis kombinasi konfirmasi terbaik dan peringatan risiko dari metode kamu.</p>
          </div>
        </div>

        {!recommendations ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
            Butuh minimal 3 data trade untuk menghasilkan rekomendasi kombinasi konfirmasi yang akurat.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {/* 🏆 Best Combination Card */}
            <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-win)', fontWeight: '700', fontSize: '13px', marginBottom: '10px' }}>
                🏆 Kombinasi Konfirmasi Tertinggi
              </div>

              {recommendations.bestCombo ? (
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>
                    {recommendations.bestCombo.combo}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', marginBottom: '10px' }}>
                    <span style={{ color: 'var(--color-win)', fontWeight: '700' }}>Win Rate: {recommendations.bestCombo.stats.wr}%</span>
                    <span style={{ color: 'var(--text-muted)' }}>({recommendations.bestCombo.stats.total} Trade)</span>
                    <span style={{ color: recommendations.bestCombo.stats.pnl >= 0 ? 'var(--color-win)' : 'var(--color-lose)', fontWeight: '700' }}>
                      PnL: {recommendations.bestCombo.stats.pnl >= 0 ? '+' : ''}${recommendations.bestCombo.stats.pnl}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                    💡 <strong>Rekomendasi SOP:</strong> Kombinasi ini terbukti memberikan akurasi tertinggi pada metode kamu! Prioritaskan entry saat kombinasi ini lengkap.
                  </p>
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Catat lebih banyak trade dengan multiple konfirmasi untuk menemukan kombinasi terbaik.
                </div>
              )}
            </div>

            {/* ⚡ SMT & CISD Impact Card */}
            <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontWeight: '700', fontSize: '13px', marginBottom: '10px' }}>
                ⚡ Analisis Impact SMT & CISD
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '4px' }}>
                  <span>SMT Divergence:</span>
                  <span style={{ fontWeight: '700', color: Number(recommendations.smtStatsWith.wr) >= Number(recommendations.smtStatsWithout.wr) ? 'var(--color-win)' : 'var(--color-lose)' }}>
                    With SMT ({recommendations.smtStatsWith.wr}%) vs Without ({recommendations.smtStatsWithout.wr}%)
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '4px' }}>
                  <span>CISD Confirmation:</span>
                  <span style={{ fontWeight: '700', color: Number(recommendations.cisdStatsWith.wr) >= Number(recommendations.cisdStatsWithout.wr) ? 'var(--color-win)' : 'var(--color-lose)' }}>
                    With CISD ({recommendations.cisdStatsWith.wr}%) vs Without ({recommendations.cisdStatsWithout.wr}%)
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                  {Number(recommendations.smtStatsWith.wr) > Number(recommendations.smtStatsWithout.wr) 
                    ? '✨ Penggunaan SMT Divergence meningkatkan Win Rate strategi kamu secara signifikan!'
                    : 'ℹ️ Evaluasi kembali efektivitas SMT/CISD pada pair pilihan kamu.'}
                </p>
              </div>
            </div>

            {/* ⚠️ Weak Confluence / Risk Warning Card */}
            <div style={{ background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-lose)', fontWeight: '700', fontSize: '13px', marginBottom: '10px' }}>
                ⚠️ Peringatan Setup Risk
              </div>

              {recommendations.worstTag ? (
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>
                    Konfirmasi {recommendations.worstTag.tag}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-lose)', fontWeight: '700', marginBottom: '6px' }}>
                    Win Rate: {recommendations.worstTag.stats.wr}% • PnL: ${recommendations.worstTag.stats.pnl}
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                    ⚠️ Trade dengan tag <strong>{recommendations.worstTag.tag}</strong> memiliki performa relatif rendah. Pertimbangkan untuk memperketat aturan filter sebelum open posisi.
                  </p>
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Belum ada data risiko terpantau.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── CONFLUENCE MATRIX TABLE ── */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h2 style={{ fontSize: '16px', margin: '0 0 16px 0', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={18} style={{ color: 'var(--color-win)' }} /> Perbandingan Performa Semua Tag Konfirmasi & Kombinasi
        </h2>

        {!recommendations || (recommendations.allTags.length === 0 && recommendations.allCombos.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
            Belum ada konfirmasi entry yang dicatat pada jurnal trade kamu.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', textTransform: 'uppercase', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Konfirmasi / Setup</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Total Trade</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Win Rate (%)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Net PnL (USD)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Profit Factor</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Expectancy / Trade</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Avg R:R</th>
                </tr>
              </thead>
              <tbody>
                {/* Render Individual Tags */}
                {recommendations.allTags.map(({ tag, stats }, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#fff' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '12px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--color-win)', fontSize: '12px' }}>
                        ✓ {tag}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>{stats.total}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: Number(stats.wr) >= 50 ? 'var(--color-win)' : 'var(--color-lose)' }}>
                      {stats.wr}%
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: stats.pnl >= 0 ? 'var(--color-win)' : 'var(--color-lose)' }}>
                      {stats.pnl >= 0 ? `+$${stats.pnl}` : `-$${Math.abs(stats.pnl)}`}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>{stats.profitFactor}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'monospace' }}>
                      {Number(stats.expectancy) >= 0 ? '+' : ''}${stats.expectancy}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>{stats.avgRR}R</td>
                  </tr>
                ))}

                {/* Render Top Combinations */}
                {recommendations.allCombos.map(({ combo, stats }, i) => (
                  <tr key={`combo-${i}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: 'rgba(99,102,241,0.02)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#fff' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '12px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: 'var(--accent)', fontSize: '11px' }}>
                        🔗 {combo}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>{stats.total}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: Number(stats.wr) >= 50 ? 'var(--color-win)' : 'var(--color-lose)' }}>
                      {stats.wr}%
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: stats.pnl >= 0 ? 'var(--color-win)' : 'var(--color-lose)' }}>
                      {stats.pnl >= 0 ? `+$${stats.pnl}` : `-$${Math.abs(stats.pnl)}`}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>{stats.profitFactor}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'monospace' }}>
                      {Number(stats.expectancy) >= 0 ? '+' : ''}${stats.expectancy}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>{stats.avgRR}R</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
