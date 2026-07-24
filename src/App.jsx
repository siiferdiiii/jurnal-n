import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  Image as ImageIcon,
  BrainCircuit,
  LogOut,
  User,
  Eye,
  EyeOff,
  Zap,
  UserCircle,
  Trophy,
} from 'lucide-react';

import { onAuthStateChange, signOut } from './lib/auth';
import Mt5Modal from './components/Mt5Modal';

/** Helper to mask user email for privacy */
const maskEmail = (email) => {
  if (!email) return '';
  const [localPart, domain] = email.split('@');
  if (!domain) return email;
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`;
};

import Auth        from './pages/Auth';
import Dashboard   from './pages/Dashboard';
import Journal     from './pages/Journal';
import Methods     from './pages/Methods';
import Gallery     from './pages/Gallery';
import Profile     from './pages/Profile';
import TopTraders  from './pages/TopTraders';
import TraderProfile from './pages/TraderProfile';

function App() {
  const [session,          setSession]          = useState(undefined);
  const [currentTab,       setCurrentTab]       = useState('dashboard');
  const [dbTrigger,        setDbTrigger]        = useState(0);
  const [showEmail,        setShowEmail]        = useState(() => localStorage.getItem('showEmail') === 'true');
  const [isMt5ModalOpen,   setIsMt5ModalOpen]   = useState(false);
  const [selectedTrader,   setSelectedTrader]   = useState(null); // for TopTraders → TraderProfile

  const toggleShowEmail = () => {
    setShowEmail(prev => {
      const next = !prev;
      localStorage.setItem('showEmail', String(next));
      return next;
    });
  };

  // Subscribe to auth state changes
  useEffect(() => {
    const unsub = onAuthStateChange((sess) => setSession(sess));
    return unsub;
  }, []);

  const userId = session?.user?.id;
  const userEmail = session?.user?.email;
  const displayName = session?.user?.user_metadata?.display_name;

  const triggerDataRefresh = () => setDbTrigger(prev => prev + 1);

  const handleSignOut = async () => {
    try { await signOut(); } catch (e) { console.error(e); }
  };

  // ── Loading splash
  if (session === undefined) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh',
        alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)',
        background: 'var(--bg-primary)' }}>
        <BrainCircuit size={48} style={{ color: 'var(--accent)', marginBottom: '16px', animation: 'spin 3s linear infinite' }} />
        <h3 style={{ margin: 0 }}>Memuat Jurnal-N…</h3>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Not authenticated → show Auth page
  if (!session) return <Auth />;

  // ── Authenticated → show main app
  const renderActivePage = () => {
    // TraderProfile is a sub-view inside the TopTraders tab
    if (currentTab === 'top-traders' && selectedTrader) {
      return <TraderProfile trader={selectedTrader} session={session} onBack={() => setSelectedTrader(null)} />;
    }
    switch (currentTab) {
      case 'dashboard': return <Dashboard dbTrigger={dbTrigger} userId={userId} />;
      case 'jurnal':    return <Journal   dbTrigger={dbTrigger} onDataChange={triggerDataRefresh} userId={userId} />;
      case 'metode':    return <Methods   dbTrigger={dbTrigger} onDataChange={triggerDataRefresh} userId={userId} />;
      case 'galeri':    return <Gallery   dbTrigger={dbTrigger} userId={userId} />;
      case 'profil':    return <Profile   session={session} onDataChange={triggerDataRefresh} />;
      case 'top-traders': return <TopTraders onSelectTrader={(t) => setSelectedTrader(t)} />;
      default:          return <Dashboard dbTrigger={dbTrigger} userId={userId} />;
    }
  };

  const navItems = [
    { id: 'dashboard',   icon: <LayoutDashboard size={18} className="nav-icon" />, full: 'Dashboard',         short: 'Beranda',    desktopOnly: false },
    { id: 'jurnal',      icon: <BookOpen        size={18} className="nav-icon" />, full: 'Catatan Jurnal',    short: 'Jurnal',     desktopOnly: false },
    { id: 'metode',      icon: <CheckSquare     size={18} className="nav-icon" />, full: 'Manajemen Metode', short: 'Metode',     desktopOnly: false },
    { id: 'galeri',      icon: <ImageIcon       size={18} className="nav-icon" />, full: 'Galeri Chart',     short: 'Galeri',     desktopOnly: false },
    { id: 'profil',      icon: <UserCircle      size={18} className="nav-icon" />, full: 'Profil Saya',      short: 'Profil',     desktopOnly: false },
    { id: 'top-traders', icon: <Trophy          size={18} className="nav-icon" />, full: 'Top Traders',       short: 'Traders',    desktopOnly: true  },
  ];

  return (
    <div className="app-container">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="logo-section">
          <BrainCircuit size={24} className="logo-icon" />
          <span className="logo-text">Jurnal-N</span>
        </div>

        <nav className="nav-links">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${currentTab === item.id ? 'active' : ''} ${item.desktopOnly ? 'desktop-only-nav' : ''}`}
              onClick={() => { setCurrentTab(item.id); setSelectedTrader(null); }}
            >
              {item.icon}
              <span className="label-full">{item.full}</span>
              <span className="label-short">{item.short}</span>
            </button>
          ))}

          {/* MT5 Sync Button */}
          <button
            onClick={() => setIsMt5ModalOpen(true)}
            className="mt5-sync-nav-btn"
            style={{
              marginTop: '12px',
              display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
              padding: '10px 14px', borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))',
              border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(139,92,246,0.25))'}
            onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))'}
          >
            <Zap size={16} />
            <span className="label-full">Integrasi MT5</span>
            <span className="label-short">MT5</span>
          </button>
        </nav>
        <div className="nav-footer">
          {/* User info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px',
            padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,var(--accent),var(--accent-secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={14} color="white" />
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displayName || 'Trader'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap',
                  overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}
                  title={showEmail ? userEmail : undefined}
                >
                  {showEmail ? userEmail : maskEmail(userEmail)}
                </div>
                <button
                  onClick={toggleShowEmail}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '2px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    color: 'var(--text-muted)',
                    opacity: 0.6,
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
                  title={showEmail ? "Sembunyikan Email" : "Tampilkan Email"}
                >
                  {showEmail ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </div>
            </div>
          </div>
          {/* Logout */}
          <button
            onClick={handleSignOut}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '8px', padding: '9px 12px', background: 'rgba(244,63,94,0.08)',
              border: '1px solid rgba(244,63,94,0.15)', borderRadius: '10px', color: '#f43f5e',
              fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,63,94,0.16)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(244,63,94,0.08)'}
          >
            <LogOut size={14} />
            Logout
          </button>
          <p style={{ fontSize: '10px', marginTop: '12px', opacity: 0.4, textAlign: 'center' }}>© 2026 Jurnal-N · v2.0</p>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="main-content">
        {renderActivePage()}
      </main>

      {/* MT5 Modal */}
      <Mt5Modal
        isOpen={isMt5ModalOpen}
        onClose={() => setIsMt5ModalOpen(false)}
        userId={userId}
      />
    </div>
  );
}

export default App;
