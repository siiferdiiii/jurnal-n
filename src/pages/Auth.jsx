import React, { useState } from 'react';
import { BrainCircuit, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { signIn, signUp } from '../lib/auth';

export default function Auth() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');

  const isLogin = mode === 'login';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        // onAuthStateChange in App.jsx will handle redirect
      } else {
        if (!displayName.trim()) { setError('Nama tampilan wajib diisi.'); setLoading(false); return; }
        if (password.length < 6)  { setError('Password minimal 6 karakter.'); setLoading(false); return; }
        await signUp(email, password, displayName.trim());
        setSuccess('Akun berhasil dibuat! Cek email untuk konfirmasi, lalu login.');
        setMode('login');
        setPassword('');
      }
    } catch (err) {
      const msg = err?.message || 'Terjadi kesalahan. Coba lagi.';
      if (msg.includes('Invalid login')) setError('Email atau password salah.');
      else if (msg.includes('already registered')) setError('Email sudah terdaftar. Silakan login.');
      else if (msg.includes('Email not confirmed')) setError('Email belum dikonfirmasi. Cek inbox kamu.');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    setMode(isLogin ? 'register' : 'login');
    setError('');
    setSuccess('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'var(--bg-primary)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient background blobs */}
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
        width: '100%',
        maxWidth: '480px',
        background: 'var(--panel-bg)',
        border: '1px solid var(--panel-border)',
        borderRadius: '24px',
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 32px 64px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* ── FORM PANEL ── */}
        <div className="auth-card-content" style={{ padding: '60px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(99,102,241,0.3)',
            }}>
              <BrainCircuit size={22} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '800', background: 'linear-gradient(135deg,#fff,#a5b4fc)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                Jurnal-N
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Trading Journal</div>
            </div>
          </div>
          {/* Header */}
          <div style={{ marginBottom: '36px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>
              {isLogin ? 'Selamat datang!' : 'Buat akun baru'}
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              {isLogin
                ? 'Masuk ke jurnal trading pribadimu.'
                : 'Bergabung dan mulai jurnaling gratis.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Display Name (register only) */}
            {!isLogin && (
              <div className="auth-field">
                <label className="auth-label">Nama Tampilan</label>
                <div className="auth-input-wrap">
                  <User size={16} className="auth-input-icon" />
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="Nama kamu"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="auth-field">
              <label className="auth-label">Email</label>
              <div className="auth-input-wrap">
                <Mail size={16} className="auth-input-icon" />
                <input
                  type="email"
                  className="auth-input"
                  placeholder="trader@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrap">
                <Lock size={16} className="auth-input-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="auth-input"
                  placeholder={isLogin ? '••••••••' : 'Min. 6 karakter'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
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

            {/* Error/Success banners */}
            {error && (
              <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
                borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#f43f5e' }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#10b981' }}>
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                padding: '14px 24px',
                background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
                color: '#fff', border: 'none', borderRadius: '12px',
                fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 0 24px rgba(99,102,241,0.4)',
                transition: 'all 0.2s ease',
              }}
            >
              {loading ? (
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <>
                  {isLogin ? 'Masuk ke Dashboard' : 'Buat Akun Gratis'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Toggle */}
          <div style={{ marginTop: '28px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
            {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
            <button
              onClick={toggle}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: '700',
                cursor: 'pointer', fontSize: '14px', padding: '0', textDecoration: 'underline', textUnderlineOffset: '3px' }}
            >
              {isLogin ? 'Daftar sekarang' : 'Login di sini'}
            </button>
          </div>
        </div>
      </div>

      {/* Responsive adjustments */}
      <style>{`
        @media (max-width: 480px) {
          .auth-card-content {
            padding: 40px 24px !important;
          }
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
