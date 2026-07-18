import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Award, 
  Activity, 
  Brain,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  BarChart2,
  Zap,
  Target,
  Flame,
  Snowflake,
  Percent,
  ArrowDownRight
} from 'lucide-react';
import { getJurnal } from '../lib/api';

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */

// SVG Equity Curve
function EquityCurve({ trades }) {
  const sorted = [...trades].sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
  if (sorted.length < 2) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px', color: 'var(--text-muted)', fontSize: '13px' }}>
      Butuh minimal 2 trade untuk menampilkan kurva modal.
    </div>
  );

  // Build cumulative PnL points
  let cum = 0;
  const points = [{ x: 0, y: 0, label: 'Start', pnl: 0 }];
  sorted.forEach((t, i) => {
    cum += t.profitNominal || 0;
    points.push({ x: i + 1, y: cum, label: t.tanggal, pnl: cum, pair: t.pair });
  });

  const W = 600, H = 160, PAD = 20;
  const maxY = Math.max(...points.map(p => p.y));
  const minY = Math.min(...points.map(p => p.y));
  const rangeY = maxY - minY || 1;
  const rangeX = points.length - 1 || 1;

  const toSVG = (p) => ({
    x: PAD + (p.x / rangeX) * (W - PAD * 2),
    y: PAD + ((maxY - p.y) / rangeY) * (H - PAD * 2)
  });

  const polyPoints = points.map(p => {
    const { x, y } = toSVG(p);
    return `${x},${y}`;
  }).join(' ');

  // Area fill points (close bottom)
  const first = toSVG(points[0]);
  const last = toSVG(points[points.length - 1]);
  const areaPoints = `${first.x},${H - PAD} ${polyPoints} ${last.x},${H - PAD}`;

  const finalPnL = points[points.length - 1].y;
  const lineColor = finalPnL >= 0 ? 'var(--color-win)' : 'var(--color-lose)';
  const areaColor = finalPnL >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)';

  // Zero line
  const zeroY = PAD + ((maxY - 0) / rangeY) * (H - PAD * 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '160px' }}>
      {/* Zero baseline */}
      {minY < 0 && maxY > 0 && (
        <line x1={PAD} y1={zeroY} x2={W - PAD} y2={zeroY}
          stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4,4" />
      )}
      {/* Area */}
      <polygon points={areaPoints} fill={areaColor} />
      {/* Line */}
      <polyline points={polyPoints} fill="none" stroke={lineColor} strokeWidth="2.5"
        strokeLinejoin="round" strokeLinecap="round" />
      {/* End dot */}
      <circle cx={last.x} cy={last.y} r="5" fill={lineColor}
        style={{ filter: `drop-shadow(0 0 6px ${lineColor})` }} />
      {/* Dots on hover (only render last few for performance) */}
      {points.slice(-10).map((p, i) => {
        const { x, y } = toSVG(p);
        return <circle key={i} cx={x} cy={y} r="3" fill={lineColor} opacity="0.5" />;
      })}
    </svg>
  );
}

