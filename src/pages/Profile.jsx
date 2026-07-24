import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Lock,
  Save,
  Shield,
  TrendingUp,
  Award,
  Target,
  Calendar,
  Edit3,
  CheckCircle,
  AlertCircle,
  BarChart2,
  Zap,
  Eye,
  EyeOff,
  LogOut,
  Globe,
  EyeOff as EyeOffIcon,
  Trophy,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { signOut } from '../lib/auth';
import { getJurnal, getMyProfile, upsertProfile } from '../lib/api';

function StatCard({ icon, label, value, sub, color = 'var(--accent)' }) {
  return (
    <div
      className="glass-card"
      style={{
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: `${color}20`,
          border: `1px solid ${color}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {React.cloneElement(icon, { size: 22, style: { color } })}
      </div>
      <div>
        <div style={{ fontSize: '22px', fontWeight: '800', color: '#fff', lineHeight: 1.1 }}>
          {value}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', marginTop: '2px' }}>
          {label}
        </div>
        {sub && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Profile({ session, onDataChange }) {
  const user = session?.user;
  const userId = user?.id;

  // Profile form state
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [nameError, setNameError] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [isSavingPw, setIsSavingPw] = useState(false);
  const [pwMessage, setPwMessage] = useState(null); // { type: 'success'|'error', text }

  // Public profile state
  const [isPublic,    setIsPublic]    = useState(false);
  const [bio,         setBio]         = useState('');
  const [isSavingPub, setIsSavingPub] = useState(false);
  const [pubMessage,  setPubMessage]  = useState(null);

  // Trade stats
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Load own public profile
  useEffect(() => {
    if (!userId) return;
    getMyProfile(userId).then(p => {
      if (p) {
        setIsPublic(p.is_public || false);
        setBio(p.bio || '');
      }
    }).catch(console.error);
  }, [userId]);

  const handleSavePublicProfile = async (e) => {
    e.preventDefault();
    setIsSavingPub(true);
    setPubMessage(null);
    try {
      await upsertProfile({ userId, displayName, bio, isPublic });
      setPubMessage({ type: 'success', text: isPublic ? 'Profil kini tampil di Top Traders!' : 'Profil disembunyikan dari Top Traders.' });
      setTimeout(() => setPubMessage(null), 3500);
    } catch (err) {
      setPubMessage({ type: 'error', text: err.message || 'Gagal menyimpan.' });
    } finally {
      setIsSavingPub(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    setIsLoadingStats(true);
    getJurnal(userId)
      .then((trades) => {
        const total = trades.length;
        const wins = trades.filter((t) => t.hasilTrade === 'win').length;
        const losses = trades.filter((t) => t.hasilTrade === 'lose').length;
        const totalPnl = trades.reduce((s, t) => s + (t.profitNominal || 0), 0);
        const totalRr = trades.reduce((s, t) => s + (t.rrDiperoleh || 0), 0);
        const avgRr = total > 0 ? (totalRr / total).toFixed(2) : 0;
        const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : 0;

        // Best trade
        const best = trades.reduce(
          (max, t) => (t.profitNominal > (max?.profitNominal || -Infinity) ? t : max),
          null
        );

        // Pairs traded
        const pairs = [...new Set(trades.map((t) => t.pair))].length;

        // Join date
        const joinDate = user?.created_at
          ? new Date(user.created_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          : '-';

        setStats({ total, wins, losses, totalPnl, avgRr, winRate, best, pairs, joinDate });
      })
      .catch((err) => {
        console.error('Error loading stats for profile:', err);
        setStats(null);
      })
      .finally(() => setIsLoadingStats(false));
  }, [userId]);

  const handleSaveName = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setNameError('Nama tidak boleh kosong.');
      return;
    }
    setIsSavingName(true);
    setNameError('');
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName.trim() },
      });
      if (error) throw error;
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 3000);
      if (onDataChange) onDataChange();
    } catch (err) {
      setNameError(err.message || 'Gagal menyimpan nama.');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMessage(null);
    if (!newPassword || newPassword.length < 6) {
      setPwMessage({ type: 'error', text: 'Password baru minimal 6 karakter.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMessage({ type: 'error', text: 'Konfirmasi password tidak cocok.' });
      return;
    }
    setIsSavingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPwMessage({ type: 'success', text: 'Password berhasil diubah!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwMessage({ type: 'error', text: err.message || 'Gagal mengubah password.' });
    } finally {
      setIsSavingPw(false);
    }
  };

  const handleSignOut = async () => {
    try { await signOut(); } catch (e) { console.error(e); }
  };

  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-';

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>

      {/* ── Hero Profile Card ── */}
      <div
        className="glass-card"
        style={{
          marginBottom: '24px',
          padding: '32px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(6,182,212,0.06) 100%)',
          border: '1px solid rgba(99,102,241,0.2)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative glow */}
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 0 30px rgba(99,102,241,0.4)',
              fontSize: '32px',
              fontWeight: '800',
              color: '#fff',
            }}
          >
            {(displayName || user?.email || '?')[0].toUpperCase()}
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#fff', margin: 0, lineHeight: 1.2 }}>
              {displayName || 'Trader'}
            </h1>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={13} />
              {user?.email}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={12} />
              Bergabung sejak {joinDate}
            </div>
          </div>

          {/* Sign Out button */}
          <button
            onClick={handleSignOut}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 16px', borderRadius: '10px',
              background: 'rgba(244,63,94,0.08)',
              border: '1px solid rgba(244,63,94,0.2)',
              color: '#f43f5e', fontSize: '13px', fontWeight: '600',
              cursor: 'pointer', transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,63,94,0.16)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(244,63,94,0.08)'}
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </div>

      {/* ── Trading Stats ── */}
      {!isLoadingStats && stats && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={15} /> Statistik Trading
          </h2>
          <div className="stats-grid-4">
            <StatCard
              icon={<TrendingUp />}
              label="Total Trade"
              value={stats.total}
              sub={`${stats.pairs} pasang mata uang`}
              color="var(--accent)"
            />
            <StatCard
              icon={<Target />}
              label="Win Rate"
              value={`${stats.winRate}%`}
              sub={`${stats.wins}W / ${stats.losses}L`}
              color="var(--color-win)"
            />
            <StatCard
              icon={<Zap />}
              label="Avg R:R"
              value={`${stats.avgRr}R`}
              sub="per trade"
              color="var(--accent-secondary)"
            />
            <StatCard
              icon={<Award />}
              label="Total PnL"
              value={`${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toLocaleString()}`}
              sub={stats.best ? `Best: +$${stats.best.profitNominal} (${stats.best.pair})` : 'Belum ada trade'}
              color={stats.totalPnl >= 0 ? 'var(--color-win)' : 'var(--color-lose)'}
            />
          </div>
        </div>
      )}

      {/* ── Two Column Settings ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Edit Profile */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Edit3 size={15} /> Edit Profil
          </h2>

          <form onSubmit={handleSaveName}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Nama Tampilan</label>
              <input
                type="text"
                placeholder="Nama kamu..."
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={40}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label>Email</label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Email tidak dapat diubah.
              </span>
            </div>

            {nameError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-lose)', fontSize: '13px', marginBottom: '12px', padding: '10px 14px', background: 'rgba(244,63,94,0.08)', borderRadius: '8px', border: '1px solid rgba(244,63,94,0.2)' }}>
                <AlertCircle size={14} /> {nameError}
              </div>
            )}

            {nameSaved && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-win)', fontSize: '13px', marginBottom: '12px', padding: '10px 14px', background: 'rgba(16,185,129,0.08)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)' }}>
                <CheckCircle size={14} /> Nama berhasil diperbarui!
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSavingName}
              style={{ width: '100%' }}
            >
              {isSavingName ? (
                'Menyimpan...'
              ) : (
                <><Save size={15} /> Simpan Nama</>
              )}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={15} /> Ubah Password
          </h2>

          <form onSubmit={handleChangePassword}>
            <div className="form-group" style={{ marginBottom: '14px', position: 'relative' }}>
              <label>Password Baru</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPw ? 'text' : 'password'}
                  placeholder="Min. 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(p => !p)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '20px', position: 'relative' }}>
              <label>Konfirmasi Password Baru</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(p => !p)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {pwMessage && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                color: pwMessage.type === 'success' ? 'var(--color-win)' : 'var(--color-lose)',
                fontSize: '13px', marginBottom: '12px', padding: '10px 14px',
                background: pwMessage.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)',
                borderRadius: '8px',
                border: `1px solid ${pwMessage.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`,
              }}>
                {pwMessage.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                {pwMessage.text}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSavingPw}
              style={{ width: '100%', background: 'linear-gradient(135deg, #6366f1, #0891b2)' }}
            >
              {isSavingPw ? (
                'Mengubah...'
              ) : (
                <><Lock size={15} /> Ubah Password</>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ── Account Info ── */}
      <div className="glass-card" style={{ marginTop: '20px', padding: '20px' }}>
        <h2 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={15} /> Informasi Akun
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13px' }}>
          <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>User ID</div>
            <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '11px', wordBreak: 'break-all' }}>{userId}</div>
          </div>
          <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</div>
            <div style={{ color: '#fff', fontWeight: '600' }}>{user?.email}</div>
          </div>
          <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tanggal Bergabung</div>
            <div style={{ color: '#fff', fontWeight: '600' }}>{joinDate}</div>
          </div>
          <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.06)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.15)' }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status Akun</div>
            <div style={{ color: 'var(--color-win)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={13} /> Aktif & Terverifikasi
            </div>
          </div>
        </div>
      </div>

      {/* ── Visibilitas Publik (Top Traders) ── */}
      <div className="glass-card" style={{ marginTop: '20px', padding: '24px', border: isPublic ? '1px solid rgba(99,102,241,0.3)' : undefined, background: isPublic ? 'linear-gradient(135deg, rgba(99,102,241,0.07), rgba(6,182,212,0.05))' : undefined }}>
        <h2 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy size={15} style={{ color: '#f59e0b' }} /> Visibilitas Top Traders
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '18px', marginTop: 0 }}>
          Aktifkan agar profilmu muncul di halaman Top Traders dan trader lain bisa melihat statistik serta galerimu.
        </p>

        <form onSubmit={handleSavePublicProfile}>
          {/* Toggle publik */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Globe size={16} style={{ color: isPublic ? 'var(--accent)' : 'var(--text-muted)' }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>Jadikan Profil Publik</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                  {isPublic ? 'Profilmu terlihat di Top Traders ✓' : 'Profilmu tersembunyi (privat)'}
                </div>
              </div>
            </div>
            {/* Toggle switch */}
            <div
              onClick={() => setIsPublic(p => !p)}
              style={{
                width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer',
                background: isPublic ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
                position: 'relative', transition: 'background 0.25s', flexShrink: 0,
              }}
            >
              <div style={{
                position: 'absolute', top: '3px',
                left: isPublic ? '23px' : '3px',
                width: '18px', height: '18px', borderRadius: '50%',
                background: '#fff', transition: 'left 0.25s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }} />
            </div>
          </div>

          {/* Bio input */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label>Bio Singkat <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>({bio.length}/160)</span></label>
            <textarea
              placeholder="Ceritakan trading style atau strategi andalanmu..."
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 160))}
              maxLength={160}
              rows={2}
              style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 14px', color: '#fff', fontSize: '13px', resize: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }}
            />
          </div>

          {pubMessage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: pubMessage.type === 'success' ? 'var(--color-win)' : 'var(--color-lose)', fontSize: '13px', marginBottom: '12px', padding: '10px 14px', background: pubMessage.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)', borderRadius: '8px', border: `1px solid ${pubMessage.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}` }}>
              {pubMessage.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              {pubMessage.text}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={isSavingPub} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            {isSavingPub ? 'Menyimpan...' : <><Globe size={14} /> Simpan Visibilitas</>}
          </button>
        </form>
      </div>

      <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '24px', opacity: 0.5 }}>
        © 2026 Jurnal-N · v2.0 — Trading Journal untuk Trader Profesional
      </p>
    </div>
  );
}
