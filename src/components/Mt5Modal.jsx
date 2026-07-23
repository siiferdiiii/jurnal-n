import React, { useState } from 'react';
import { X, Download, Copy, Check, ExternalLink, Zap, ShieldCheck } from 'lucide-react';

export default function Mt5Modal({ isOpen, onClose, userId }) {
  const [copiedField, setCopiedField] = useState(null);

  if (!isOpen) return null;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ogkeucgncxkorazdmzio.supabase.co';
  const restUrl = `${supabaseUrl}/rest/v1/jurnal`;
  const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9na2V1Y2duY3hrb3JhemRtemlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMTM0MjEsImV4cCI6MjA5OTg4OTQyMX0.H9RuslW5-AUVF9lE2MZGVyIp8VgBsSoP9K9mg6GAJSU';

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div style={{
        background: 'var(--bg-secondary, #121826)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px', width: '100%', maxWidth: '640px',
        maxHeight: '90vh', overflowY: 'auto', color: '#fff', padding: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Zap size={22} color="white" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Integrasi MT5 Auto-Sync</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
                Catat otomatis setiap transaksi MT5 ke Jurnal-N
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px',
              color: '#94a3b8', padding: '8px', cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Info Banner */}
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '12px', padding: '12px 16px', marginBottom: '20px',
          display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '13px', color: '#93c5fd'
        }}>
          <ShieldCheck size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>100% Aman & Gratis!</strong> Anda tidak perlu memasukkan password MT5 di web.
            EA MQL5 berjalan di MT5 Anda sendiri dan hanya mengirimkan data trade yang sudah ditutup.
          </div>
        </div>

        {/* Setup Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Step 1 */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: '#3b82f6', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>1</span>
              Download EA Script (MQL5)
            </h4>
            <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#cbd5e1' }}>
              Download file Expert Advisor <code>JurnalN_Sync.mq5</code> lalu masukkan ke folder <code>MQL5/Experts</code> di MT5 Anda.
            </p>
            <a
              href="/JurnalN_Sync.mq5"
              download="JurnalN_Sync.mq5"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '8px 16px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              <Download size={16} /> Download JurnalN_Sync.mq5
            </a>
          </div>

          {/* Step 2 */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: '#3b82f6', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>2</span>
              Izinkan WebRequest di MT5
            </h4>
            <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
              Di aplikasi MT5, buka menu <strong>Tools → Options → Expert Advisors</strong>. Centang <strong>"Allow WebRequest for listed URL"</strong>, lalu tambahkan URL ini:
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <code style={{ background: 'rgba(0,0,0,0.4)', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', flex: 1, color: '#38bdf8' }}>
                {supabaseUrl}
              </code>
              <button
                onClick={() => copyToClipboard(supabaseUrl, 'url')}
                style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '6px', color: '#fff', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {copiedField === 'url' ? <Check size={14} color="#4ade80" /> : <Copy size={14} />} Copy
              </button>
            </div>
          </div>

          {/* Step 3 */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: '#3b82f6', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>3</span>
              Parameter Input EA di MT5
            </h4>
            <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#cbd5e1' }}>
              Pasang EA <code>JurnalN_Sync</code> ke chart MT5 Anda (misal chart XAUUSD H1) dan isi parameter berikut pada tab <strong>Inputs</strong>:
            </p>

            {/* Input 1 */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>InpSupabaseUrl</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  readOnly
                  value={restUrl}
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e2e8f0', padding: '6px 10px', fontSize: '11px', flex: 1, fontFamily: 'monospace' }}
                />
                <button
                  onClick={() => copyToClipboard(restUrl, 'restUrl')}
                  style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '6px', color: '#fff', padding: '6px 10px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {copiedField === 'restUrl' ? <Check size={12} color="#4ade80" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            {/* Input 2 */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>InpApiKey</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  readOnly
                  value={apiKey}
                  type="password"
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e2e8f0', padding: '6px 10px', fontSize: '11px', flex: 1, fontFamily: 'monospace' }}
                />
                <button
                  onClick={() => copyToClipboard(apiKey, 'apiKey')}
                  style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '6px', color: '#fff', padding: '6px 10px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {copiedField === 'apiKey' ? <Check size={12} color="#4ade80" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            {/* Input 3 */}
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>InpUserId (ID Akun Anda)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  readOnly
                  value={userId || 'Sila Login Terlebih Dahulu'}
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fbbf24', padding: '6px 10px', fontSize: '11px', flex: 1, fontFamily: 'monospace', fontWeight: 'bold' }}
                />
                <button
                  onClick={() => copyToClipboard(userId, 'userId')}
                  style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '6px', color: '#fff', padding: '6px 10px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {copiedField === 'userId' ? <Check size={12} color="#4ade80" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px', background: 'rgba(255,255,255,0.1)', border: 'none',
              borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer'
            }}
          >
            Selesai
          </button>
        </div>

      </div>
    </div>
  );
}
