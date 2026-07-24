import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Target,
  Zap,
  Award,
  TrendingUp,
  Image as ImageIcon,
  MessageCircle,
  Trash2,
  Send,
  Calendar,
  BarChart2,
  CheckCircle,
  AlertCircle,
  Users,
} from 'lucide-react';
import {
  getTraderJurnal,
  getTraderComments,
  addTraderComment,
  deleteTraderComment,
} from '../lib/api';

/* ── Stat card ── */
function StatCard({ icon, label, value, color = 'var(--accent)' }) {
  return (
    <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
      <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: `${color}18`, border: `1px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {React.cloneElement(icon, { size: 20, style: { color } })}
      </div>
      <div>
        <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', marginTop: '2px' }}>{label}</div>
      </div>
    </div>
  );
}

/* ── Chart Gallery Card ── */
function GalleryCard({ trade }) {
  const [hovered, setHovered] = useState(false);
  const resultColor = trade.hasilTrade === 'win' ? 'var(--color-win)' : trade.hasilTrade === 'lose' ? 'var(--color-lose)' : 'var(--color-be)';
  const img = trade.fotoPremarket || trade.fotoResult;
  if (!img) return null;

  return (
    <div
      className="glass-card"
      style={{ overflow: 'hidden', cursor: 'default', transition: 'transform 0.2s', transform: hovered ? 'translateY(-3px)' : 'none' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ height: '180px', overflow: 'hidden', background: 'rgba(0,0,0,0.3)', position: 'relative' }}>
        <img src={img} alt={trade.pair} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {/* Overlay result badge */}
        <div style={{ position: 'absolute', top: '8px', right: '8px', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', background: resultColor + '30', border: `1px solid ${resultColor}60`, color: resultColor, textTransform: 'uppercase' }}>
          {trade.hasilTrade}
        </div>
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: '700', fontSize: '13px', color: '#fff' }}>{trade.pair}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{trade.tanggal}</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <span>{trade.arah}</span>
          {trade.rrDiperoleh != null && <span>RR: {trade.rrDiperoleh}R</span>}
          {trade.profitNominal != null && (
            <span style={{ color: trade.profitNominal >= 0 ? 'var(--color-win)' : 'var(--color-lose)', fontWeight: '700' }}>
              {trade.profitNominal >= 0 ? '+' : ''}${trade.profitNominal}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Comment Item ── */
function CommentItem({ comment, currentUserId, onDelete }) {
  const initial = (comment.author_name || '?')[0].toUpperCase();
  const avatarColors = ['#6366f1','#0891b2','#059669','#d97706','#dc2626','#7c3aed','#db2777'];
  const avatarColor  = avatarColors[initial.charCodeAt(0) % avatarColors.length];
  const isOwn = comment.author_id === currentUserId;

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', color: '#fff' }}>
        {initial}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ fontWeight: '700', fontSize: '13px', color: '#fff' }}>{comment.author_name}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {new Date(comment.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            {isOwn && (
              <button
                onClick={() => onDelete(comment.id)}
                title="Hapus komentar"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(244,63,94,0.5)', padding: '2px', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#f43f5e'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(244,63,94,0.5)'}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', wordBreak: 'break-word' }}>
          {comment.text}
        </p>
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function TraderProfile({ trader, session, onBack }) {
  const [activeTab,    setActiveTab]    = useState('stats');
  const [trades,       setTrades]       = useState([]);
  const [comments,     setComments]     = useState([]);
  const [loadingTrades,setLoadingTrades]= useState(true);
  const [loadingCom,   setLoadingCom]   = useState(true);
  const [newComment,   setNewComment]   = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [comMsg,       setComMsg]       = useState(null);

  const currentUserId   = session?.user?.id;
  const currentUserName = session?.user?.user_metadata?.display_name || session?.user?.email || 'Trader';

  // Load trades
  useEffect(() => {
    setLoadingTrades(true);
    getTraderJurnal(trader.userId)
      .then(setTrades)
      .catch(console.error)
      .finally(() => setLoadingTrades(false));
  }, [trader.userId]);

  // Load comments
  useEffect(() => {
    setLoadingCom(true);
    getTraderComments(trader.userId)
      .then(setComments)
      .catch(console.error)
      .finally(() => setLoadingCom(false));
  }, [trader.userId]);

  // Compute stats from trades
  const total  = trades.length;
  const wins   = trades.filter(t => t.hasilTrade === 'win').length;
  const losses = trades.filter(t => t.hasilTrade === 'lose').length;
  const totalPnl = trades.reduce((s, t) => s + (t.profitNominal || 0), 0);
  const avgRr  = total > 0 ? (trades.reduce((s, t) => s + (t.rrDiperoleh || 0), 0) / total).toFixed(2) : '0';
  const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : '0';
  const galleryTrades = trades.filter(t => t.fotoPremarket || t.fotoResult);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    setComMsg(null);
    try {
      const added = await addTraderComment({
        traderId:   trader.userId,
        authorId:   currentUserId,
        authorName: currentUserName,
        text:       newComment.trim(),
      });
      setComments(prev => [...prev, added]);
      setNewComment('');
      setComMsg({ type: 'success', text: 'Komentar berhasil dikirim!' });
      setTimeout(() => setComMsg(null), 2500);
    } catch (err) {
      setComMsg({ type: 'error', text: err.message || 'Gagal mengirim komentar.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (id) => {
    try {
      await deleteTraderComment(id);
      setComments(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const initial     = (trader.displayName || 'T')[0].toUpperCase();
  const avatarColors= ['#6366f1','#0891b2','#059669','#d97706','#dc2626','#7c3aed','#db2777'];
  const avatarColor = avatarColors[initial.charCodeAt(0) % avatarColors.length];

  const winRateColor = Number(winRate) >= 60 ? 'var(--color-win)' : Number(winRate) >= 40 ? 'var(--color-be)' : 'var(--color-lose)';

  const TABS = [
    { id: 'stats',   label: 'Statistik',  icon: <BarChart2 size={15}/> },
    { id: 'gallery', label: `Galeri (${galleryTrades.length})`, icon: <ImageIcon size={15}/> },
    { id: 'comments',label: `Komentar (${comments.length})`, icon: <MessageCircle size={15}/> },
  ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '960px', margin: '0 auto' }}>

      {/* ── Back Button ── */}
      <button
        onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '8px 14px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
      >
        <ArrowLeft size={15} /> Kembali ke Top Traders
      </button>

      {/* ── Hero Profile ── */}
      <div className="glass-card" style={{
        marginBottom: '24px', padding: '28px 32px',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(6,182,212,0.06) 100%)',
        border: '1px solid rgba(99,102,241,0.2)', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: `radial-gradient(circle, ${avatarColor}20 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '18px', flexShrink: 0, background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '800', color: '#fff', boxShadow: `0 0 24px ${avatarColor}50` }}>
            {initial}
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', margin: 0 }}>{trader.displayName}</h1>
            {trader.bio && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>{trader.bio}</p>}
            <div style={{ display: 'flex', gap: '14px', marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={12} /> Bergabung {new Date(trader.joinedAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Users size={12} /> {trader.pairs} pair diperdagangkan
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', padding: '5px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', width: 'fit-content' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: '600', transition: 'all 0.2s',
              background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: STATS ── */}
      {activeTab === 'stats' && (
        <div>
          {loadingTrades ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
              {[0,1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '12px' }} />)}
            </div>
          ) : (
            <>
              <div className="stats-grid-4" style={{ marginBottom: '24px' }}>
                <StatCard icon={<TrendingUp />} label="Total Trade" value={total} color="var(--accent)" />
                <StatCard icon={<Target />}    label="Win Rate"    value={`${winRate}%`} color={winRateColor} />
                <StatCard icon={<Zap />}       label="Avg R:R"     value={`${avgRr}R`}  color="var(--accent-secondary)" />
                <StatCard icon={<Award />}     label="Total PnL"   value={`${totalPnl >= 0 ? '+' : ''}$${totalPnl.toLocaleString()}`} color={totalPnl >= 0 ? 'var(--color-win)' : 'var(--color-lose)'} />
              </div>

              {/* Win/Loss breakdown */}
              <div className="glass-card" style={{ padding: '20px', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '14px' }}>Hasil Trade</h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[
                    { label: 'Win', count: wins, color: 'var(--color-win)', bg: 'rgba(16,185,129,0.1)' },
                    { label: 'Lose', count: losses, color: 'var(--color-lose)', bg: 'rgba(244,63,94,0.1)' },
                    { label: 'Lainnya', count: total - wins - losses, color: 'var(--color-be)', bg: 'rgba(251,191,36,0.1)' },
                  ].map((item) => (
                    <div key={item.label} style={{ flex: 1, padding: '14px', borderRadius: '10px', background: item.bg, textAlign: 'center' }}>
                      <div style={{ fontSize: '22px', fontWeight: '800', color: item.color }}>{item.count}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.label}</div>
                    </div>
                  ))}
                </div>
                {/* Progress bar win rate */}
                {total > 0 && (
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span>Win Rate</span><span style={{ color: winRateColor, fontWeight: '700' }}>{winRate}%</span>
                    </div>
                    <div style={{ height: '8px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${winRate}%`, borderRadius: '999px', background: `linear-gradient(90deg, ${winRateColor}, ${winRateColor}88)`, transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TAB: GALLERY ── */}
      {activeTab === 'gallery' && (
        <div>
          {loadingTrades ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
              {[0,1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: '200px', borderRadius: '12px' }} />)}
            </div>
          ) : galleryTrades.length === 0 ? (
            <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
              <ImageIcon size={40} style={{ color: 'var(--text-muted)', opacity: 0.4, marginBottom: '12px' }} />
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>Trader ini belum memiliki foto chart.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {galleryTrades.map(trade => <GalleryCard key={trade.id} trade={trade} />)}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: COMMENTS ── */}
      {activeTab === 'comments' && (
        <div>
          {/* Add comment form */}
          {trader.userId !== currentUserId && (
            <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <MessageCircle size={13} /> Tulis Komentar
              </h3>
              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '10px' }}>
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder={`Tulis komentar untuk ${trader.displayName}...`}
                  maxLength={500}
                  rows={2}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 14px', color: '#fff', fontSize: '13px', resize: 'none', fontFamily: 'var(--font-sans)' }}
                />
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  style={{ padding: '10px 16px', borderRadius: '10px', background: 'var(--accent)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', opacity: submitting || !newComment.trim() ? 0.5 : 1, transition: 'opacity 0.2s', alignSelf: 'flex-end' }}
                >
                  <Send size={14} /> Kirim
                </button>
              </form>
              {comMsg && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '10px', fontSize: '12px', color: comMsg.type === 'success' ? 'var(--color-win)' : 'var(--color-lose)' }}>
                  {comMsg.type === 'success' ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                  {comMsg.text}
                </div>
              )}
            </div>
          )}

          {/* Comments list */}
          <div className="glass-card" style={{ padding: '20px' }}>
            {loadingCom ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div className="skeleton" style={{ width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton" style={{ width: '120px', height: '12px', borderRadius: '6px', marginBottom: '6px' }} />
                      <div className="skeleton" style={{ width: '80%', height: '11px', borderRadius: '6px' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : comments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                <MessageCircle size={32} style={{ opacity: 0.3, marginBottom: '10px' }} />
                <p style={{ margin: 0, fontSize: '13px' }}>Belum ada komentar. Jadilah yang pertama!</p>
              </div>
            ) : (
              <div>
                {comments.map(c => (
                  <CommentItem
                    key={c.id}
                    comment={c}
                    currentUserId={currentUserId}
                    onDelete={handleDeleteComment}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
