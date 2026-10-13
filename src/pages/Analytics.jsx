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

/* ─────────────────────────────────────────────────────────────
   RADAR / SPIDER WEB CHART COMPONENT (5 DIMENSIONS)
   Total Trades, Win Rate, Win Streak, Lose Streak, Profit Factor
───────────────────────────────────────────────────────────── */
function StrategySpiderRadar({ stats, streakStats }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const sizeW = 380;
  const sizeH = 310;
  const cx = 190;
  const cy = 150;
  const r = 90;

  // 5 Sumbu (Pentagon):
  // 0: Win Rate (Top)
  // 1: Profit Factor (Top-Right)
  // 2: Win Terbanyak (Bottom-Right)
  // 3: Lose Terbanyak (Bottom-Left)
  // 4: Total Trades (Top-Left)
  const pfValue = stats.profitFactor === '∞' ? 3.0 : (Number(stats.profitFactor) || 0);
  const axes = [
    {
      key: 'wr',
      label: 'Win Rate',
      valStr: `${stats.wr}%`,
      score: Math.min(1, Math.max(0, Number(stats.wr) / 100)),
      color: '#10b981',
      desc: 'Akurasi Kemenangan'
    },
    {
      key: 'pf',
      label: 'Profit Factor',
      valStr: `${stats.profitFactor}`,
      score: stats.profitFactor === '∞' ? 1.0 : Math.min(1, Math.max(0, pfValue / 3.0)),
      color: '#06b6d4',
      desc: 'Efisiensi Profitabilitas'
    },
    {
      key: 'winStreak',
      label: 'Win Terbanyak',
      valStr: `${streakStats.maxWin} Trade`,
      score: Math.min(1, Math.max(0, streakStats.maxWin / 5)),
      color: '#f97316',
      desc: 'Momentum Kemenangan Beruntun'
    },
    {
      key: 'loseStreak',
      label: 'Lose Terbanyak',
      valStr: `${streakStats.maxLose} Trade`,
      // Semakin kecil streak lose, semakin tinggi ketahanan risiko
      score: Math.max(0.15, Math.min(1, 1 - (streakStats.maxLose / 6))),
      color: '#f43f5e',
      desc: 'Ketahanan Kontrol Kerugian'
    },
    {
      key: 'total',
      label: 'Total Trade',
      valStr: `${stats.total}`,
      score: Math.min(1, Math.max(0, stats.total / 20)),
      color: '#a855f7',
      desc: 'Validitas Ukuran Sampel'
    }
  ];

  const totalAxes = axes.length;
  const getCoords = (index, radiusFactor) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / totalAxes;
    return {
      x: cx + r * radiusFactor * Math.cos(angle),
      y: cy + r * radiusFactor * Math.sin(angle),
      angle
    };
  };

  const levels = [0.25, 0.5, 0.75, 1.0];
  const dataPoints = axes.map((axis, i) => {
    const radiusFactor = Math.max(0.12, Math.min(1.0, axis.score));
    return getCoords(i, radiusFactor);
  });
  const dataPointsStr = dataPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
      <svg 
        viewBox={`0 0 ${sizeW} ${sizeH}`} 
        style={{ width: '100%', maxWidth: '380px', height: 'auto', overflow: 'visible' }}
      >
        <defs>
          <radialGradient id="spiderWebGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
            <stop offset="55%" stopColor="#06b6d4" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.10" />
          </radialGradient>
          <linearGradient id="spiderStrokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="40%" stopColor="#22d3ee" />
            <stop offset="70%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <filter id="spiderGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Web Grid Concentric Rings (Sarang Laba-Laba) */}
        {levels.map((lvl, lIdx) => {
          const pts = axes.map((_, i) => {
            const { x, y } = getCoords(i, lvl);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          }).join(' ');
          return (
            <polygon
              key={`web-${lIdx}`}
              points={pts}
              fill={lIdx === levels.length - 1 ? 'rgba(255,255,255,0.012)' : 'none'}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={lIdx === levels.length - 1 ? '1.5' : '1'}
              strokeDasharray={lIdx < levels.length - 1 ? '3,3' : undefined}
            />
          );
        })}

        {/* Spokes (Garis Jari-Jari Sarang) */}
        {axes.map((_, i) => {
          const outer = getCoords(i, 1.0);
          return (
            <line
              key={`spoke-${i}`}
              x1={cx}
              y1={cy}
              x2={outer.x}
              y2={outer.y}
              stroke="rgba(255,255,255,0.09)"
              strokeWidth="1"
            />
          );
        })}

        {/* Center Pivot Point */}
        <circle cx={cx} cy={cy} r="2.5" fill="rgba(255,255,255,0.3)" />

        {/* Data Polygon (Bentuk Poligon Sarang Laba-Laba Aktif) */}
        <polygon
          points={dataPointsStr}
          fill="url(#spiderWebGrad)"
          stroke="url(#spiderStrokeGrad)"
          strokeWidth="2.5"
          filter="url(#spiderGlow)"
          style={{ transition: 'all 0.4s ease' }}
        />

        {/* Vertex Nodes (Titik Sudut Aktif) */}
        {dataPoints.map((p, i) => {
          const isHovered = hoveredIdx === i;
          return (
            <g 
              key={`vertex-${i}`} 
              onMouseEnter={() => setHoveredIdx(i)} 
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={p.x} cy={p.y} r={isHovered ? 8 : 6} fill={axes[i].color} opacity={isHovered ? 0.6 : 0.3} style={{ transition: 'all 0.2s ease' }} />
              <circle cx={p.x} cy={p.y} r={isHovered ? 4.5 : 3.5} fill="#fff" stroke={axes[i].color} strokeWidth="2" />
            </g>
          );
        })}

        {/* Outer Labels with Dynamic Text Positioning */}
        {axes.map((axis, i) => {
          const isHovered = hoveredIdx === i;
          const labelDist = 1.28;
          const pos = getCoords(i, labelDist);

          let textAnchor = 'middle';
          let dy = 3;
          if (i === 0) {
            dy = -10;
          } else if (i === 1 || i === 2) {
            textAnchor = 'start';
          } else if (i === 3 || i === 4) {
            textAnchor = 'end';
          }

          return (
            <g 
              key={`lbl-${i}`} 
              transform={`translate(${pos.x}, ${pos.y + dy})`}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
            >
              <text
                textAnchor={textAnchor}
                fontSize={isHovered ? '11' : '10'}
                fontWeight={isHovered ? '800' : '600'}
                fill={isHovered ? '#fff' : 'var(--text-secondary)'}
                letterSpacing="0.4px"
              >
                {axis.label}
              </text>
              <text
                textAnchor={textAnchor}
                y="13"
                fontSize={isHovered ? '12' : '11'}
                fontWeight="800"
                fill={axis.color}
              >
                {axis.valStr}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

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

        {/* Unified Spider Radar + Financial Metrics Dashboard */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '20px', alignItems: 'center' }}>
          {/* SISI KIRI: RADAR SPIDER CHART */}
          <div style={{ 
            background: 'rgba(255,255,255,0.015)', 
            border: '1px solid rgba(255,255,255,0.05)', 
            borderRadius: 'var(--radius-md)', 
            padding: '16px',
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            position: 'relative'
          }}>
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                <Sparkles size={14} style={{ color: 'var(--accent)' }} /> Radar Kinerja Strategi
              </div>
              <span style={{ fontSize: '10px', color: 'var(--accent)', background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.2)', fontWeight: '600' }}>
                5 Pilar Utama
              </span>
            </div>

            <StrategySpiderRadar stats={stats} streakStats={streakStats} />

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '6px' }}>
              Visualisasi pentagon sarang laba-laba mengukur keseimbangan akurasi & kontrol risiko
            </div>
          </div>

          {/* SISI KANAN: 1 CARD TUNGGAL UNTUK SEMUA VARIABEL */}
          <div style={{ 
            background: 'rgba(255,255,255,0.015)', 
            border: '1px solid rgba(255,255,255,0.05)', 
            borderRadius: 'var(--radius-md)', 
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            {/* Header Card */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={15} style={{ color: 'var(--accent)' }} /> Ringkasan Metrik Lengkap
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {filteredTrades.length} Trade Terkalkulasi
              </span>
            </div>

            {/* Grid Semua Variabel (3 kolom x 3 baris) - Rapi dalam 1 Card */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px 16px' }}>
              {/* 1. Net Profit */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Net Profit
                </div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: stats.pnl >= 0 ? 'var(--color-win)' : 'var(--color-lose)', marginTop: '4px', lineHeight: '1.2' }}>
                  {stats.pnl >= 0 ? '+' : ''}${stats.pnl}
                </div>
              </div>

              {/* 2. Expectancy */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Expectancy
                </div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: Number(stats.expectancy) >= 0 ? 'var(--color-win)' : 'var(--color-lose)', marginTop: '4px', lineHeight: '1.2' }}>
                  {Number(stats.expectancy) >= 0 ? '+' : ''}${stats.expectancy}
                </div>
              </div>

              {/* 3. Max Drawdown */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Max Drawdown
                </div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-lose)', marginTop: '4px', lineHeight: '1.2' }}>
                  -${streakStats.maxDD}
                </div>
              </div>

              {/* 4. Win Rate */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Win Rate
                </div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-win)', marginTop: '4px', lineHeight: '1.2' }}>
                  {stats.wr}%
                </div>
              </div>

              {/* 5. Profit Factor */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Profit Factor
                </div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent-secondary)', marginTop: '4px', lineHeight: '1.2' }}>
                  {stats.profitFactor}
                </div>
              </div>

              {/* 6. Avg R:R */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Avg R:R
                </div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent-secondary)', marginTop: '4px', lineHeight: '1.2' }}>
                  {stats.avgRR}R
                </div>
              </div>

              {/* 7. Total Trade */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Total Trade
                </div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#a855f7', marginTop: '4px', lineHeight: '1.2' }}>
                  {stats.total} <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>({stats.wins}W/{stats.losses}L)</span>
                </div>
              </div>

              {/* 8. Win Streak */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Win Streak
                </div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#f97316', marginTop: '4px', lineHeight: '1.2' }}>
                  {streakStats.maxWin} <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>Trade</span>
                </div>
              </div>

              {/* 9. Lose Streak */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Lose Streak
                </div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-lose)', marginTop: '4px', lineHeight: '1.2' }}>
                  {streakStats.maxLose} <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>Trade</span>
                </div>
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
