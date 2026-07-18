import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  Image as ImageIcon,
  CheckCircle,
  Eye,
  AlertCircle,
  TrendingUp,
  Brain,
  X
} from 'lucide-react';
import { getJurnal, getMetode, saveJurnal, deleteJurnal } from '../lib/api';
import Lightbox from '../components/Lightbox';

// Helper kompresi gambar
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIMENSION = 1920; // Resolusi Full HD kustom
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Kompres ke JPEG dengan kualitas tinggi 90% untuk teks & candle yang tajam
        const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
        resolve(dataUrl);
      };
    };
    reader.onerror = error => reject(error);
  });
}

export default function Journal({ dbTrigger, onDataChange, userId }) {
  const [journals, setJournals] = useState([]);
  const [methods, setMethods] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('list'); // 'list' | 'add'
  
  // States for Filtering
  const [filterPair, setFilterPair] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterResult, setFilterResult] = useState('');
  
  // Selected Trade Modal Detail
  const [selectedTrade, setSelectedTrade] = useState(null);
  
  // Lightbox Zoom State
  const [activeLightbox, setActiveLightbox] = useState(null);

  // Form States
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [pair, setPair] = useState('');
  const [arah, setArah] = useState('BUY');
  const [jenisTrade, setJenisTrade] = useState('continuation');
  const [metodeId, setMetodeId] = useState('');
  const [checklistTerpenuhi, setChecklistTerpenuhi] = useState([]);
  const [keyLevelDigunakan, setKeyLevelDigunakan] = useState('');
  const [triggerEntry, setTriggerEntry] = useState('');
  const [riskRewardRatio, setRiskRewardRatio] = useState(2);
  const [hasilTrade, setHasilTrade] = useState('win');
  const [profitNominal, setProfitNominal] = useState('');
  const [rrDiperoleh, setRrDiperoleh] = useState('');
  
  const [psikologiSebelum, setPsikologiSebelum] = useState('Tenang');
  const [psikologiSaatOpen, setPsikologiSaatOpen] = useState('Tenang');
  const [psikologiSetelah, setPsikologiSetelah] = useState('Tenang');
  const [faktorKesalahan, setFaktorKesalahan] = useState([]);
  
  const [catatanHariIni, setCatatanHariIni] = useState('');
  const [premarketFile, setPremarketFile] = useState(null);
  const [resultFile, setResultFile] = useState(null);
  const [premarketPreview, setPremarketPreview] = useState('');
  const [resultPreview, setResultPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load methods & journals
  useEffect(() => {
    Promise.all([getMetode(), getJurnal()]).then(([m, j]) => {
      setMethods(m);
      setJournals(j.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)));
    });
  }, [dbTrigger]);

  // Set default form values when method changes
  useEffect(() => {
    if (metodeId) {
      const selectedM = methods.find(m => m.id === metodeId);
      if (selectedM) {
        setChecklistTerpenuhi([]);
        setKeyLevelDigunakan(selectedM.keyLevels?.[0] || '');
        setTriggerEntry(selectedM.triggers?.[0] || '');
      }
    }
  }, [metodeId, methods]);

  // Set default RR & Profit when hasilTrade changes
  useEffect(() => {
    if (hasilTrade === 'win') {
      setRrDiperoleh(riskRewardRatio);
    } else if (hasilTrade === 'lose') {
      setRrDiperoleh(-1);
    } else if (hasilTrade === 'break_even') {
      setRrDiperoleh(0);
      setProfitNominal(0);
    } else if (hasilTrade === 'sl') {
      setRrDiperoleh(-1);
    } else if (hasilTrade === 'sl+') {
      setRrDiperoleh(0.5);
    } else if (hasilTrade === 'partial_tp') {
      setRrDiperoleh(Math.max(0.5, (riskRewardRatio / 2)));
    }
  }, [hasilTrade, riskRewardRatio]);

  const handleSopCheck = (sopItem) => {
    if (checklistTerpenuhi.includes(sopItem)) {
      setChecklistTerpenuhi(checklistTerpenuhi.filter(i => i !== sopItem));
    } else {
      setChecklistTerpenuhi([...checklistTerpenuhi, sopItem]);
    }
  };

  const handleErrorFactorCheck = (factor) => {
    if (faktorKesalahan.includes(factor)) {
      setFaktorKesalahan(faktorKesalahan.filter(i => i !== factor));
    } else {
      setFaktorKesalahan([...faktorKesalahan, factor]);
    }
  };

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressedBase64 = await compressImage(file);
      if (type === 'premarket') {
        setPremarketFile(file);
        setPremarketPreview(compressedBase64);
      } else {
        setResultFile(file);
        setResultPreview(compressedBase64);
      }
    } catch (err) {
      console.error('File compression failed:', err);
      alert('Gagal memproses berkas gambar, silakan coba berkas lain.');
    }
  };

  const handleSaveTrade = async (e) => {
    e.preventDefault();
    if (!pair) {
      alert('Silakan isi Trading Pair (misal: EURUSD).');
      return;
    }
    if (!metodeId) {
      alert('Silakan pilih metode trading.');
      return;
    }

    setIsSubmitting(true);

    const tradeEntry = {

      tanggal,
      pair: pair.toUpperCase().trim(),
      arah,
      jenisTrade,
      metodeId,
      checklistTerpenuhi,
      keyLevelDigunakan,
      triggerEntry,
      riskRewardRatio: parseFloat(riskRewardRatio) || 0,
      hasilTrade,
      profitNominal: parseFloat(profitNominal) || 0,
      rrDiperoleh: parseFloat(rrDiperoleh) || 0,
      psikologiSebelum,
      psikologiSaatOpen,
      psikologiSetelah,
      faktorKesalahan,
      fotoPremarket: premarketPreview || null,
      fotoResult: resultPreview || null,
      catatanHariIni: catatanHariIni.trim()
    };

    try {
      await saveJurnal(tradeEntry, userId);
      onDataChange();
      // Reset Form & Switch View
      setPair('');
      setMetodeId('');
      setChecklistTerpenuhi([]);
      setFaktorKesalahan([]);
      setProfitNominal('');
      setRrDiperoleh('');
      setCatatanHariIni('');
      setPremarketFile(null);
      setResultFile(null);
      setPremarketPreview('');
      setResultPreview('');
      setActiveSubTab('list');
    } catch (err) {
      console.error('Gagal menyimpan trade:', err);
      alert('Gagal menyimpan trade. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTrade = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus catatan trade ini dari jurnal?')) {
      try {
        await deleteJurnal(id);
        onDataChange();
        if (selectedTrade?.id === id) setSelectedTrade(null);
      } catch (err) {
        console.error('Gagal menghapus trade:', err);
        alert('Gagal menghapus trade. Coba lagi.');
      }
    }
  };

  const getMethodName = (id) => {
    const found = methods.find(m => m.id === id);
    return found ? found.nama : 'Unknown Method';
  };

  // Filtered Journals
  const filteredJournals = journals.filter(j => {
    return (
      (filterPair === '' || j.pair.toLowerCase().includes(filterPair.toLowerCase())) &&
      (filterMethod === '' || j.metodeId === filterMethod) &&
      (filterResult === '' || j.hasilTrade === filterResult)
    );
  });

  const activeMethod = methods.find(m => m.id === metodeId);

  return (
    <>
      <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Jurnal Transaksi</h1>
          <p>Catat analisis pra-market, evaluasi SOP, kondisi mental, dan simpan riwayat trade Anda.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setActiveSubTab('list')} 
            className={`btn ${activeSubTab === 'list' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Riwayat Trade
          </button>
          <button 
            onClick={() => setActiveSubTab('add')} 
            className={`btn ${activeSubTab === 'add' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Plus size={16} />
            Catat Trade Baru
          </button>
        </div>
      </div>

      {activeSubTab === 'add' ? (
        /* FORM CATAT TRADE BARU */
        <form onSubmit={handleSaveTrade} className="glass-card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
            Catat Evaluasi Trade
          </h2>
          
          <div className="form-row">
            {/* Kolom Kiri: Detail Market & Parameter Teknis */}
            <div>
              <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--accent)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={16} /> Parameter Teknis
              </h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Tanggal Trade</label>
                  <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Trading Pair *</label>
                  <input type="text" placeholder="Contoh: EURUSD, BTCUSD, XAUUSD" value={pair} onChange={e => setPair(e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Aksi Posisi</label>
                  <select value={arah} onChange={e => setArah(e.target.value)}>
                    <option value="BUY">BUY / LONG</option>
                    <option value="SELL">SELL / SHORT</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Jenis Pergerakan</label>
                  <select value={jenisTrade} onChange={e => setJenisTrade(e.target.value)}>
                    <option value="continuation">Continuation (Ikut Tren)</option>
                    <option value="reversal">Reversal (Balik Arah)</option>
                    <option value="ranging">Ranging / Sideways (Batasan Range)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Pilih Metode / Strategi *</label>
                <select value={metodeId} onChange={e => setMetodeId(e.target.value)}>
                  <option value="">-- Pilih Metode --</option>
                  {methods.map(m => (
                    <option key={m.id} value={m.id}>{m.nama}</option>
                  ))}
                </select>
              </div>

              {/* Dynamic Key Levels & Triggers */}
              {activeMethod && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Key Level Terpilih</label>
                    <select value={keyLevelDigunakan} onChange={e => setKeyLevelDigunakan(e.target.value)}>
                      {activeMethod.keyLevels?.map((kl, i) => (
                        <option key={i} value={kl}>{kl}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Entry Trigger Terpilih</label>
                    <select value={triggerEntry} onChange={e => setTriggerEntry(e.target.value)}>
                      {activeMethod.triggers?.map((tr, i) => (
                        <option key={i} value={tr}>{tr}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* SOP Checklist Validation */}
              {activeMethod && activeMethod.sopChecklist && (
                <div className="form-group" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: '16px', borderRadius: 'var(--radius-md)', margin: '16px 0' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                    SOP Checklist Verifikator (Wajib dicek jika dipenuhi):
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {activeMethod.sopChecklist.map((sop, idx) => (
                      <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}>
                        <input 
                          type="checkbox" 
                          style={{ width: 'auto' }}
                          checked={checklistTerpenuhi.includes(sop)} 
                          onChange={() => handleSopCheck(sop)} 
                        />
                        <span style={{ textDecoration: checklistTerpenuhi.includes(sop) ? 'line-through' : 'none', color: checklistTerpenuhi.includes(sop) ? 'var(--text-muted)' : '#fff' }}>
                          {sop}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--accent-secondary)', marginTop: '24px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Outcome & PnL
              </h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Hasil Outcome</label>
                  <select value={hasilTrade} onChange={e => setHasilTrade(e.target.value)}>
                    <option value="win">Win (Full TP)</option>
                    <option value="lose">Lose (Full SL)</option>
                    <option value="break_even">Break Even (BE)</option>
                    <option value="partial_tp">Partial TP</option>
                    <option value="sl+">SL+ (Stop Profit)</option>
                    <option value="sl">SL (Stop Loss Kecil)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Rencana Risk-to-Reward (R:R)</label>
                  <input type="number" step="0.1" value={riskRewardRatio} onChange={e => setRiskRewardRatio(e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Profit / Loss (USD) *</label>
                  <input type="number" placeholder="Contoh: 250 atau -100" value={profitNominal} onChange={e => setProfitNominal(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Aktual R:R Diperoleh</label>
                  <input type="number" step="0.1" value={rrDiperoleh} onChange={e => setRrDiperoleh(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Kolom Kanan: Evaluasi Psikologi & Upload Chart */}
            <div>
              <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--accent)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Brain size={16} /> Faktor Psikologis
              </h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Perasaan Sebelum Open</label>
                  <select value={psikologiSebelum} onChange={e => setPsikologiSebelum(e.target.value)}>
                    <option value="Tenang">Tenang / Objektif</option>
                    <option value="FOMO">FOMO (Takut Ketinggalan)</option>
                    <option value="Gugup">Gugup / Ragu</option>
                    <option value="Balas Dendam">Balas Dendam (Revenge)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Perasaan Saat Posisi Jalan</label>
                  <select value={psikologiSaatOpen} onChange={e => setPsikologiSaatOpen(e.target.value)}>
                    <option value="Tenang">Tenang / Santai</option>
                    <option value="Takut">Takut / Khawatir</option>
                    <option value="Serakah">Serakah (Greedy)</option>
                    <option value="Geser SL">Ingin Geser SL/TP</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Perasaan Setelah Close</label>
                  <select value={psikologiSetelah} onChange={e => setPsikologiSetelah(e.target.value)}>
                    <option value="Puas">Puas / Sesuai Plan</option>
                    <option value="Kecewa">Kecewa / Menyesal</option>
                    <option value="Marah">Marah / Frustrasi</option>
                    <option value="Netral">Netral / Biasa Saja</option>
                  </select>
                </div>
              </div>

              {/* Checkbox Kesalahan Mental */}
              <div className="form-group" style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.04)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  Faktor Kesalahan Eksternal (Emosional):
                </label>
                <div className="form-grid-2">
                  {[
                    ['fomo', 'FOMO / Mengejar Harga'],
                    ['serakah', 'Serakah / Over-lotting'],
                    ['takut', 'Takut Loss / Cut Early'],
                    ['geser_sl', 'Menggeser Stop Loss'],
                    ['overtrade', 'Overtrading / Balas Dendam']
                  ].map(([key, labelText]) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        style={{ width: 'auto' }}
                        checked={faktorKesalahan.includes(key)}
                        onChange={() => handleErrorFactorCheck(key)}
                      />
                      {labelText}
                    </label>
                  ))}
                </div>
              </div>

              <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-be)', marginTop: '24px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={16} /> Dokumentasi Visual & Catatan
              </h3>

              {/* Upload Dropzone */}
              <div className="form-row">
                <div className="form-group">
                  <label>Premarket Chart (Analisis)</label>
                  <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'premarket')} />
                  {premarketPreview && (
                    <div style={{ marginTop: '8px', width: '100%', height: '100px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--panel-border)' }}>
                      <img src={premarketPreview} alt="Premarket Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Result Chart (Exit Posisi)</label>
                  <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'result')} />
                  {resultPreview && (
                    <div style={{ marginTop: '8px', width: '100%', height: '100px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--panel-border)' }}>
                      <img src={resultPreview} alt="Result Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Catatan Hari Ini (Evaluasi Ringkas)</label>
                <textarea rows="4" placeholder="Tulis catatan, emosi, kendala, atau kepatuhan SOP Anda hari ini..." value={catatanHariIni} onChange={e => setCatatanHariIni(e.target.value)}></textarea>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
            <button type="button" onClick={() => setActiveSubTab('list')} className="btn btn-secondary">Batal</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Menyimpan...' : 'Simpan Jurnal Trade'}
            </button>
          </div>
        </form>
      ) : (
        /* TABLE HISTORY LIST */
        <div>
          {/* Filter Bar */}
          <div className="glass-card mb-20 flex-between" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '16px 24px' }}>
            <div className="flex-align-center gap-10" style={{ flex: 1, minWidth: '240px' }}>
              <Search size={18} className="text-secondary" />
              <input 
                type="text" 
                placeholder="Cari pair (misal: EURUSD)..." 
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

          {/* Table Container */}
          <div className="glass-card" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.01)' }}>
                  <th style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>Tanggal</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>Pair</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>Posisi</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>Metode</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>Hasil</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>PnL (USD)</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>Aktual R:R</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredJournals.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                      Tidak ditemukan riwayat trade yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredJournals.map((trade) => (
                    <tr 
                      key={trade.id} 
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'var(--transition-normal)' }}
                      className="table-row-hover"
                    >
                      <td style={{ padding: '16px 20px', fontWeight: '500' }}>
                        <span className="flex-align-center gap-10">
                          <CalendarIcon size={14} className="text-secondary" />
                          {trade.tanggal}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: '700', color: '#fff' }}>{trade.pair}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <span className={`badge ${trade.arah === 'BUY' ? 'badge-buy' : 'badge-sell'}`}>
                          {trade.arah}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{getMethodName(trade.metodeId)}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <span className={`badge badge-${trade.hasilTrade}`}>
                          {trade.hasilTrade}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: trade.profitNominal > 0 ? 'var(--color-win)' : trade.profitNominal < 0 ? 'var(--color-lose)' : '#fff' }}>
                        {trade.profitNominal > 0 ? `+$${trade.profitNominal}` : trade.profitNominal < 0 ? `-$${Math.abs(trade.profitNominal)}` : '$0'}
                      </td>
                      <td style={{ padding: '16px 20px', fontFamily: 'var(--font-mono)', color: 'var(--accent-secondary)' }}>
                        {trade.rrDiperoleh >= 0 ? `+${trade.rrDiperoleh}R` : `${trade.rrDiperoleh}R`}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => setSelectedTrade(trade)} 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                          >
                            <Eye size={12} /> Detail
                          </button>
                          <button 
                            onClick={() => handleDeleteTrade(trade.id)} 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 10px', fontSize: '12px', color: 'var(--color-lose)' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {/* DETAIL MODAL OVERLAY */}
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

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
              <button 
                onClick={() => {
                  handleDeleteTrade(selectedTrade.id);
                }} 
                className="btn btn-danger"
              >
                Hapus Trade Jurnal
              </button>
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
    </>
  );
}
