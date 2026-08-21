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
  Search,
  Check,
  HelpCircle
} from 'lucide-react';
import { getJurnal, getMetode } from '../lib/api';

/* ─────────────────────────────────────────────────────────────
   HELPER FUNCTIONS FOR STATS & RECOMMENDATIONS
───────────────────────────────────────────────────────────── */

function calculateStats(subset) {
  const total = subset.length;
  if (total === 0) return { total: 0, wins: 0, losses: 0, wr: '0.0', pnl: 0, avgRR: '0.00', profitFactor: '0.00', expectancy: '0.00' };

  const wins = subset.filter(t => ['win', 'partial_tp', 'sl+'].includes(t.hasilTrade)).length;
  const losses = subset.filter(t => ['lose', 'sl'].includes(t.hasilTrade)).length;
  const wr = ((wins / total) * 100).toFixed(1);
  
  const pnl = subset.reduce((acc, t) => acc + (t.profitNominal || 0), 0);
  const totalRR = subset.reduce((acc, t) => acc + (t.rrDiperoleh || 0), 0);
  const avgRR = (totalRR / total).toFixed(2);

  const grossProfit = subset.reduce((acc, t) => acc + (t.profitNominal > 0 ? t.profitNominal : 0), 0);
  const grossLoss = subset.reduce((acc, t) => acc + (t.profitNominal < 0 ? Math.abs(t.profitNominal) : 0), 0);
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : grossProfit > 0 ? '∞' : '0.00';

  const expectancy = (pnl / total).toFixed(2);

  return { total, wins, losses, wr, pnl, avgRR, profitFactor, expectancy };
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
      if (dateRange !== 'all' && t.tanggal) {
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
      if (filterResult !== '' && t.hasilTrade !== filterResult) return false;

      return true;
    });
  }, [trades, dateRange, filterMethod, filterPair, filterSession, filterArah, filterResult]);

  const stats = useMemo(() => calculateStats(filteredTrades), [filteredTrades]);

  const streakStats = useMemo(() => {
    let maxWin = 0, maxLose = 0, currWin = 0, currLose = 0;
    let equity = 0, peak = 0, maxDD = 0;

    const sorted = [...filteredTrades].sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
    sorted.forEach(t => {
      const isWin = ['win', 'partial_tp', 'sl+'].includes(t.hasilTrade);
      const isLose = ['lose', 'sl'].includes(t.hasilTrade);
      const pnl = t.profitNominal || 0;

      if (isWin) {
        currWin++;
        currLose = 0;
        if (currWin > maxWin) maxWin = currWin;
      } else if (isLose) {
        currLose++;
        currWin = 0;
        if (currLose > maxLose) maxLose = currLose;
      } else {
        currWin = 0;
        currLose = 0;
      }

      equity += pnl;
      if (equity > peak) peak = equity;
      const dd = peak - equity;
      if (dd > maxDD) maxDD = dd;
    });

    return { maxWin, maxLose, maxDD: maxDD.toFixed(2) };
  }, [filteredTrades]);

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
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={24} style={{ color: 'var(--accent)' }} /> Analisis Strategy & Confluences
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Statistik evaluasi lengkap, rekomendasi kombinasi konfirmasi terbaik, dan analisis risiko setup.
          </p>
        </div>

        <button onClick={resetFilters} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '12px' }}>
          <RefreshCw size={14} /> Reset Filter
        </button>
      </div>

      {/* ── MULTI-FILTER BAR ── */}
      <div className="glass-card mb-30" style={{ padding: '16px 20px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '12px', fontWeight: '700', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <Filter size={14} /> Filter Multi-Kriteria
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Rentang Waktu</label>
            <select value={dateRange} onChange={e => setDateRange(e.target.value)} style={{ fontSize: '12px', padding: '7px 10px', background: 'rgba(255,255,255,0.02)' }}>
              <option value="all">Semua Waktu</option>
              <option value="7days">7 Hari Terakhir</option>
              <option value="30days">30 Hari Terakhir</option>
              <option value="this_month">Bulan Ini</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Metode Trading</label>
            <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} style={{ fontSize: '12px', padding: '7px 10px', background: 'rgba(255,255,255,0.02)' }}>
              <option value="">Semua Metode</option>
              {methods.map(m => (
                <option key={m.id} value={m.id}>{m.nama}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Trading Pair</label>
            <select value={filterPair} onChange={e => setFilterPair(e.target.value)} style={{ fontSize: '12px', padding: '7px 10px', background: 'rgba(255,255,255,0.02)' }}>
              <option value="">Semua Pair</option>
              {uniquePairs.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Sesi Trading</label>
            <select value={filterSession} onChange={e => setFilterSession(e.target.value)} style={{ fontSize: '12px', padding: '7px 10px', background: 'rgba(255,255,255,0.02)' }}>
              <option value="">Semua Sesi</option>
              {uniqueSessions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Arah Posisi</label>
            <select value={filterArah} onChange={e => setFilterArah(e.target.value)} style={{ fontSize: '12px', padding: '7px 10px', background: 'rgba(255,255,255,0.02)' }}>
              <option value="">Semua Arah</option>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Hasil Outcome</label>
            <select value={filterResult} onChange={e => setFilterResult(e.target.value)} style={{ fontSize: '12px', padding: '7px 10px', background: 'rgba(255,255,255,0.02)' }}>
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

      {/* ── KPI METRICS GRID ── */}
      <div className="stats-grid-4 mb-30">
        <div className="glass-card kpi-card">
          <div className="kpi-icon-container" style={{ color: '#fff' }}><Activity size={20} /></div>
          <div className="kpi-details"><span>Total Trades</span><h3>{stats.total}</h3></div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-icon-container" style={{ color: 'var(--color-win)' }}><Award size={20} /></div>
          <div className="kpi-details"><span>Win Rate</span><h3 style={{ color: 'var(--color-win)' }}>{stats.wr}%</h3></div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-icon-container" style={{ color: stats.pnl >= 0 ? 'var(--color-win)' : 'var(--color-lose)' }}><DollarSign size={20} /></div>
          <div className="kpi-details"><span>Net Profit</span><h3 style={{ color: stats.pnl >= 0 ? 'var(--color-win)' : 'var(--color-lose)' }}>{stats.pnl >= 0 ? '+' : ''}${stats.pnl}</h3></div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-icon-container" style={{ color: 'var(--accent-secondary)' }}><TrendingUp size={20} /></div>
          <div className="kpi-details"><span>Profit Factor</span><h3 style={{ color: 'var(--accent-secondary)' }}>{stats.profitFactor}</h3></div>
        </div>
      </div>

      {/* Secondary Quick Stats Chips */}
      <div className="stats-grid-4 mb-30">
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Flame size={20} style={{ color: '#f97316' }} />
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Max Win Streak</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-win)' }}>{streakStats.maxWin} Trade</div>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Snowflake size={20} style={{ color: '#38bdf8' }} />
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Max Lose Streak</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-lose)' }}>{streakStats.maxLose} Trade</div>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Percent size={20} style={{ color: 'var(--accent)' }} />
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Expectancy / Trade</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: Number(stats.expectancy) >= 0 ? 'var(--color-win)' : 'var(--color-lose)' }}>
              {Number(stats.expectancy) >= 0 ? '+' : ''}${stats.expectancy}
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ArrowDownRight size={20} style={{ color: 'var(--color-lose)' }} />
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Max Drawdown</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-lose)' }}>-${streakStats.maxDD}</div>
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
