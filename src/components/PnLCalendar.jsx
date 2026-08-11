import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

export default function PnLCalendar({ trades = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 11)); // Default to Aug 2026 or current date
  const [starredDates, setStarredDates] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('starred_calendar_days') || '[]');
    } catch {
      return [];
    }
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed (7 = Agustus)
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Helper date string format YYYY-MM-DD
  const formatDateStr = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  // Today string
  const today = new Date();
  const todayStr = formatDateStr(today.getFullYear(), today.getMonth() + 1, today.getDate());

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Toggle star
  const toggleStar = (dateStr, e) => {
    e.stopPropagation();
    setStarredDates(prev => {
      const next = prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr];
      try {
        localStorage.setItem('starred_calendar_days', JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
  };

  // Calculate Monthly PnL for selected month & year
  const monthlyPnL = trades.reduce((sum, t) => {
    if (!t.tanggal) return sum;
    const [tYear, tMonth] = t.tanggal.split('-').map(Number);
    if (tYear === year && (tMonth - 1) === month) {
      return sum + (t.profitNominal || 0);
    }
    return sum;
  }, 0);

  // Currency Formatter matching screenshot format e.g. -$1,119.00 or $8.00
  const formatCurrency = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '$0.00';
    if (val === 0) return '$0.00';
    const isNeg = val < 0;
    const absVal = Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return isNeg ? `-$${absVal}` : `$${absVal}`;
  };

  // 1st day of month weekday (0 = Sun, 6 = Sat)
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  // Grid Cells Construction
  const allCells = [];

  // 1. Previous month padding cells
  const prevYear = month === 0 ? year - 1 : year;
  const prevMonthNum = month === 0 ? 12 : month;
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthTotalDays - i;
    const dateString = formatDateStr(prevYear, prevMonthNum, dayNum);
    allCells.push({ day: dayNum, isCurrentMonth: false, dateString });
  }

  // 2. Current month cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dateString = formatDateStr(year, month + 1, d);
    allCells.push({ day: d, isCurrentMonth: true, dateString });
  }

  // 3. Next month padding cells to complete 7-day week
  const nextYear = month === 11 ? year + 1 : year;
  const nextMonthNum = month === 11 ? 1 : month + 2;
  let nextDay = 1;
  while (allCells.length % 7 !== 0) {
    const dateString = formatDateStr(nextYear, nextMonthNum, nextDay);
    allCells.push({ day: nextDay, isCurrentMonth: false, dateString });
    nextDay++;
  }

  // Group into 7-day rows + calculate weekly summaries
  const rows = [];
  for (let i = 0; i < allCells.length; i += 7) {
    const weekDays = allCells.slice(i, i + 7);
    let weekPnL = 0;
    let weekTradeCount = 0;

    weekDays.forEach(cell => {
      const dayTrades = trades.filter(t => t.tanggal === cell.dateString);
      if (dayTrades.length) {
        weekTradeCount += dayTrades.length;
        weekPnL += dayTrades.reduce((acc, cur) => acc + (cur.profitNominal || 0), 0);
      }
    });

    rows.push({
      weekIndex: Math.floor(i / 7) + 1,
      days: weekDays,
      weekPnL,
      weekTradeCount
    });
  }

  // Helper to fetch trades for specific date
  const getDailyData = (dateStr) => {
    const dayTrades = trades.filter(t => t.tanggal === dateStr);
    if (!dayTrades.length) return null;
    const pnl = dayTrades.reduce((a, c) => a + (c.profitNominal || 0), 0);
    return { pnl, count: dayTrades.length };
  };

  return (
    <div className="pnl-calendar-container">
      {/* Calendar Header */}
      <div className="pnl-calendar-header">
        <button onClick={handlePrevMonth} className="pnl-nav-btn" title="Bulan Sebelumnya">
          <ChevronLeft size={20} />
        </button>

        <div className="pnl-header-title">
          <h2 className="pnl-month-year">{monthNames[month]} {year}</h2>
          <div className="pnl-monthly-sum">
            <span>Monthly P/L: </span>
            <span className={`monthly-pnl-val ${monthlyPnL > 0 ? 'text-win' : monthlyPnL < 0 ? 'text-lose' : 'text-neutral'}`}>
              {formatCurrency(monthlyPnL)}
            </span>
          </div>
        </div>

        <button onClick={handleNextMonth} className="pnl-nav-btn" title="Bulan Berikutnya">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Calendar Grid Container (8 Columns: SUN - SAT + WEEK) */}
      <div className="pnl-calendar-wrapper">
        <div className="pnl-days-header">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'WEEK'].map(d => (
            <div key={d} className="pnl-day-label">{d}</div>
          ))}
        </div>

        <div className="pnl-grid-body">
          {rows.map((row) => (
            <React.Fragment key={row.weekIndex}>
              {/* Days SUN through SAT */}
              {row.days.map((cell, idx) => {
                const dailyData = getDailyData(cell.dateString);
                const isToday = cell.dateString === todayStr;
                const isStarred = starredDates.includes(cell.dateString);

                let statusClass = '';
                if (dailyData) {
                  if (dailyData.pnl > 0) statusClass = 'is-win';
                  else if (dailyData.pnl < 0) statusClass = 'is-lose';
                  else statusClass = 'is-zero';
                }

                return (
                  <div
                    key={`${row.weekIndex}-${idx}`}
                    className={`pnl-day-cell ${!cell.isCurrentMonth ? 'other-month' : ''} ${statusClass} ${isToday ? 'is-today' : ''}`}
                    title={dailyData ? `${cell.dateString}: ${dailyData.count} trades | PnL ${formatCurrency(dailyData.pnl)}` : cell.dateString}
                  >
                    <div className="cell-top-bar">
                      <div className="cell-date-group">
                        <span className="cell-day-num">{cell.day}</span>
                        {isToday && <span className="today-badge">HARI INI</span>}
                      </div>
                      <button
                        type="button"
                        className="star-btn"
                        onClick={(e) => toggleStar(cell.dateString, e)}
                        title={isStarred ? "Hapus favorit" : "Tandai favorit"}
                      >
                        <Star size={13} fill={isStarred ? "#f59e0b" : "none"} color={isStarred ? "#f59e0b" : "rgba(255,255,255,0.25)"} />
                      </button>
                    </div>

                    <div className="cell-content">
                      {dailyData ? (
                        <>
                          <div className={`cell-pnl-amount ${dailyData.pnl > 0 ? 'text-win' : dailyData.pnl < 0 ? 'text-lose' : 'text-neutral'}`}>
                            {formatCurrency(dailyData.pnl)}
                          </div>
                          <div className="cell-trade-count">
                            {dailyData.count} Trade{dailyData.count > 1 ? 's' : ''}
                          </div>
                        </>
                      ) : (
                        <div className="cell-no-trades">No Trades</div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* 8th Column: WEEK Summary Cell */}
              <div className={`pnl-day-cell week-summary-cell ${row.weekPnL > 0 ? 'is-win-summary' : row.weekPnL < 0 ? 'is-lose-summary' : ''}`}>
                <div className="cell-top-bar">
                  <span className="week-label-title">WEEK {row.weekIndex}</span>
                </div>
                <div className="cell-content">
                  <div className={`cell-pnl-amount ${row.weekPnL > 0 ? 'text-win' : row.weekPnL < 0 ? 'text-lose' : 'text-neutral'}`}>
                    {formatCurrency(row.weekPnL)}
                  </div>
                  <div className="cell-trade-count">
                    {row.weekTradeCount > 0 ? `${row.weekTradeCount} Trade${row.weekTradeCount > 1 ? 's' : ''}` : 'No entries'}
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
