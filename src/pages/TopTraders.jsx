import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Search,
  TrendingUp,
  Target,
  Zap,
  DollarSign,
  ChevronRight,
  Users,
  BarChart2,
  Award,
  Flame,
  SortAsc,
  RefreshCw,
} from 'lucide-react';
import { getPublicTraders } from '../lib/api';

/* ── Rank badge ── */
function RankBadge({ rank }) {
  const badges = {
    1: { color: '#FFD700', bg: 'rgba(255,215,0,0.15)', label: '🥇' },
    2: { color: '#C0C0C0', bg: 'rgba(192,192,192,0.15)', label: '🥈' },
    3: { color: '#CD7F32', bg: 'rgba(205,127,50,0.15)', label: '🥉' },
  };
  if (badges[rank]) {
    const { color, bg, label } = badges[rank];
    return (
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px',
        background: bg, border: `1px solid ${color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '18px', flexShrink: 0,
      }}>
        {label}
      </div>
    );
  }
  return (
    <div style={{
      width: '36px', height: '36px', borderRadius: '10px',
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--text-muted)', fontWeight: '700', fontSize: '14px', flexShrink: 0,
    }}>
      {rank}
    </div>
  );
}

/* ── Single Trader Card ── */
function TraderCard({ trader, rank, onClick }) {
  const winRateColor = trader.winRate >= 60
    ? 'var(--color-win)'
    : trader.winRate >= 40
    ? 'var(--color-be)'
    : 'var(--color-lose)';

  const initial = (trader.displayName || 'T')[0].toUpperCase();
  const avatarColors = ['#6366f1', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777'];
  const avatarColor = avatarColors[initial.charCodeAt(0) % avatarColors.length];

  return (
    <div
      className="trader-card"
      onClick={onClick}
      style={{ cursor: 'pointer', animationDelay: `${rank * 40}ms` }}
    >
      {/* Left: rank + avatar + info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
        <RankBadge rank={rank} />

        <div style={{
          width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
          background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}88)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', fontWeight: '800', color: '#fff',
          boxShadow: `0 0 12px ${avatarColor}40`,
        }}>
          {initial}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: '700', fontSize: '15px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {trader.displayName}
          </div>
          {trader.bio && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {trader.bio}
            </div>
          )}
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
            {trader.pairs} pair · {trader.total} trade
          </div>
        </div>
      </div>

      {/* Right: stats badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{ textAlign: 'center', padding: '6px 12px', borderRadius: '8px', background: `${winRateColor}15`, border: `1px solid ${winRateColor}30` }}>
          <div style={{ fontSize: '16px', fontWeight: '800', color: winRateColor }}>{trader.winRate}%</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>WR</div>
        </div>

        <div style={{ textAlign: 'center', padding: '6px 12px', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <div style={{ fontSize: '16px', fontWeight: '800', color: '#818cf8' }}>{trader.avgRr}R</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>Avg RR</div>
        </div>

        <div style={{
          textAlign: 'center', padding: '6px 12px', borderRadius: '8px',
          background: trader.totalPnl >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
          border: `1px solid ${trader.totalPnl >= 0 ? 'rgba(16,185,129,0.25)' : 'rgba(244,63,94,0.25)'}`,
        }}>
          <div style={{ fontSize: '15px', fontWeight: '800', color: trader.totalPnl >= 0 ? 'var(--color-win)' : 'var(--color-lose)' }}>
            {trader.totalPnl >= 0 ? '+' : ''}${Math.abs(trader.totalPnl).toLocaleString()}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>PnL</div>
        </div>

        <ChevronRight size={16} style={{ color: 'var(--text-muted)', marginLeft: '4px' }} />
      </div>
    </div>
  );
}

/* ── Skeleton Loader ── */
function SkeletonCard() {
  return (
    <div className="trader-card" style={{ pointerEvents: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
        <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '10px' }} />
        <div className="skeleton" style={{ width: '44px', height: '44px', borderRadius: '12px' }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ width: '140px', height: '14px', borderRadius: '6px', marginBottom: '6px' }} />
          <div className="skeleton" style={{ width: '90px', height: '11px', borderRadius: '6px' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        {[0,1,2].map(i => <div key={i} className="skeleton" style={{ width: '60px', height: '44px', borderRadius: '8px' }} />)}
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function TopTraders({ onSelectTrader }) {
  const [traders, setTraders]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(null);
  const [search,  setSearch]    = useState('');
  const [sortBy,  setSortBy]    = useState('winRate'); // winRate | totalPnl | total

  const load = () => {
    setLoading(true);
    setError(null);
    getPublicTraders()
      .then(setTraders)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    let list = traders;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.displayName.toLowerCase().includes(q) || (t.bio || '').toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'winRate')   return b.winRate - a.winRate;
      if (sortBy === 'totalPnl')  return b.totalPnl - a.totalPnl;
      if (sortBy === 'total')     return b.total - a.total;
      return 0;
    });
  }, [traders, search, sortBy]);

  // Global stats
  const totalPublic = traders.length;
  const avgWrAll = totalPublic > 0 ? (traders.reduce((s, t) => s + t.winRate, 0) / totalPublic).toFixed(1) : 0;
  const totalTradesAll = traders.reduce((s, t) => s + t.total, 0);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '960px', margin: '0 auto' }}>

      {/* ── Hero Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(6,182,212,0.08) 100%)',
        border: '1px solid rgba(99,102,241,0.2)', borderRadius: '16px',
        padding: '28px 32px', marginBottom: '24px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #6366f1, #0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}>
            <Trophy size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: 0 }}>Top Traders</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>Direktori trader publik Jurnal-N</p>
          </div>
        </div>

        {/* Summary stats */}
        <div style={{ display: 'flex', gap: '20px' }}>
          {[
            { icon: <Users size={14}/>, label: 'Trader Publik', value: totalPublic },
            { icon: <BarChart2 size={14}/>, label: 'Total Trade', value: totalTradesAll.toLocaleString() },
            { icon: <Flame size={14}/>, label: 'Rata-rata WR', value: `${avgWrAll}%` },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ color: 'var(--accent)' }}>{s.icon}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{s.label}:</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Controls ── */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
        <div className="search-input-wrapper" style={{ flex: 1 }}>
          <Search size={15} className="search-icon" />
          <input
            id="trader-search"
            type="text"
            placeholder="Cari nama trader atau bio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', padding: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)' }}>
          {[
            { key: 'winRate', label: 'Win Rate' },
            { key: 'totalPnl', label: 'PnL' },
            { key: 'total', label: 'Trades' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setSortBy(s.key)}
              style={{
                padding: '6px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'all 0.2s',
                background: sortBy === s.key ? 'var(--accent)' : 'transparent',
                color: sortBy === s.key ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <button
          onClick={load}
          title="Refresh"
          style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* ── Content ── */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[0,1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && error && (
        <div className="glass-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--color-lose)' }}>
          <p>Gagal memuat data: {error}</p>
          <button className="btn btn-secondary" onClick={load} style={{ marginTop: '12px' }}>Coba Lagi</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
          <Trophy size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.4 }} />
          <h3 style={{ color: 'var(--text-secondary)', margin: '0 0 8px' }}>
            {search ? 'Trader tidak ditemukan' : 'Belum ada trader publik'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
            {search
              ? `Tidak ada trader dengan nama "${search}"`
              : 'Jadikan profilmu publik di halaman Profil untuk muncul di sini!'}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((trader, i) => (
            <TraderCard
              key={trader.userId}
              trader={trader}
              rank={i + 1}
              onClick={() => onSelectTrader(trader)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
