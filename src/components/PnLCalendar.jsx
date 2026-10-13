import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Camera, ArrowLeftRight, Check } from 'lucide-react';

export default function PnLCalendar({ trades = [] }) {
  // Local current date (default to today)
  const today = useMemo(() => new Date(), []);
  const [currentDate, setCurrentDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => {
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [copied, setCopied] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const shortMonthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const weekWords = ['Week One', 'Week Two', 'Week Three', 'Week Four', 'Week Five', 'Week Six'];

  // Helper date string YYYY-MM-DD
  const formatDateStr = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const todayStr = formatDateStr(today.getFullYear(), today.getMonth() + 1, today.getDate());

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(todayStr);
  };

  // Group trades by date string YYYY-MM-DD
  const tradesByDate = useMemo(() => {
    const map = {};
    trades.forEach(t => {
      if (!t.tanggal) return;
      const dKey = t.tanggal.slice(0, 10);
      if (!map[dKey]) {
        map[dKey] = { count: 0, pnl: 0, trades: [] };
      }
      map[dKey].count += 1;
      map[dKey].pnl += (t.profitNominal || 0);
      map[dKey].trades.push(t);
    });
    return map;
  }, [trades]);

  // Monthly aggregate PnL and active trading days count
  const { monthlyPnL, monthlyTradingDays } = useMemo(() => {
    let pnl = 0;
    const daysSet = new Set();
    trades.forEach(t => {
      if (!t.tanggal) return;
      const parts = t.tanggal.slice(0, 10).split('-').map(Number);
      if (parts[0] === year && (parts[1] - 1) === month) {
        pnl += (t.profitNominal || 0);
        daysSet.add(t.tanggal.slice(0, 10));
      }
    });
    return {
      monthlyPnL: pnl,
      monthlyTradingDays: daysSet.size
    };
  }, [trades, year, month]);

  // Format currency with 2 decimals (e.g. $117.09 or -$107.07)
  const formatSummaryCurrency = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '$0.00';
    const isNeg = val < 0;
    const abs = Math.abs(val);
    const formatted = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return isNeg ? `-$${formatted}` : `$${formatted}`;
  };

  // Format day cell PnL: e.g. $12, -$19, $3, $7, $10, $53
  const formatDayPnL = (val) => {
    if (val === undefined || val === null || isNaN(val) || val === 0) return '$0';
    const isNeg = val < 0;
    const abs = Math.abs(val);
    const formatted = abs % 1 === 0
      ? abs.toLocaleString('en-US')
      : abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return isNeg ? `-$${formatted}` : `$${formatted}`;
  };

  // Handle Share click
  const handleShare = () => {
    const text = `Daily Summary - ${monthNames[month]} ${year}\nPnL: ${formatSummaryCurrency(monthlyPnL)} | Days: ${monthlyTradingDays}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  // Build calendar grid days
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun, 6 = Sat
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalSlots = firstDayOfWeek + daysInMonth;
  const numWeeks = Math.ceil(totalSlots / 7);

  // Calendar cells: empty padding + days in month
  const calendarCells = [];
  // 1. Empty slots before 1st of month
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push({ type: 'empty', key: `empty-${i}` });
  }
  // 2. Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDateStr(year, month + 1, d);
    calendarCells.push({
      type: 'day',
      key: `day-${d}`,
      dayNum: d,
      dateString: dateStr,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDate,
      data: tradesByDate[dateStr] || null
    });
  }

  // Calculate Weekly Summaries
  const weeklySummaries = useMemo(() => {
    const list = [];
    for (let w = 0; w < numWeeks; w++) {
      const weekStartDate = new Date(year, month, 1 - firstDayOfWeek + (w * 7));
      const weekEndDate = new Date(year, month, 1 - firstDayOfWeek + (w * 7) + 6);

      const startYMD = formatDateStr(weekStartDate.getFullYear(), weekStartDate.getMonth() + 1, weekStartDate.getDate());
      const endYMD = formatDateStr(weekEndDate.getFullYear(), weekEndDate.getMonth() + 1, weekEndDate.getDate());

      const startMonthName = shortMonthNames[weekStartDate.getMonth()];
      const endMonthName = shortMonthNames[weekEndDate.getMonth()];
      const rangeLabel = `${startMonthName} ${weekStartDate.getDate()} - ${endMonthName} ${weekEndDate.getDate()}`;

      // Sum trades in this 7-day span
      let weekPnL = 0;
      const weekDaysSet = new Set();
      trades.forEach(t => {
        if (!t.tanggal) return;
        const dStr = t.tanggal.slice(0, 10);
        if (dStr >= startYMD && dStr <= endYMD) {
          weekPnL += (t.profitNominal || 0);
          weekDaysSet.add(dStr);
        }
      });

      list.push({
        weekTitle: weekWords[w] || `Week ${w + 1}`,
        rangeLabel,
        hasTrades: weekDaysSet.size > 0,
        weekPnL,
        daysCount: weekDaysSet.size
      });
    }
    return list;
  }, [year, month, firstDayOfWeek, numWeeks, trades]);

  return (
    <div className="pnl-summary-card">
      {/* ── Top Bar: Title & Share ── */}
      <div className="pnl-summary-header">
        <h3 className="pnl-summary-title">Daily Summary</h3>
        <button
          type="button"
          onClick={handleShare}
          className="pnl-share-button"
          title="Share Daily Summary"
        >
          {copied ? <Check size={16} strokeWidth={2.2} /> : <Camera size={16} strokeWidth={2} />}
          <span>{copied ? 'Copied' : 'Share'}</span>
        </button>
      </div>

      {/* ── Second Bar: Month Navigation & Total Pill ── */}
      <div className="pnl-summary-controls">
        <div className="pnl-nav-group">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="pnl-ctrl-btn pnl-ctrl-square"
            title="Bulan sebelumnya"
          >
            <ChevronLeft size={18} strokeWidth={2.2} />
          </button>
          
          <div className="pnl-current-month-label">
            {monthNames[month]} {year}
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="pnl-ctrl-btn pnl-ctrl-square"
            title="Bulan berikutnya"
          >
            <ChevronRight size={18} strokeWidth={2.2} />
          </button>

          <button
            type="button"
            onClick={handleToday}
            className="pnl-ctrl-btn pnl-ctrl-today"
            title="Ke hari ini"
          >
            <Calendar size={15} strokeWidth={2} />
            <span>Today</span>
          </button>
        </div>

        {/* Right Pill: PnL and Days */}
        <div className="pnl-stats-pill">
          <span className="pnl-pill-label">PnL:</span>
          <span className={`pnl-pill-val ${monthlyPnL >= 0 ? 'pnl-green' : 'pnl-red'}`}>
            {formatSummaryCurrency(monthlyPnL)}
          </span>
          <div className="pnl-pill-divider" />
          <span className="pnl-pill-label">Days:</span>
          <span className="pnl-pill-val pnl-pill-days">
            {monthlyTradingDays}
          </span>
        </div>
      </div>

      {/* ── Main Layout: Calendar Grid (Left) + Weekly Summary (Right) ── */}
      <div className="pnl-main-layout">
        {/* Left: 7-day Calendar */}
        <div className="pnl-calendar-section">
          {/* Weekday headers: Sun - Sat */}
          <div className="pnl-weekdays-row">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="pnl-weekday-label">
                {d}
              </div>
            ))}
          </div>

          {/* Grid Cells */}
          <div className="pnl-days-grid">
            {calendarCells.map((cell) => {
              if (cell.type === 'empty') {
                return <div key={cell.key} className="pnl-empty-cell" />;
              }

              const { dayNum, isToday, isSelected, data, dateString } = cell;
              const hasTrades = Boolean(data && data.count > 0);
              const isCellActiveToday = isToday || isSelected;

              return (
                <div
                  key={cell.key}
                  onClick={() => setSelectedDate(dateString)}
                  className={`pnl-date-cell ${isCellActiveToday ? 'is-today-active' : ''} ${hasTrades ? 'has-trades' : ''}`}
                  title={hasTrades ? `${dateString}: ${data.count} trade(s), PnL ${formatSummaryCurrency(data.pnl)}` : dateString}
                >
                  {/* Top-left Day Number */}
                  <span className={`pnl-cell-number ${hasTrades ? 'number-dark' : 'number-muted'} ${isCellActiveToday ? 'number-today' : ''}`}>
                    {dayNum}
                  </span>

                  {/* Bottom-right Trade Info (only if trades exist) */}
                  {hasTrades && (
                    <div className="pnl-cell-trade-info">
                      <div className="pnl-cell-count-row">
                        <span className="pnl-cell-count">{data.count}</span>
                        <ArrowLeftRight size={11} strokeWidth={2.4} className="pnl-cell-arrow-icon" />
                      </div>
                      <div className={`pnl-cell-pnl-val ${data.pnl >= 0 ? 'pnl-green' : 'pnl-red'}`}>
                        {formatDayPnL(data.pnl)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Weekly Summary Column */}
        <div className="pnl-weekly-section">
          <div className="pnl-weekly-header-title">
            Weekly Summary
          </div>

          <div className="pnl-weekly-cards-stack">
            {weeklySummaries.map((w, idx) => (
              <div key={idx} className="pnl-weekly-card">
                <div className="pnl-weekly-card-top">
                  <span className="pnl-weekly-name">{w.weekTitle}</span>
                  <span className="pnl-weekly-range">{w.rangeLabel}</span>
                </div>

                <div className="pnl-weekly-card-bottom">
                  {w.hasTrades ? (
                    <>
                      <div className="pnl-weekly-stat">
                        <span className="pnl-weekly-stat-lbl">PnL:</span>{' '}
                        <span className={`pnl-weekly-stat-num ${w.weekPnL >= 0 ? 'pnl-green' : 'pnl-red'}`}>
                          {formatSummaryCurrency(w.weekPnL)}
                        </span>
                      </div>
                      <div className="pnl-weekly-stat">
                        <span className="pnl-weekly-stat-lbl">Days:</span>{' '}
                        <span className="pnl-weekly-stat-num pnl-days-count">
                          {w.daysCount}
                        </span>
                      </div>
                    </>
                  ) : (
                    <span className="pnl-weekly-no-trades">No trades</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
