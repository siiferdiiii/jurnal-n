import React, { useState, useEffect } from 'react';
import {
  BrainCircuit, Mail, Lock, User, Eye, EyeOff,
  ArrowRight, Loader2, ArrowLeft, CheckCircle, KeyRound,
} from 'lucide-react';
import { signIn, signUp, resetPasswordForEmail, updateUserPassword } from '../lib/auth';

/**
 * mode:
 *  'login'          → normal login form
 *  'register'       → sign up form
 *  'reset'          → request password reset email
 *  'update_password'→ set a new password (after clicking email link)
 */
export default function Auth({ isRecovery = false, onRecoveryDone }) {
  const [mode, setMode]             = useState('login');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');

  const isLogin    = mode === 'login';
  const isRegister = mode === 'register';
  const isReset    = mode === 'reset';
  const isUpdate   = mode === 'update_password';

  // Switch to update_password mode if App.jsx detected PASSWORD_RECOVERY event
  useEffect(() => {
    if (isRecovery) {
      setMode('update_password');
    }
  }, [isRecovery]);

  // Also detect recovery via URL hash (direct link open)
  useEffect(() => {
    const hash   = window.location.hash;
    const search = window.location.search;
    const hasRecoveryToken =
      hash.includes('type=recovery') ||
      search.includes('type=recovery') ||
      hash.includes('access_token');
    if (hasRecoveryToken) {
      setMode('update_password');
    }
  }, []);


  /* ── SUBMIT HANDLERS ── */
  const handleLoginRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        // onAuthStateChange in App.jsx handles redirect
      } else {
        if (!displayName.trim()) { setError('Nama tampilan wajib diisi.'); return; }
        if (password.length < 6)  { setError('Password minimal 6 karakter.'); return; }
        await signUp(email, password, displayName.trim());
        setSuccess('Akun berhasil dibuat! Cek email untuk konfirmasi, lalu login.');
        setMode('login');
        setPassword('');
      }
    } catch (err) {
      const msg = err?.message || 'Terjadi kesalahan. Coba lagi.';
      if (msg.includes('Invalid login'))        setError('Email atau password salah.');
      else if (msg.includes('already registered')) setError('Email sudah terdaftar. Silakan login.');
      else if (msg.includes('Email not confirmed')) setError('Email belum dikonfirmasi. Cek inbox kamu.');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email.trim()) { setError('Masukkan email kamu.'); return; }
    setLoading(true);
    try {
      await resetPasswordForEmail(email.trim());
      setSuccess('Link reset password telah dikirim! Cek inbox atau folder spam email kamu.');
    } catch (err) {
      setError(err?.message || 'Gagal mengirim email reset. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password.length < 6) { setError('Password baru minimal 6 karakter.'); return; }
    if (password !== confirmPassword) { setError('Konfirmasi password tidak cocok.'); return; }
    setLoading(true);
    try {
      await updateUserPassword(password);
      setSuccess('Password berhasil diperbarui! Kamu sekarang bisa login dengan password baru.');
      // clean URL hash
      window.history.replaceState(null, '', window.location.pathname);
      setTimeout(() => {
        setMode('login');
        setPassword('');
        setConfirmPassword('');
        setSuccess('');
        if (onRecoveryDone) onRecoveryDone();
      }, 2500);
    } catch (err) {
      setError(err?.message || 'Gagal memperbarui password. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const switchTo = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
  };

  /* ── TITLE / SUBTITLE ── */
  const titles = {
    login:           { h1: 'Selamat datang!',       sub: 'Masuk ke jurnal trading pribadimu.' },
    register:        { h1: 'Buat akun baru',         sub: 'Bergabung dan mulai jurnaling gratis.' },
    reset:           { h1: 'Lupa password?',         sub: 'Masukkan email dan kami kirimkan link reset.' },
    update_password: { h1: 'Buat password baru',     sub: 'Masukkan password baru yang kuat untuk akunmu.' },
  };
  const { h1, sub } = titles[mode];

  /* ── SUBMIT HANDLER by mode ── */
  const onSubmit =
    isReset ? handleResetRequest :
    isUpdate ? handleUpdatePassword :
    handleLoginRegister;

  /* ── LABEL for submit button ── */
  const submitLabel =
    isLogin   ? 'Masuk ke Dashboard' :
    isRegister? 'Buat Akun Gratis'   :
    isReset   ? 'Kirim Link Reset'   :
    'Simpan Password Baru';

  return (
    <div style={{
      minHeight: '100vh', width: '100%', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', background: 'var(--bg-primary)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient blobs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: '40%', right: '20%', width: '300px', height: '300px',
          background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(30px)' }} />
      </div>

      <div style={{
        width: '100%', maxWidth: '480px',
        background: 'var(--panel-bg)', border: '1px solid var(--panel-border)',
        borderRadius: '24px', overflow: 'hidden',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 32px 64px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)',
        position: 'relative', zIndex: 1,
      }}>
        <div className="auth-card-content" style={{ padding: '60px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(99,102,241,0.3)',
            }}>
              {isUpdate ? <KeyRound size={22} color="white" /> : <BrainCircuit size={22} color="white" />}
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '800', background: 'linear-gradient(135deg,#fff,#a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Jurnal-N
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Trading Journal</div>
            </div>
          </div>

          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            {(isReset || isUpdate) && (
              <button
                type="button"
                onClick={() => switchTo('login')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  cursor: 'pointer', fontSize: '13px', padding: '0',
                  marginBottom: '16px', transition: 'color 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.color = 'var(--accent)'}
                onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <ArrowLeft size={14} /> Kembali ke Login
              </button>
            )}
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>{h1}</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{sub}</p>
          </div>

          {/* ── FORM ── */}
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Display Name (register only) */}
            {isRegister && (
              <div className="auth-field">
                <label className="auth-label">Nama Tampilan</label>
                <div className="auth-input-wrap">
                  <User size={16} className="auth-input-icon" />
                  <input
                    type="text" className="auth-input"
                    placeholder="Nama kamu"
                    value={displayName} onChange={e => setDisplayName(e.target.value)}
                    required autoComplete="name"
                  />
                </div>
              </div>
            )}

            {/* Email (login, register, reset) */}
            {!isUpdate && (
              <div className="auth-field">
                <label className="auth-label">Email</label>
                <div className="auth-input-wrap">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    type="email" className="auth-input"
                    placeholder="trader@email.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    required autoComplete="email"
                  />
                </div>
              </div>
            )}

            {/* Password (login, register, update) */}
            {!isReset && (
              <div className="auth-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="auth-label">{isUpdate ? 'Password Baru' : 'Password'}</label>
                  {/* Lupa Password link — only on login */}
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => switchTo('reset')}
                      style={{
                        background: 'none', border: 'none',
                        color: 'var(--text-muted)', fontSize: '11px',
                        cursor: 'pointer', padding: '0',
                        textDecoration: 'underline', textUnderlineOffset: '3px',
                        transition: 'color 0.2s',
                      }}
                      onMouseOver={e => e.currentTarget.style.color = 'var(--accent)'}
                      onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      Lupa Password?
                    </button>
                  )}
                </div>
                <div className="auth-input-wrap">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="auth-input"
                    placeholder={isLogin ? '••••••••' : 'Min. 6 karakter'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password (update_password only) */}
            {isUpdate && (
              <div className="auth-field">
                <label className="auth-label">Konfirmasi Password Baru</label>
                <div className="auth-input-wrap">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="Ulangi password baru"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    required autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}

            {/* Error / Success banners */}
            {error && (
              <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
                borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#f43f5e', lineHeight: '1.5' }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#10b981', lineHeight: '1.5',
                display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <CheckCircle size={15} style={{ marginTop: '1px', flexShrink: 0 }} />
                {success}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                padding: '14px 24px',
                background: loading
                  ? 'rgba(99,102,241,0.5)'
                  : isReset || isUpdate
                    ? 'linear-gradient(135deg, #0891b2, #0d9488)'
                    : 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
                color: '#fff', border: 'none', borderRadius: '12px',
                fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : isReset || isUpdate ? '0 0 24px rgba(9,145,178,0.4)' : '0 0 24px rgba(99,102,241,0.4)',
                transition: 'all 0.2s ease',
              }}
            >
              {loading ? (
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <>
                  {submitLabel}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Toggle login ↔ register */}
          {(isLogin || isRegister) && (
            <div style={{ marginTop: '28px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
              {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
              <button
                onClick={() => switchTo(isLogin ? 'register' : 'login')}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: '700',
                  cursor: 'pointer', fontSize: '14px', padding: '0', textDecoration: 'underline', textUnderlineOffset: '3px' }}
              >
                {isLogin ? 'Daftar sekarang' : 'Login di sini'}
              </button>
            </div>
          )}

          {/* Reset mode: Back to login text link */}
          {isReset && !success && (
            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
              Ingat password?{' '}
              <button
                onClick={() => switchTo('login')}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: '700',
                  cursor: 'pointer', fontSize: '14px', padding: '0', textDecoration: 'underline', textUnderlineOffset: '3px' }}
              >
                Login di sini
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .auth-card-content { padding: 40px 24px !important; }
        }
        .auth-field { display: flex; flex-direction: column; gap: 6px; }
        .auth-label { font-size: 12px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
        .auth-input-wrap { position: relative; display: flex; align-items: center; }
        .auth-input-icon { position: absolute; left: 14px; color: var(--text-muted); pointer-events: none; }
        .auth-input {
          width: 100%; padding: 12px 14px 12px 40px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; color: #fff; font-size: 14px; font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s; outline: none; box-sizing: border-box;
        }
        .auth-input::placeholder { color: var(--text-muted); }
        .auth-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
          background: rgba(255,255,255,0.06);
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
