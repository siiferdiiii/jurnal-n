import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Search, 
  Filter, 
  Eye, 
  Calendar,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { getJurnal, getMetode } from '../lib/api';
import Lightbox from '../components/Lightbox';

export default function Gallery({ dbTrigger, userId }) {
  const [trades, setTrades] = useState([]);
  const [methods, setMethods] = useState([]);
  const [selectedTrade, setSelectedTrade] = useState(null);
  
  // Lightbox Zoom State
  const [activeLightbox, setActiveLightbox] = useState(null);

  // Bubble text state & timer
  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    // Show bubble after 3.5 seconds
    const initialTimer = setTimeout(() => {
      setShowBubble(true);
      // Hide bubble after 4.5 seconds
      setTimeout(() => setShowBubble(false), 4500);
    }, 3500);

    // Repeat every 20 seconds, showing for 4.5 seconds
    const interval = setInterval(() => {
      setShowBubble(true);
      setTimeout(() => setShowBubble(false), 4500);
    }, 20000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  // Filters State
  const [filterPair, setFilterPair] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterResult, setFilterResult] = useState('');

  useEffect(() => {
    Promise.all([getMetode(), getJurnal()]).then(([m, j]) => {
      setMethods(m);
      setTrades(j.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)));
    });
  }, [dbTrigger]);

  const getMethodName = (id) => {
    const found = methods.find(m => m.id === id);
    return found ? found.nama : 'Unknown Method';
  };

  // Filter trades that have at least one image
  const filteredTrades = trades.filter(t => {
    const matchesPair = filterPair === '' || t.pair.toLowerCase().includes(filterPair.toLowerCase());
    const matchesMethod = filterMethod === '' || t.metodeId === filterMethod;
    const matchesResult = filterResult === '' || t.hasilTrade === filterResult;
    const hasImage = t.fotoPremarket || t.fotoResult;

    return matchesPair && matchesMethod && matchesResult && hasImage;
  });

  return (
    <>
      <div className="animate-fade-in">
      {/* Filter Bar */}
      <div className="glass-card mb-30 flex-between" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '16px 24px' }}>
        <div className="flex-align-center gap-10" style={{ flex: 1, minWidth: '240px' }}>
          <Search size={18} className="text-secondary" />
          <input 
            type="text" 
            placeholder="Cari pair (misal: BTCUSD)..." 
            value={filterPair} 
            onChange={e => setFilterPair(e.target.value)}
            style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
          />
        </div>
        
        <div className="flex-align-center gap-20">
          <div className="flex-align-center gap-10">
            <Filter size={16} className="text-secondary" />
            <select 
              value={filterMethod} 
              onChange={e => setFilterMethod(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '13px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', width: '180px' }}
            >
              <option value="">Semua Metode</option>
              {methods.map(m => (
                <option key={m.id} value={m.id}>{m.nama}</option>
              ))}
            </select>
          </div>

          <div className="flex-align-center gap-10">
            <select 
              value={filterResult} 
              onChange={e => setFilterResult(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '13px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', width: '150px' }}
            >
              <option value="">Semua Hasil</option>
              <option value="win">Win (Full TP)</option>
              <option value="lose">Lose (Full SL)</option>
              <option value="break_even">Break Even</option>
              <option value="partial_tp">Partial TP</option>
              <option value="sl+">SL+</option>
              <option value="sl">SL Kecil</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid Galeri */}
      {filteredTrades.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
          <ImageIcon size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
          <p>Tidak ditemukan foto chart setup yang sesuai filter.</p>
        </div>
      ) : (
        <div className="gallery-grid">
          {filteredTrades.map((trade) => (
            <div 
              key={trade.id} 
              className="glass-card" 
              style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer' }}
              onClick={() => setSelectedTrade(trade)}
            >
              {/* Header Card */}
              <div className="flex-between">
                <div>
                  <h3 style={{ fontSize: '15px', color: '#fff', fontWeight: '700', margin: 0 }}>
                    {trade.pair}
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {trade.tanggal}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span className={`badge ${trade.arah === 'BUY' ? 'badge-buy' : 'badge-sell'}`} style={{ fontSize: '10px' }}>
                    {trade.arah}
                  </span>
                  <span className={`badge badge-${trade.hasilTrade}`} style={{ fontSize: '10px' }}>
                    {trade.hasilTrade}
                  </span>
                </div>
              </div>

              {/* Side by Side Preview */}
              <div className="chart-preview-grid">
                <div style={{ position: 'relative', aspectRatio: '16/10', background: '#000', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.04)' }}>
                  {trade.fotoPremarket ? (
                    <img src={trade.fotoPremarket} alt="Premarket Setup" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>No Premarket</div>
                  )}
                  <div style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '3px', fontSize: '9px', fontWeight: 'bold' }}>PREMARKET</div>
                </div>

                <div style={{ position: 'relative', aspectRatio: '16/10', background: '#000', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.04)' }}>
                  {trade.fotoResult ? (
                    <img src={trade.fotoResult} alt="Result Chart" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>No Result</div>
                  )}
                  <div style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '3px', fontSize: '9px', fontWeight: 'bold' }}>RESULT</div>
                </div>
              </div>

              {/* Catatan Singkat Evaluasi */}
              {trade.catatanHariIni && (
                <p style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  margin: '4px 0',
                  lineHeight: '1.5',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {trade.catatanHariIni}
                </p>
              )}

              {/* Footer Card */}
              <div className="flex-between" style={{ fontSize: '12px', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px', marginTop: '4px' }}>
                <span>Metode: {getMethodName(trade.metodeId)}</span>
                <span className="flex-align-center text-win" style={{ fontWeight: '600' }}>
                  <Eye size={12} style={{ marginRight: '4px' }} /> Detail Setup
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* DETAIL MODAL FROM GALLERY */}
      {selectedTrade && (
        <div className="modal-overlay" onClick={() => setSelectedTrade(null)}>
          <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedTrade(null)}>
              <X size={24} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '22px', margin: 0, fontWeight: '700', color: '#fff' }}>
                Evaluasi Setup {selectedTrade.pair} ({selectedTrade.arah})
              </h2>
              <span className={`badge badge-${selectedTrade.hasilTrade}`} style={{ fontSize: '14px', padding: '6px 12px' }}>
                {selectedTrade.hasilTrade.toUpperCase()}
              </span>
              <span className={`badge ${selectedTrade.arah === 'BUY' ? 'badge-buy' : 'badge-sell'}`} style={{ fontSize: '14px', padding: '6px 12px' }}>
                {selectedTrade.arah}
              </span>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Dibuat pada tanggal <strong>{selectedTrade.tanggal}</strong> • Metode: <strong>{getMethodName(selectedTrade.metodeId)}</strong>
            </p>

            {/* Grid Chart Perbandingan */}
            <div className="chart-comparison-grid">
               <div className="chart-box">
                <h4>Premarket Analysis (Setup)</h4>
                <div className="chart-image-wrapper">
                  {selectedTrade.fotoPremarket ? (
                    <img 
                      src={selectedTrade.fotoPremarket} 
                      alt="Premarket Setup" 
                      style={{ cursor: 'zoom-in' }}
                      onClick={() => setActiveLightbox({ src: selectedTrade.fotoPremarket, caption: 'Premarket Setup' })}
                    />
                  ) : (
                    <div className="chart-image-placeholder">
                      <ImageIcon size={32} />
                      <span>Tidak ada gambar premarket</span>
                    </div>
                  )}
                </div>
              </div>

               <div className="chart-box">
                <h4>Trade Result (Exit)</h4>
                <div className="chart-image-wrapper">
                  {selectedTrade.fotoResult ? (
                    <img 
                      src={selectedTrade.fotoResult} 
                      alt="Trade Result" 
                      style={{ cursor: 'zoom-in' }}
                      onClick={() => setActiveLightbox({ src: selectedTrade.fotoResult, caption: 'Trade Result' })}
                    />
                  ) : (
                    <div className="chart-image-placeholder">
                      <ImageIcon size={32} />
                      <span>Tidak ada gambar hasil</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Info Metrics, Checklist, Mental */}
            <div className="modal-info-grid">
              {/* Hasil Finansial */}
              <div className="glass-card" style={{ padding: '16px' }}>
                <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px', fontWeight: '700' }}>
                  Metrik Hasil
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="flex-between">
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Profit/Loss:</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: selectedTrade.profitNominal > 0 ? 'var(--color-win)' : selectedTrade.profitNominal < 0 ? 'var(--color-lose)' : '#fff' }}>
                      {selectedTrade.profitNominal > 0 ? `+$${selectedTrade.profitNominal}` : selectedTrade.profitNominal < 0 ? `-$${Math.abs(selectedTrade.profitNominal)}` : '$0'}
                    </strong>
                  </div>
                  <div className="flex-between">
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Rencana R:R:</span>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>{selectedTrade.riskRewardRatio}R</strong>
                  </div>
                  <div className="flex-between">
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Aktual R:R Diperoleh:</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-secondary)' }}>{selectedTrade.rrDiperoleh}R</strong>
                  </div>
                  <div className="flex-between">
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Tipe Pergerakan:</span>
                    <strong style={{ textTransform: 'capitalize' }}>{selectedTrade.jenisTrade}</strong>
                  </div>
                </div>
              </div>

              {/* SOP Compliance */}
              <div className="glass-card" style={{ padding: '16px' }}>
                <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px', fontWeight: '700' }}>
                  Verifikasi SOP Checklist
                </h4>
                {selectedTrade.checklistTerpenuhi && selectedTrade.checklistTerpenuhi.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedTrade.checklistTerpenuhi.map((item, idx) => (
                      <div key={idx} className="flex-align-center gap-10" style={{ fontSize: '12px' }}>
                        <CheckCircle size={12} style={{ color: 'var(--color-win)' }} />
                        <span style={{ color: '#fff' }}>{item}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={14} />
                    Tidak ada SOP yang dicentang.
                  </div>
                )}
              </div>

              {/* Psychological Review */}
              <div className="glass-card" style={{ padding: '16px' }}>
                <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px', fontWeight: '700' }}>
                  Kondisi Mental & Hambatan
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Sebelum entry: </span>
                    <strong>{selectedTrade.psikologiSebelum}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Saat entry: </span>
                    <strong>{selectedTrade.psikologiSaatOpen}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Setelah close: </span>
                    <strong>{selectedTrade.psikologiSetelah}</strong>
                  </div>
                  
                  {selectedTrade.faktorKesalahan && selectedTrade.faktorKesalahan.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <span style={{ color: 'var(--color-lose)', fontWeight: '600' }}>Hambatan emosi terdeteksi:</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {selectedTrade.faktorKesalahan.map(f => (
                          <span key={f} className="badge badge-lose" style={{ fontSize: '9px', padding: '2px 6px', textTransform: 'uppercase' }}>
                            {f.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Catatan Harian Evaluasi */}
            {selectedTrade.catatanHariIni && (
              <div className="glass-card" style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.015)' }}>
                <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '700' }}>
                  Catatan Evaluasi Trade
                </h4>
                <p style={{ fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                  {selectedTrade.catatanHariIni}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button 
                onClick={() => setSelectedTrade(null)} 
                className="btn btn-secondary"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
      
      {activeLightbox && (
        <Lightbox 
          src={activeLightbox.src} 
          caption={activeLightbox.caption} 
          onClose={() => setActiveLightbox(null)} 
        />
      )}

      {/* Floating Coffee / Support Button */}
      <div className="floating-coffee-container">
        {/* Speech Bubble */}
        <div style={{
          position: 'absolute',
          bottom: '72px',
          right: '0',
          background: 'rgba(18, 20, 29, 0.95)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '12px',
          padding: '10px 16px',
          color: '#fbbf24',
          fontSize: '13px',
          fontWeight: '600',
          whiteSpace: 'nowrap',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 16px rgba(245, 158, 11, 0.1)',
          opacity: showBubble ? 1 : 0,
          transform: showBubble ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.9)',
          transformOrigin: 'bottom right',
          pointerEvents: showBubble ? 'auto' : 'none',
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}>
          Mau traktir kami kopi? ☕
          {/* Pointer */}
          <div style={{
            position: 'absolute',
            bottom: '-6px',
            right: '22px',
            width: '10px',
            height: '10px',
            background: 'rgba(18, 20, 29, 0.95)',
            borderRight: '1px solid rgba(245, 158, 11, 0.3)',
            borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
            transform: 'rotate(45deg)',
          }} />
        </div>

        {/* Button */}
        <a
          href="https://sociabuzz.com/figmaboy/tribe"
          target="_blank"
          rel="noopener noreferrer"
          className="floating-coffee-btn"
        >
          ☕
        </a>
      </div>

      <style>{`
        .floating-coffee-container {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 1000;
        }
        @media (max-width: 768px) {
          .floating-coffee-container {
            bottom: 92px;
            right: 16px;
          }
        }
        .floating-coffee-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          box-shadow: 0 0 20px rgba(245, 158, 11, 0.4), 0 4px 12px rgba(0,0,0,0.5);
          color: #fff;
          font-size: 24px;
          text-decoration: none;
          opacity: 0.5;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        .floating-coffee-btn:hover {
          opacity: 1;
          transform: scale(1.1) rotate(5deg);
          box-shadow: 0 0 28px rgba(245, 158, 11, 0.6), 0 6px 16px rgba(0,0,0,0.6);
        }
      `}</style>
    </>
  );
}
