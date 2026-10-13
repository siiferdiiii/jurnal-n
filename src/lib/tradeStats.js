/* ─────────────────────────────────────────────────────────────
   CENTRALIZED TRADE STATISTICS HELPER (SINGLE SOURCE OF TRUTH)
   Digunakan serentak di:
   - Dashboard.jsx
   - Analytics.jsx
   - Profile.jsx
   - Methods.jsx
   - TopTraders.jsx / api.js
   - TraderProfile.jsx
───────────────────────────────────────────────────────────── */

/**
 * Memeriksa apakah suatu hasil trade tergolong WIN.
 * Mencakup: 'win', 'partial_tp', 'sl+'
 */
export function isWinTrade(hasil) {
  if (!hasil) return false;
  const val = String(hasil).toLowerCase().trim();
  return ['win', 'partial_tp', 'sl+'].includes(val);
}

/**
 * Memeriksa apakah suatu hasil trade tergolong LOSE.
 * Mencakup: 'lose', 'sl'
 */
export function isLossTrade(hasil) {
  if (!hasil) return false;
  const val = String(hasil).toLowerCase().trim();
  return ['lose', 'sl'].includes(val);
}

/**
 * Memeriksa apakah suatu hasil trade tergolong BREAK EVEN.
 * Mencakup: 'break_even', 'be'
 */
export function isBeTrade(hasil) {
  if (!hasil) return false;
  const val = String(hasil).toLowerCase().trim();
  return ['break_even', 'be'].includes(val);
}

/**
 * Menormalisasi string hasil trade ke kategori baku:
 * 'win' | 'partial_tp' | 'sl+' | 'break_even' | 'lose' | 'other'
 */
export function normalizeTradeOutcome(hasil) {
  if (!hasil) return null;
  const val = String(hasil).toLowerCase().trim();
  if (['win'].includes(val)) return 'win';
  if (['partial_tp'].includes(val)) return 'partial_tp';
  if (['sl+'].includes(val)) return 'sl+';
  if (['break_even', 'be'].includes(val)) return 'break_even';
  if (['lose', 'sl'].includes(val)) return 'lose';
  return val;
}

/**
 * Kalkulasi statistik lengkap dari sekumpulan trade.
 * Menjamin 100% konsistensi metrik (Win Rate, RR, PnL, Streaks, dll)
 * di seluruh halaman aplikasi.
 *
 * @param {Array} rawTrades - Daftar trade (baik camelCase maupun snake_case)
 * @returns {Object} Statistik trade yang terstandardisasi
 */
export function calculateTradeStats(rawTrades = []) {
  const trades = Array.isArray(rawTrades) ? rawTrades : [];
  const allCount = trades.length;

  if (allCount === 0) {
    return {
      total: 0,
      allTradesCount: 0,
      wins: 0,
      losses: 0,
      breakEvens: 0,
      wr: '0.0',
      winRate: 0,
      lossRate: 0,
      beRate: 0,
      pnl: 0,
      totalPnl: 0,
      totalRR: 0,
      avgRR: '0.00',
      avgRr: 0,
      grossProfit: 0,
      grossLoss: 0,
      profitFactor: '0.00',
      expectancy: '0.00',
      maxWinStreak: 0,
      maxLoseStreak: 0,
      maxDD: '0.00',
    };
  }

  // Filter trade yang memiliki outcome / hasil evaluasi trade
  // (Jika ada open position tanpa outcome, tidak menurunkan WR secara keliru)
  const evaluatedTrades = trades.filter((t) => {
    const outcome = t.hasilTrade ?? t.hasil_trade;
    return outcome !== null && outcome !== undefined && String(outcome).trim() !== '';
  });

  // Jika tidak ada trade dengan outcome sama sekali (semua masih open), gunakan allCount
  const total = evaluatedTrades.length > 0 ? evaluatedTrades.length : allCount;
  const targetSubset = evaluatedTrades.length > 0 ? evaluatedTrades : trades;

  const wins = targetSubset.filter((t) => isWinTrade(t.hasilTrade ?? t.hasil_trade)).length;
  const losses = targetSubset.filter((t) => isLossTrade(t.hasilTrade ?? t.hasil_trade)).length;
  const breakEvens = targetSubset.filter((t) => isBeTrade(t.hasilTrade ?? t.hasil_trade)).length;

  const numWr = total > 0 ? Number(((wins / total) * 100).toFixed(1)) : 0;
  const strWr = total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0';
  const lossRate = total > 0 ? Number(((losses / total) * 100).toFixed(1)) : 0;
  const beRate = total > 0 ? Number(((breakEvens / total) * 100).toFixed(1)) : 0;

  // PnL & RR
  const pnl = trades.reduce((acc, t) => acc + (Number(t.profitNominal ?? t.profit_nominal) || 0), 0);
  const totalRR = trades.reduce((acc, t) => acc + (Number(t.rrDiperoleh ?? t.rr_diperoleh) || 0), 0);
  const avgRR = total > 0 ? (totalRR / total).toFixed(2) : '0.00';
  const numAvgRr = total > 0 ? Number((totalRR / total).toFixed(2)) : 0;

  // Profit Factor
  const grossProfit = trades.reduce((acc, t) => {
    const val = Number(t.profitNominal ?? t.profit_nominal) || 0;
    return acc + (val > 0 ? val : 0);
  }, 0);

  const grossLoss = trades.reduce((acc, t) => {
    const val = Number(t.profitNominal ?? t.profit_nominal) || 0;
    return acc + (val < 0 ? Math.abs(val) : 0);
  }, 0);

  const profitFactor = grossLoss > 0
    ? (grossProfit / grossLoss).toFixed(2)
    : grossProfit > 0
    ? '∞'
    : '0.00';

  const expectancy = total > 0 ? (pnl / total).toFixed(2) : '0.00';

  // Streaks & Drawdown (Urutkan tanggal terlama -> terbaru)
  const sorted = [...trades].sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
  let curWin = 0, curLose = 0, maxWin = 0, maxLose = 0;
  let equity = 0, peak = 0, maxDD = 0;

  sorted.forEach((t) => {
    const outcome = t.hasilTrade ?? t.hasil_trade;
    const isWin = isWinTrade(outcome);
    const isLose = isLossTrade(outcome);
    const nominal = Number(t.profitNominal ?? t.profit_nominal) || 0;

    if (isWin) {
      curWin++;
      curLose = 0;
      if (curWin > maxWin) maxWin = curWin;
    } else if (isLose) {
      curLose++;
      curWin = 0;
      if (curLose > maxLose) maxLose = curLose;
    } else {
      // Break-even atau open trade: mereset win & lose streak
      curWin = 0;
      curLose = 0;
    }

    equity += nominal;
    if (equity > peak) peak = equity;
    const dd = peak - equity;
    if (dd > maxDD) maxDD = dd;
  });

  return {
    total,
    allTradesCount: allCount,
    wins,
    losses,
    breakEvens,
    wr: strWr,
    winRate: numWr,
    lossRate,
    beRate,
    pnl: Number(pnl.toFixed(2)),
    totalPnl: Number(pnl.toFixed(2)),
    totalRR: Number(totalRR.toFixed(2)),
    avgRR,
    avgRr: numAvgRr,
    grossProfit: Number(grossProfit.toFixed(2)),
    grossLoss: Number(grossLoss.toFixed(2)),
    profitFactor,
    expectancy,
    maxWinStreak: maxWin,
    maxLoseStreak: maxLose,
    maxDD: maxDD.toFixed(2),
  };
}
