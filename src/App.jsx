import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  Image as ImageIcon,
  BrainCircuit,
  LogOut,
  User,
} from 'lucide-react';

import { onAuthStateChange, signOut } from './lib/auth';

import Auth      from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Journal   from './pages/Journal';
import Methods   from './pages/Methods';
import Gallery   from './pages/Gallery';

function App() {
  const [session,    setSession]    = useState(undefined); // undefined = loading
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [dbTrigger,  setDbTrigger]  = useState(0);

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
    switch (currentTab) {
      case 'dashboard': return <Dashboard dbTrigger={dbTrigger} userId={userId} />;
      case 'jurnal':    return <Journal   dbTrigger={dbTrigger} onDataChange={triggerDataRefresh} userId={userId} />;
      case 'metode':    return <Methods   dbTrigger={dbTrigger} onDataChange={triggerDataRefresh} userId={userId} />;
      case 'galeri':    return <Gallery   dbTrigger={dbTrigger} userId={userId} />;
      default:          return <Dashboard dbTrigger={dbTrigger} userId={userId} />;
    }
  };

  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={18} className="nav-icon" />, full: 'Dashboard',         short: 'Beranda' },
    { id: 'jurnal',    icon: <BookOpen        size={18} className="nav-icon" />, full: 'Catatan Jurnal',    short: 'Jurnal'  },
    { id: 'metode',    icon: <CheckSquare     size={18} className="nav-icon" />, full: 'Manajemen Metode', short: 'Metode'  },
    { id: 'galeri',    icon: <ImageIcon       size={18} className="nav-icon" />, full: 'Galeri Chart',     short: 'Galeri'  },
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
              className={`nav-item ${currentTab === item.id ? 'active' : ''}`}
              onClick={() => setCurrentTab(item.id)}
            >
              {item.icon}
              <span className="label-full">{item.full}</span>
              <span className="label-short">{item.short}</span>
            </button>
          ))}
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
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userEmail}
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
    </div>
  );
}

export default App;