// Donut chart for result distribution
function DonutChart({ trades }) {
  const counts = { win: 0, partial_tp: 0, 'sl+': 0, break_even: 0, lose: 0 };
  trades.forEach(t => { if (counts[t.hasilTrade] !== undefined) counts[t.hasilTrade]++; });

  const config = [
    { key: 'win',        label: 'WIN',        color: '#10b981' },
    { key: 'partial_tp', label: 'PARTIAL TP', color: '#06b6d4' },
    { key: 'sl+',        label: 'SL+',        color: '#a78bfa' },
    { key: 'break_even', label: 'BREAK EVEN', color: '#6366f1' },
    { key: 'lose',       label: 'LOSE',       color: '#f43f5e' },
  ];

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return (
    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '40px 0' }}>
      Belum ada data trade.
    </div>
  );

  const R = 50, r = 32, CX = 70, CY = 70;
  const circumference = 2 * Math.PI * R;
  let offset = 0;

  const arcs = config.map(cfg => {
    const pct = counts[cfg.key] / total;
    const arc = { ...cfg, pct, count: counts[cfg.key], offset };
    offset += pct;
    return arc;
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
      <svg viewBox="0 0 140 140" style={{ width: '140px', height: '140px', flexShrink: 0 }}>
        {/* Background ring */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={R - r} />
        {arcs.filter(a => a.pct > 0).map((arc, i) => (
          <circle key={i} cx={CX} cy={CY} r={R}
            fill="none" stroke={arc.color}
            strokeWidth={R - r}
            strokeDasharray={`${arc.pct * circumference} ${circumference}`}
            strokeDashoffset={-arc.offset * circumference}
            style={{ transformOrigin: `${CX}px ${CY}px`, transform: 'rotate(-90deg)' }}
          />
        ))}
        {/* Center text */}
        <text x={CX} y={CY - 6} textAnchor="middle" fill="#fff" fontSize="18" fontWeight="700">{total}</text>
        <text x={CX} y={CY + 10} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9">TRADES</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {arcs.map(arc => (
          <div key={arc.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: arc.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{arc.label}</span>
            <span style={{ color: '#fff', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{arc.count}</span>
            <span style={{ color: 'var(--text-muted)', minWidth: '36px', textAlign: 'right' }}>
              {total > 0 ? ((arc.count / total) * 100).toFixed(0) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Monthly PnL bar chart
function MonthlyPnLBars({ trades }) {
  const monthMap = {};
  trades.forEach(t => {
    const key = t.tanggal?.slice(0, 7); // YYYY-MM
    if (!key) return;
    monthMap[key] = (monthMap[key] || 0) + (t.profitNominal || 0);
  });

  const months = Object.keys(monthMap).sort().slice(-8); // last 8 months
  if (months.length === 0) return (
    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '30px 0' }}>
      Belum ada data bulan.
    </div>
  );

  const values = months.map(m => monthMap[m]);
  const maxAbs = Math.max(...values.map(Math.abs), 1);
  const barH = 80; // total height available for bars

  const fmt = (m) => {
    const [y, mo] = m.split('-');
    const names = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
    return names[parseInt(mo) - 1] + ' ' + y.slice(2);
  };

  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: `${barH + 44}px`, width: '100%' }}>
      {months.map((m, i) => {
        const val = monthMap[m];
        const isPos = val >= 0;
        const h = Math.max(4, (Math.abs(val) / maxAbs) * barH);
        return (
          <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            {/* Positive bar area */}
            <div style={{ height: barH, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', width: '100%' }}>
              {isPos && (
                <div style={{ width: '100%', height: h, background: 'var(--color-win)', borderRadius: '4px 4px 0 0',
                  boxShadow: '0 0 8px rgba(16,185,129,0.3)', transition: 'height 0.5s ease' }} />
              )}
            </div>
            {/* Zero line separator */}
            <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
            {/* Negative bar area */}
            <div style={{ width: '100%', ...(isPos ? { height: 0 } : { height: h, background: 'var(--color-lose)',
              borderRadius: '0 0 4px 4px', boxShadow: '0 0 8px rgba(244,63,94,0.3)' }) }} />
            {/* Label */}
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '4px' }}>{fmt(m)}</div>
            <div style={{ fontSize: '10px', fontWeight: '700', fontFamily: 'var(--font-mono)',
              color: isPos ? 'var(--color-win)' : 'var(--color-lose)' }}>
              {isPos ? '+' : ''}{val > 0 ? val : val === 0 ? '0' : val}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Per Pair performance
function PairPerformance({ trades }) {
  const pairMap = {};
  trades.forEach(t => {
    if (!t.pair) return;
    if (!pairMap[t.pair]) pairMap[t.pair] = { total: 0, wins: 0, pnl: 0 };
    pairMap[t.pair].total++;
    if (['win', 'partial_tp', 'sl+'].includes(t.hasilTrade)) pairMap[t.pair].wins++;
    pairMap[t.pair].pnl += t.profitNominal || 0;
  });

  const pairs = Object.entries(pairMap)
    .map(([pair, s]) => ({ pair, ...s, wr: ((s.wins / s.total) * 100).toFixed(0) }))
    .sort((a, b) => b.pnl - a.pnl);

  if (pairs.length === 0) return (
    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '30px 0' }}>Belum ada data pair.</div>
  );

  const maxAbsPnl = Math.max(...pairs.map(p => Math.abs(p.pnl)), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {pairs.map(p => {
        const barW = (Math.abs(p.pnl) / maxAbsPnl) * 100;
        const isPos = p.pnl >= 0;
        return (
          <div key={p.pair}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12px' }}>
              <span style={{ fontWeight: '700', color: '#fff' }}>{p.pair}</span>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{p.total} trade</span>
                <span style={{ color: isPos ? 'var(--color-win)' : 'var(--color-lose)', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>
                  {isPos ? '+' : ''}${p.pnl}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>WR {p.wr}%</span>
              </div>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ width: `${barW}%`, height: '100%', borderRadius: '999px',
                background: isPos ? 'var(--color-win)' : 'var(--color-lose)',
                boxShadow: `0 0 8px ${isPos ? 'rgba(16,185,129,0.4)' : 'rgba(244,63,94,0.4)'}`,
                transition: 'width 0.6s ease' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Trade Type breakdown
function TradeTypeStats({ trades }) {
  const types = { continuation: { label: 'Continuation', emoji: '📈', total: 0, wins: 0, rr: 0 },
    reversal: { label: 'Reversal', emoji: '🔄', total: 0, wins: 0, rr: 0 },
    ranging: { label: 'Ranging / Sideways', emoji: '↔️', total: 0, wins: 0, rr: 0 } };
  trades.forEach(t => {
    const k = t.jenisTrade;
    if (types[k]) {
      types[k].total++;
      if (['win', 'partial_tp', 'sl+'].includes(t.hasilTrade)) types[k].wins++;
      types[k].rr += t.rrDiperoleh || 0;
    }
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {Object.entries(types).map(([key, s]) => (
        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', padding: '12px 16px',
          border: '1px solid rgba(255,255,255,0.04)' }}>
          <span style={{ fontSize: '14px' }}>{s.emoji} <span style={{ color: '#fff', fontWeight: '600' }}>{s.label}</span></span>
          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span>{s.total} trade</span>
            <span style={{ color: s.total > 0 && (s.wins/s.total) >= 0.5 ? 'var(--color-win)' : 'var(--color-lose)', fontWeight: '600' }}>
              WR {s.total > 0 ? ((s.wins / s.total) * 100).toFixed(0) : 0}%
            </span>
            <span style={{ color: 'var(--accent-secondary)', fontFamily: 'var(--font-mono)' }}>
              {s.total > 0 ? (s.rr / s.total).toFixed(2) : '0.00'}R avg
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Advanced stats (streaks, profit factor, drawdown)
function AdvancedStats({ trades }) {
  const sorted = [...trades].sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

  let maxWin = 0, maxLose = 0, curWin = 0, curLose = 0;
  let grossWin = 0, grossLose = 0;
  let equity = 0, peak = 0, maxDD = 0;

  sorted.forEach(t => {
    const isWin = ['win', 'partial_tp', 'sl+'].includes(t.hasilTrade);
    const pnl = t.profitNominal || 0;

    // Streaks
    if (isWin) { curWin++; curLose = 0; maxWin = Math.max(maxWin, curWin); }
    else { curLose++; curWin = 0; maxLose = Math.max(maxLose, curLose); }

    // Profit factor
    if (pnl > 0) grossWin += pnl;
    else if (pnl < 0) grossLose += Math.abs(pnl);

    // Drawdown
    equity += pnl;
    if (equity > peak) peak = equity;
    const dd = peak - equity;
    if (dd > maxDD) maxDD = dd;
  });

  const profitFactor = grossLose > 0 ? (grossWin / grossLose).toFixed(2) : grossWin > 0 ? '∞' : '0';

  const chips = [
    { icon: <Flame size={18} style={{ color: '#f97316' }} />, label: 'Max Win Streak', value: `${maxWin}x`, color: 'var(--color-win)' },
    { icon: <Snowflake size={18} style={{ color: '#38bdf8' }} />, label: 'Max Lose Streak', value: `${maxLose}x`, color: 'var(--color-lose)' },
    { icon: <Percent size={18} style={{ color: 'var(--accent)' }} />, label: 'Profit Factor', value: profitFactor, color: parseFloat(profitFactor) >= 1 ? 'var(--color-win)' : 'var(--color-lose)' },
    { icon: <ArrowDownRight size={18} style={{ color: 'var(--color-lose)' }} />, label: 'Max Drawdown', value: `$${maxDD.toFixed(0)}`, color: 'var(--color-lose)' },
  ];

  return (
    <div className="stats-grid-4">
      {chips.map(c => (
        <div key={c.label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 'var(--radius-md)', padding: '14px 10px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '6px', textAlign: 'center' }}>
          {c.icon}
          <div style={{ fontSize: '20px', fontWeight: '800', color: c.color, fontFamily: 'var(--font-mono)' }}>{c.value}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────── */
export default function Dashboard({ dbTrigger, userId }) {
  const [trades, setTrades] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    getJurnal().then(data => {
      setTrades(data.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)));
    });
  }, [dbTrigger]);

  // KPI
  const totalTrades = trades.length;
  const winTrades = trades.filter(t => ['win', 'partial_tp', 'sl+'].includes(t.hasilTrade)).length;
  const winRate = totalTrades > 0 ? ((winTrades / totalTrades) * 100).toFixed(1) : 0;
  const totalNetPnL = trades.reduce((acc, cur) => acc + (cur.profitNominal || 0), 0).toFixed(2);
  const cumulativeRR = trades.reduce((acc, cur) => acc + (cur.rrDiperoleh || 0), 0).toFixed(2);
  const avgRR = totalTrades > 0 ? (parseFloat(cumulativeRR) / totalTrades).toFixed(2) : '0.00';

  // Psychology stats
  const psychologyStats = useMemo(() => {
    const errorTypes = {
      fomo: { name: 'FOMO', color: '#f97316', count: 0, pnl: 0, wins: 0 },
      serakah: { name: 'Serakah', color: '#ef4444', count: 0, pnl: 0, wins: 0 },
      takut: { name: 'Takut (Cut Early)', color: '#eab308', count: 0, pnl: 0, wins: 0 },
      geser_sl: { name: 'Geser SL', color: '#ec4899', count: 0, pnl: 0, wins: 0 },
      overtrade: { name: 'Overtrade', color: '#8b5cf6', count: 0, pnl: 0, wins: 0 },
    };
    trades.forEach(t => {
      (t.faktorKesalahan || []).forEach(err => {
        if (errorTypes[err]) {
          errorTypes[err].count++;
          errorTypes[err].pnl += t.profitNominal || 0;
          if (['win', 'partial_tp', 'sl+'].includes(t.hasilTrade)) errorTypes[err].wins++;
        }
      });
    });
    return errorTypes;
  }, [trades]);

  // Calendar
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevTotalDays = new Date(year, month, 0).getDate();
  const calendarCells = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) calendarCells.push({ day: prevTotalDays - i, isCurrentMonth: false, dateString: `${year}-${String(month).padStart(2,'0')}-${String(prevTotalDays-i).padStart(2,'0')}` });
  for (let i = 1; i <= totalDays; i++) calendarCells.push({ day: i, isCurrentMonth: true, dateString: `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}` });
  while (calendarCells.length < 42) calendarCells.push({ day: calendarCells.length - firstDayIndex - totalDays + 1, isCurrentMonth: false, dateString: '' });

  const getDailyPnL = (dateStr) => {
    const dayTrades = trades.filter(t => t.tanggal === dateStr);
    if (!dayTrades.length) return null;
    return { pnl: dayTrades.reduce((a, c) => a + (c.profitNominal || 0), 0), count: dayTrades.length };
  };

  const SectionHeader = ({ icon, title, subtitle }) => (
    <div style={{ marginBottom: '20px' }}>
      <div className="flex-align-center gap-10">
        {icon}
        <h2 style={{ fontSize: '17px', fontWeight: '700', margin: 0, color: '#fff' }}>{title}</h2>
      </div>
      {subtitle && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', marginLeft: '28px' }}>{subtitle}</p>}
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Dashboard Analisis</h1>
          <p>Tinjauan menyeluruh performa trading dan evaluasi psikologi Anda.</p>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="dashboard-grid">
        {[
          { icon: <Activity size={22}/>, label: 'Total Trades', value: totalTrades, color: '#fff' },
          { icon: <Award size={22}/>, label: 'Win Rate', value: `${winRate}%`, color: 'var(--color-win)' },
          { icon: <DollarSign size={22}/>, label: 'Net Profit (USD)', value: `${totalNetPnL >= 0 ? '+' : ''}$${totalNetPnL}`, color: parseFloat(totalNetPnL) >= 0 ? 'var(--color-win)' : 'var(--color-lose)' },
          { icon: <TrendingUp size={22}/>, label: 'Kumulatif R:R', value: `${cumulativeRR >= 0 ? '+' : ''}${cumulativeRR}R`, color: 'var(--accent-secondary)' },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="glass-card kpi-card">
            <div className="kpi-icon-container" style={{ color }}>{icon}</div>
            <div className="kpi-details"><span>{label}</span><h3 style={{ color }}>{value}</h3></div>
          </div>
        ))}
      </div>

      {/* ── ROW 1: Equity Curve + Donut ── */}
      <div className="dashboard-layout-split" style={{ marginTop: '24px' }}>
        <div className="glass-card">
          <SectionHeader
            icon={<TrendingUp size={18} style={{ color: 'var(--color-win)' }} />}
            title="Equity Curve (Kurva Modal)"
            subtitle="Akumulasi profit/loss USD dari setiap trade berurutan"
          />
          <EquityCurve trades={trades} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span>Trade Pertama</span>
            <span style={{ color: parseFloat(totalNetPnL) >= 0 ? 'var(--color-win)' : 'var(--color-lose)', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
              Net: {parseFloat(totalNetPnL) >= 0 ? '+' : ''}${totalNetPnL}
            </span>
            <span>Trade Terakhir</span>
          </div>
        </div>

        <div className="glass-card">
          <SectionHeader
            icon={<BarChart2 size={18} style={{ color: 'var(--accent)' }} />}
            title="Distribusi Hasil Trade"
            subtitle="Proporsi WIN / LOSE / PARTIAL / BE / SL+"
          />
          <DonutChart trades={trades} />
        </div>
      </div>

      {/* ── ROW 2: Monthly Bars + Per Pair ── */}
      <div className="dashboard-layout-split" style={{ marginTop: '20px' }}>
        <div className="glass-card">
          <SectionHeader
            icon={<Calendar size={18} style={{ color: 'var(--accent-secondary)' }} />}
            title="PnL per Bulan (USD)"
            subtitle="Total profit/loss kumulatif 8 bulan terakhir"
          />
          <MonthlyPnLBars trades={trades} />
        </div>

        <div className="glass-card">
          <SectionHeader
            icon={<Zap size={18} style={{ color: '#f97316' }} />}
            title="Performa per Pair"
            subtitle="Win rate dan total PnL per instrumen trading"
          />
          <PairPerformance trades={trades} />
        </div>
      </div>

      {/* ── ROW 3: Calendar + Psychology ── */}
      <div className="dashboard-layout-split" style={{ marginTop: '20px' }}>
        {/* Kalender PnL */}
        <div className="glass-card calendar-widget">
          <div className="calendar-header">
            <div className="flex-align-center gap-10">
              <Calendar size={18} className="text-win" />
              <h2 style={{ fontSize: '17px', margin: 0 }}>Kalender PnL Harian</h2>
            </div>
            <div className="flex-align-center gap-10">
              <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="btn btn-secondary" style={{ padding: '6px 12px' }}>
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontWeight: '600', fontSize: '13px', minWidth: '110px', textAlign: 'center' }}>
                {monthNames[month]} {year}
              </span>
              <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="btn btn-secondary" style={{ padding: '6px 12px' }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="calendar-days-grid">
            {['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(d => <div key={d} className="calendar-day-label">{d}</div>)}
          </div>
          <div className="calendar-grid">
            {calendarCells.map((cell, idx) => {
              const dailyData = getDailyPnL(cell.dateString);
              const pnlClass = dailyData ? (dailyData.pnl > 0 ? 'pnl-positive' : dailyData.pnl < 0 ? 'pnl-negative' : 'pnl-neutral') : '';
              return (
                <div key={idx} className={`calendar-cell ${cell.isCurrentMonth ? '' : 'other-month'} ${pnlClass} ${dailyData ? 'has-trade' : ''}`}
                  title={dailyData ? `${dailyData.count} trade | ${dailyData.pnl >= 0 ? '+' : ''}$${dailyData.pnl}` : ''}>
                  <div className="cell-date">{cell.day}</div>
                  {dailyData && <div className="cell-pnl">{dailyData.pnl !== 0 ? `${dailyData.pnl > 0 ? '+' : ''}$${dailyData.pnl}` : 'BE'}</div>}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '14px', fontSize: '11px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
            {[['rgba(16,185,129,0.15)', 'var(--color-win)', 'Profit'], ['rgba(244,63,94,0.15)', 'var(--color-lose)', 'Loss'], ['rgba(99,102,241,0.15)', 'var(--color-be)', 'Break Even']].map(([bg, border, label]) => (
              <span key={label} className="flex-align-center" style={{ gap: '5px' }}>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', background: bg, border: `1px solid ${border}`, borderRadius: '2px' }} />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Analisis Psikologi — updated visual with bars */}
        <div className="glass-card">
          <SectionHeader
            icon={<Brain size={18} style={{ color: 'var(--accent)' }} />}
            title="Dampak Faktor Psikologis"
            subtitle="Total USD yang terdampak setiap faktor emosi negatif"
          />
          {Object.values(psychologyStats).every(s => s.count === 0) ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
              <AlertCircle size={28} style={{ marginBottom: '10px', opacity: 0.4 }} />
              <p>Belum ada faktor emosi yang direkam.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(psychologyStats).map(([key, s]) => {
                const pct = totalTrades > 0 ? (s.count / totalTrades) * 100 : 0;
                return (
                  <div key={key}>
                    <div className="flex-between" style={{ marginBottom: '5px' }}>
                      <div className="flex-align-center gap-10">
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '13px', fontWeight: '600', color: s.count > 0 ? '#fff' : 'var(--text-muted)' }}>{s.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', fontSize: '11px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{s.count}x</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: s.pnl >= 0 ? 'var(--color-win)' : 'var(--color-lose)' }}>
                          {s.pnl >= 0 ? '+' : ''}${s.pnl}
                        </span>
                      </div>
                    </div>
                    <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: s.color, borderRadius: '999px',
                        boxShadow: `0 0 8px ${s.color}60`, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 4: Trade Type + Advanced Stats ── */}
      <div className="dashboard-layout-split" style={{ marginTop: '20px' }}>
        <div className="glass-card">
          <SectionHeader
            icon={<Target size={18} style={{ color: '#06b6d4' }} />}
            title="Performa per Jenis Trade"
            subtitle="Win rate dan rata-rata R setiap setup type"
          />
          <TradeTypeStats trades={trades} />
        </div>

        <div className="glass-card">
          <SectionHeader
            icon={<Activity size={18} style={{ color: '#a78bfa' }} />}
            title="Statistik Lanjutan"
            subtitle="Streak, profit factor, dan max drawdown"
          />
          <AdvancedStats trades={trades} />
        </div>
      </div>
    </div>
  );
}
