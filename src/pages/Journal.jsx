import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  X,
  Pencil,
  MessageSquare,
  Send,
  User,
  Check,
  Zap,
  Clipboard,
  UploadCloud,
  Maximize2,
  RefreshCw
} from 'lucide-react';
import { getJurnal, getMetode, saveJurnal, deleteJurnal } from '../lib/api';
import Lightbox from '../components/Lightbox';

function formatCommentTime(ts) {
  if (!ts) return '';
  const date = new Date(ts);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Helper kompresi gambar (mendukung File, Blob, Data URL, dan Image URL)
function compressImage(fileOrBlobOrDataUrl) {
  return new Promise((resolve, reject) => {
    if (typeof fileOrBlobOrDataUrl === 'string') {
      if (fileOrBlobOrDataUrl.startsWith('data:image/')) {
        const img = new Image();
        img.src = fileOrBlobOrDataUrl;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_DIMENSION = 1920;
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
          resolve(canvas.toDataURL('image/jpeg', 0.90));
        };
        img.onerror = error => reject(error);
        return;
      }
      resolve(fileOrBlobOrDataUrl);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(fileOrBlobOrDataUrl);
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
      img.onerror = error => reject(error);
    };
    reader.onerror = error => reject(error);
  });
}

export default function Journal({ dbTrigger, onDataChange, userId }) {
  const [journals, setJournals] = useState([]);
  const [methods, setMethods] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('list'); // 'list' | 'add'
  
  // Edit State
  const [editingTradeId, setEditingTradeId] = useState(null);

  // Comment states for detail modal
  const [newCommentText, setNewCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  // States for Filtering
  const [filterPair, setFilterPair] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterResult, setFilterResult] = useState('');
  const [filterKonfirmasi, setFilterKonfirmasi] = useState('');
  
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
  const [konfirmasiEntry, setKonfirmasiEntry] = useState([]);
  const [customKonfirmasiInput, setCustomKonfirmasiInput] = useState('');
  const [riskRewardRatio, setRiskRewardRatio] = useState(2);
  const [hasilTrade, setHasilTrade] = useState('win');
  const [profitNominal, setProfitNominal] = useState('');
  const [rrDiperoleh, setRrDiperoleh] = useState('');
  
  const [psikologiSebelum, setPsikologiSebelum] = useState('Tenang');
  const [psikologiSaatOpen, setPsikologiSaatOpen] = useState('Tenang');
  const [psikologiSetelah, setPsikologiSetelah] = useState('Tenang');
  const [faktorKesalahan, setFaktorKesalahan] = useState([]);
  
  const [catatanHariIni, setCatatanHariIni] = useState('');
  const [premarketPreview, setPremarketPreview] = useState('');
  const [resultPreview, setResultPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States & Refs for Ctrl+V image paste feature
  const [activePasteTarget, setActivePasteTarget] = useState('premarket'); // 'premarket' | 'result'
  const [isProcessingImage, setIsProcessingImage] = useState({ premarket: false, result: false });
  const [isDragging, setIsDragging] = useState({ premarket: false, result: false });
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimeoutRef = useRef(null);
  const premarketInputRef = useRef(null);
  const resultInputRef = useRef(null);

  // Load methods & journals
  useEffect(() => {
    Promise.all([getMetode(userId), getJurnal(userId)]).then(([m, j]) => {
      setMethods(m);
      setJournals(j.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)));
    });
  }, [dbTrigger, userId]);

  const resetForm = () => {
    setEditingTradeId(null);
    setTanggal(new Date().toISOString().split('T')[0]);
    setPair('');
    setArah('BUY');
    setJenisTrade('continuation');
    setMetodeId('');
    setChecklistTerpenuhi([]);
    setKeyLevelDigunakan('');
    setTriggerEntry('');
    setKonfirmasiEntry([]);
    setCustomKonfirmasiInput('');
    setRiskRewardRatio(2);
    setHasilTrade('win');
    setProfitNominal('');
    setRrDiperoleh('');
    setPsikologiSebelum('Tenang');
    setPsikologiSaatOpen('Tenang');
    setPsikologiSetelah('Tenang');
    setFaktorKesalahan([]);
    setCatatanHariIni('');
    setPremarketPreview('');
    setResultPreview('');
    setActivePasteTarget('premarket');
    if (premarketInputRef.current) premarketInputRef.current.value = '';
    if (resultInputRef.current) resultInputRef.current.value = '';
  };

  const handleEditTrade = (trade) => {
    setEditingTradeId(trade.id);
    setTanggal(trade.tanggal || new Date().toISOString().split('T')[0]);
    setPair(trade.pair || '');
    setArah(trade.arah || 'BUY');
    setJenisTrade(trade.jenisTrade || 'continuation');
    setMetodeId(trade.metodeId || '');
    setChecklistTerpenuhi(trade.checklistTerpenuhi || []);
    setKeyLevelDigunakan(trade.keyLevelDigunakan || '');
    setTriggerEntry(trade.triggerEntry || '');
    setKonfirmasiEntry(trade.konfirmasiEntry || []);
    setRiskRewardRatio(trade.riskRewardRatio || 2);
    setHasilTrade(trade.hasilTrade || 'win');
    setProfitNominal(trade.profitNominal != null ? trade.profitNominal : '');
    setRrDiperoleh(trade.rrDiperoleh != null ? trade.rrDiperoleh : '');
    setPsikologiSebelum(trade.psikologiSebelum || 'Tenang');
    setPsikologiSaatOpen(trade.psikologiSaatOpen || 'Tenang');
    setPsikologiSetelah(trade.psikologiSetelah || 'Tenang');
    setFaktorKesalahan(trade.faktorKesalahan || []);
    setCatatanHariIni(trade.catatanHariIni || '');
    setPremarketPreview(trade.fotoPremarket || '');
    setResultPreview(trade.fotoResult || '');
    setActivePasteTarget(trade.fotoPremarket && !trade.fotoResult ? 'result' : 'premarket');

    if (selectedTrade) setSelectedTrade(null);
    setActiveSubTab('add');
  };

  // Set default form values when method changes (only when creating new trade)
  useEffect(() => {
    if (metodeId && !editingTradeId) {
      const selectedM = methods.find(m => m.id === metodeId);
      if (selectedM) {
        setChecklistTerpenuhi([]);
        setKeyLevelDigunakan(selectedM.keyLevels?.[0] || '');
        setTriggerEntry(selectedM.triggers?.[0] || '');
        setKonfirmasiEntry(selectedM.triggers || []);
      }
    }
  }, [metodeId, methods, editingTradeId]);

  // Set default RR & Profit when hasilTrade changes (only when creating new trade)
  useEffect(() => {
    if (!editingTradeId) {
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
    }
  }, [hasilTrade, riskRewardRatio, editingTradeId]);

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

  const showToast = (message) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const processImage = async (fileOrBlob, targetType) => {
    if (!fileOrBlob) return;
    setIsProcessingImage(prev => ({ ...prev, [targetType]: true }));
    try {
      const compressedBase64 = await compressImage(fileOrBlob);
      if (targetType === 'premarket') {
        setPremarketPreview(compressedBase64);
        showToast('✓ Gambar Premarket Chart berhasil ditempel!');
        if (!resultPreview) {
          setActivePasteTarget('result');
        }
      } else {
        setResultPreview(compressedBase64);
        showToast('✓ Gambar Result Chart berhasil ditempel!');
      }
    } catch (err) {
      console.error('Image processing failed:', err);
      alert('Gagal memproses gambar. Pastikan format gambar valid.');
    } finally {
      setIsProcessingImage(prev => ({ ...prev, [targetType]: false }));
    }
  };

  const extractImageFromClipboard = (clipboardData) => {
    if (!clipboardData) return null;

    if (clipboardData.items) {
      for (let i = 0; i < clipboardData.items.length; i++) {
        const item = clipboardData.items[i];
        if (item.type && item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) return blob;
        }
      }
    }

    if (clipboardData.files && clipboardData.files.length > 0) {
      for (let i = 0; i < clipboardData.files.length; i++) {
        const file = clipboardData.files[i];
        if (file.type && file.type.startsWith('image/')) {
          return file;
        }
      }
    }

    try {
      const text = clipboardData.getData('text')?.trim();
      if (text && (text.startsWith('data:image/') || /^https?:\/\/.*\.(png|jpg|jpeg|webp|gif)($|\?)/i.test(text))) {
        return text;
      }
    } catch {
      // ignore
    }

    return null;
  };

  const handleDropzonePaste = async (e, type) => {
    const img = extractImageFromClipboard(e.clipboardData);
    if (img) {
      e.preventDefault();
      e.stopPropagation();
      await processImage(img, type);
    }
  };

  const handleDragOver = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(prev => ({ ...prev, [type]: true }));
  };

  const handleDragLeave = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(prev => ({ ...prev, [type]: false }));
  };

  const handleDrop = async (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(prev => ({ ...prev, [type]: false }));
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        await processImage(file, type);
      } else {
        alert('File harus berupa gambar (PNG, JPG, WebP).');
      }
    }
  };

  const handlePasteFromClipboardBtn = async (type) => {
    try {
      if (!navigator.clipboard?.read) {
        alert('Browser Anda belum mendukung akses clipboard langsung. Silakan klik kotak ini lalu tekan Ctrl+V pada keyboard.');
        return;
      }
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find(t => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          await processImage(blob, type);
          return;
        }
      }
      
      if (navigator.clipboard.readText) {
        const text = (await navigator.clipboard.readText())?.trim();
        if (text && (text.startsWith('data:image/') || /^https?:\/\/.*\.(png|jpg|jpeg|webp|gif)($|\?)/i.test(text))) {
          await processImage(text, type);
          return;
        }
      }

      alert('Tidak ada gambar di clipboard. Silakan salin gambar/screenshot terlebih dahulu (misal: Win+Shift+S atau Copy Image di TradingView), lalu tekan Ctrl+V.');
    } catch (err) {
      console.warn('Clipboard read error:', err);
      alert('Izin clipboard belum diberikan browser. Anda tetap dapat langsung menekan Ctrl+V pada keyboard!');
    }
  };

  const handleRemoveImage = (type) => {
    if (type === 'premarket') {
      setPremarketPreview('');
      if (premarketInputRef.current) premarketInputRef.current.value = '';
    } else {
      setResultPreview('');
      if (resultInputRef.current) resultInputRef.current.value = '';
    }
    showToast(`Gambar ${type === 'premarket' ? 'Premarket' : 'Result'} dihapus.`);
  };

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    await processImage(file, type);
  };

  // Global window paste listener for Ctrl+V
  useEffect(() => {
    const handleGlobalPaste = async (e) => {
      const img = extractImageFromClipboard(e.clipboardData);
      if (!img) {
        return; // Text paste, let browser handle normally
      }

      // Clipboard has an image! Prevent browser default
      e.preventDefault();

      if (activeSubTab !== 'add') {
        setActiveSubTab('add');
        showToast('✓ Form trade dibuka & screenshot ditempel ke Premarket!');
        await processImage(img, 'premarket');
        setActivePasteTarget('result');
        return;
      }

      let target = activePasteTarget || 'premarket';
      if (!activePasteTarget) {
        if (!premarketPreview) target = 'premarket';
        else if (!resultPreview) target = 'result';
      }

      await processImage(img, target);
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [activeSubTab, activePasteTarget, premarketPreview, resultPreview]);

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
      ...(editingTradeId ? { id: editingTradeId } : {}),
      tanggal,
      pair: pair.toUpperCase().trim(),
      arah,
      jenisTrade,
      metodeId,
      checklistTerpenuhi,
      keyLevelDigunakan,
      triggerEntry,
      konfirmasiEntry,
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
      resetForm();
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

  /* Comment Handlers */
  const handleAddComment = async (tradeId, text) => {
    if (!text || !text.trim()) return;
    const currentTrade = journals.find(t => t.id === tradeId);
    if (!currentTrade) return;

    const newComment = {
      id: 'comm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      text: text.trim(),
      createdAt: Date.now()
    };

    const updatedComments = [...(currentTrade.komentarSetup || []), newComment];
    const updatedTrade = { ...currentTrade, komentarSetup: updatedComments };

    setJournals(prev => prev.map(t => t.id === tradeId ? updatedTrade : t));
    if (selectedTrade?.id === tradeId) {
      setSelectedTrade(updatedTrade);
    }
    setNewCommentText('');

    try {
      await saveJurnal(updatedTrade, userId);
      onDataChange();
    } catch (err) {
      console.error('Gagal menyimpan komentar:', err);
    }
  };

  const handleDeleteComment = async (tradeId, commentId) => {
    const currentTrade = journals.find(t => t.id === tradeId);
    if (!currentTrade) return;

    const updatedComments = (currentTrade.komentarSetup || []).filter(c => c.id !== commentId);
    const updatedTrade = { ...currentTrade, komentarSetup: updatedComments };

    setJournals(prev => prev.map(t => t.id === tradeId ? updatedTrade : t));
    if (selectedTrade?.id === tradeId) {
      setSelectedTrade(updatedTrade);
    }

    try {
      await saveJurnal(updatedTrade, userId);
      onDataChange();
    } catch (err) {
      console.error('Gagal menghapus komentar:', err);
    }
  };

  const handleSaveEditedComment = async (tradeId, commentId) => {
    if (!editingCommentText.trim()) return;
    const currentTrade = journals.find(t => t.id === tradeId);
    if (!currentTrade) return;

    const updatedComments = (currentTrade.komentarSetup || []).map(c => 
      c.id === commentId ? { ...c, text: editingCommentText.trim() } : c
    );
    const updatedTrade = { ...currentTrade, komentarSetup: updatedComments };

    setJournals(prev => prev.map(t => t.id === tradeId ? updatedTrade : t));
    if (selectedTrade?.id === tradeId) {
      setSelectedTrade(updatedTrade);
    }
    setEditingCommentId(null);
    setEditingCommentText('');

    try {
      await saveJurnal(updatedTrade, userId);
      onDataChange();
    } catch (err) {
      console.error('Gagal memperbarui komentar:', err);
    }
  };

  const getMethodName = (id) => {
    const found = methods.find(m => m.id === id);
    return found ? found.nama : 'Unknown Method';
  };

  const allKonfirmasiTags = useMemo(() => {
    return Array.from(new Set(journals.flatMap(j => j.konfirmasiEntry || [])));
  }, [journals]);

  // Filtered Journals
  const filteredJournals = journals.filter(j => {
    const matchesPair = filterPair === '' || j.pair.toLowerCase().includes(filterPair.toLowerCase());
    const matchesMethod = filterMethod === '' || j.metodeId === filterMethod;
    const matchesResult = filterResult === '' || j.hasilTrade === filterResult;
    const matchesKonfirmasi = filterKonfirmasi === '' || (j.konfirmasiEntry && j.konfirmasiEntry.includes(filterKonfirmasi));
    return matchesPair && matchesMethod && matchesResult && matchesKonfirmasi;
  });

  const activeMethod = methods.find(m => m.id === metodeId);

  return (
    <>
      <div className="animate-fade-in">
      <div className="page-header" style={{ justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => { resetForm(); setActiveSubTab('list'); }} 
            className={`btn ${activeSubTab === 'list' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Riwayat Trade
          </button>
          <button 
            onClick={() => { resetForm(); setActiveSubTab('add'); }} 
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
          <h2 style={{ fontSize: '18px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {editingTradeId ? <><Pencil size={18} style={{ color: 'var(--accent)' }} /> Edit Evaluasi Trade</> : 'Catat Evaluasi Trade'}
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
                    <label>Entry Trigger Utama</label>
                    <select value={triggerEntry} onChange={e => setTriggerEntry(e.target.value)}>
                      {activeMethod.triggers?.map((tr, i) => (
                        <option key={i} value={tr}>{tr}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Konfirmasi Entry / Setup Confluences Multi-Select */}
              <div className="form-group" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)', padding: '16px', borderRadius: 'var(--radius-md)', margin: '16px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={14} /> Konfirmasi Entry & Confluences (Multi-Select):
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{konfirmasiEntry.length} Terpilih</span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', marginTop: 0 }}>
                  Centang semua konfirmasi yang kamu miliki saat entry (misal: IFVG M1, M2, CISD, SMT Divergence, dll.) untuk analisis performa strategy.
                </p>

                {/* Available Trigger Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {Array.from(new Set([
                    ...(activeMethod?.triggers || []),
                    'IFVG M1', 'IFVG M2', 'IFVG M3', 'IFVG M5', 'CISD', 'SMT', 'Liquidity Sweep', 'MSS', 'Order Block',
                    ...konfirmasiEntry
                  ])).map((tag) => {
                    const isSelected = konfirmasiEntry.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setKonfirmasiEntry(konfirmasiEntry.filter(t => t !== tag));
                          } else {
                            setKonfirmasiEntry([...konfirmasiEntry, tag]);
                          }
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          background: isSelected ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isSelected ? 'var(--color-win)' : 'rgba(255,255,255,0.1)'}`,
                          color: isSelected ? 'var(--color-win)' : 'var(--text-secondary)',
                        }}
                      >
                        {isSelected ? '✓ ' : '+ '} {tag}
                      </button>
                    );
                  })}
                </div>

                {/* Quick Custom Tag Input */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Tambah konfirmasi kustom lainnya (Enter)..."
                    value={customKonfirmasiInput}
                    onChange={e => setCustomKonfirmasiInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (customKonfirmasiInput.trim() && !konfirmasiEntry.includes(customKonfirmasiInput.trim())) {
                          setKonfirmasiEntry([...konfirmasiEntry, customKonfirmasiInput.trim()]);
                          setCustomKonfirmasiInput('');
                        }
                      }
                    }}
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      if (customKonfirmasiInput.trim() && !konfirmasiEntry.includes(customKonfirmasiInput.trim())) {
                        setKonfirmasiEntry([...konfirmasiEntry, customKonfirmasiInput.trim()]);
                        setCustomKonfirmasiInput('');
                      }
                    }}
                    style={{ padding: '6px 14px', fontSize: '12px', flexShrink: 0 }}
                  >
                    + Tambah
                  </button>
                </div>
              </div>

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

              {/* Upload Dropzones with Ctrl+V, Drag & Drop, and File Browse */}
              <div className="chart-paste-section">
                <div className="chart-paste-grid">
                  {/* Premarket Chart Card */}
                  <div 
                    className={`chart-paste-card ${activePasteTarget === 'premarket' ? 'active-target' : ''}`}
                    onClick={() => setActivePasteTarget('premarket')}
                    tabIndex={0}
                    onPaste={(e) => handleDropzonePaste(e, 'premarket')}
                  >
                    <div className="chart-paste-card-header">
                      <div className="chart-paste-card-title">
                        <ImageIcon size={15} style={{ color: 'var(--accent)' }} />
                        <span>Premarket Chart (Setup Analisis)</span>
                      </div>
                      <span className={`target-badge ${activePasteTarget === 'premarket' ? 'active' : 'inactive'}`}>
                        {activePasteTarget === 'premarket' ? (
                          <>
                            <span className="target-pulse-dot" />
                            Target Ctrl+V
                          </>
                        ) : (
                          'Pilih Target'
                        )}
                      </span>
                    </div>

                    {premarketPreview ? (
                      <div className="chart-preview-wrapper">
                        <img src={premarketPreview} alt="Premarket Preview" className="chart-preview-img" />
                        
                        <div className="chart-preview-toolbar">
                          <button
                            type="button"
                            className="chart-preview-btn"
                            title="Perbesar Gambar"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveLightbox({ src: premarketPreview, caption: 'Premarket Chart Setup' });
                            }}
                          >
                            <Maximize2 size={13} /> Perbesar
                          </button>
                          <button
                            type="button"
                            className="chart-preview-btn"
                            title="Ganti Gambar (Ctrl+V atau pilih file)"
                            onClick={(e) => {
                              e.stopPropagation();
                              premarketInputRef.current?.click();
                            }}
                          >
                            <RefreshCw size={13} /> Ganti
                          </button>
                          <button
                            type="button"
                            className="chart-preview-btn danger"
                            title="Hapus Gambar"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage('premarket');
                            }}
                          >
                            <Trash2 size={13} /> Hapus
                          </button>
                        </div>

                        <div className="chart-preview-bottom-bar">
                          <span>✓ Siap disimpan</span>
                          <span>Tekan Ctrl+V untuk ganti</span>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className={`chart-paste-dropzone ${isDragging.premarket ? 'is-dragging' : ''}`}
                        onDragOver={(e) => handleDragOver(e, 'premarket')}
                        onDragLeave={(e) => handleDragLeave(e, 'premarket')}
                        onDrop={(e) => handleDrop(e, 'premarket')}
                        onClick={() => setActivePasteTarget('premarket')}
                      >
                        {isProcessingImage.premarket ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <div className="spinner" style={{ width: '24px', height: '24px' }} />
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Mengompres & memproses gambar...</span>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)' }}>
                              <Clipboard size={24} />
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>
                              Tekan <kbd className="shortcut-badge">Ctrl</kbd> + <kbd className="shortcut-badge">V</kbd> untuk Paste
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              atau drag & drop screenshot chart ke sini
                            </div>

                            <div className="chart-dropzone-actions" onClick={e => e.stopPropagation()}>
                              <button
                                type="button"
                                className="btn-dropzone-action primary"
                                onClick={() => handlePasteFromClipboardBtn('premarket')}
                              >
                                <Clipboard size={13} /> Paste Clipboard
                              </button>
                              <button
                                type="button"
                                className="btn-dropzone-action"
                                onClick={() => premarketInputRef.current?.click()}
                              >
                                <UploadCloud size={13} /> Pilih File
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    <input 
                      ref={premarketInputRef}
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }}
                      onChange={e => handleFileChange(e, 'premarket')} 
                    />
                  </div>

                  {/* Result Chart Card */}
                  <div 
                    className={`chart-paste-card ${activePasteTarget === 'result' ? 'active-target' : ''}`}
                    onClick={() => setActivePasteTarget('result')}
                    tabIndex={0}
                    onPaste={(e) => handleDropzonePaste(e, 'result')}
                  >
                    <div className="chart-paste-card-header">
                      <div className="chart-paste-card-title">
                        <ImageIcon size={15} style={{ color: 'var(--accent-secondary)' }} />
                        <span>Result Chart (Exit Posisi)</span>
                      </div>
                      <span className={`target-badge ${activePasteTarget === 'result' ? 'active' : 'inactive'}`}>
                        {activePasteTarget === 'result' ? (
                          <>
                            <span className="target-pulse-dot" />
                            Target Ctrl+V
                          </>
                        ) : (
                          'Pilih Target'
                        )}
                      </span>
                    </div>

                    {resultPreview ? (
                      <div className="chart-preview-wrapper">
                        <img src={resultPreview} alt="Result Preview" className="chart-preview-img" />
                        
                        <div className="chart-preview-toolbar">
                          <button
                            type="button"
                            className="chart-preview-btn"
                            title="Perbesar Gambar"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveLightbox({ src: resultPreview, caption: 'Result Chart Exit' });
                            }}
                          >
                            <Maximize2 size={13} /> Perbesar
                          </button>
                          <button
                            type="button"
                            className="chart-preview-btn"
                            title="Ganti Gambar (Ctrl+V atau pilih file)"
                            onClick={(e) => {
                              e.stopPropagation();
                              resultInputRef.current?.click();
                            }}
                          >
                            <RefreshCw size={13} /> Ganti
                          </button>
                          <button
                            type="button"
                            className="chart-preview-btn danger"
                            title="Hapus Gambar"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage('result');
                            }}
                          >
                            <Trash2 size={13} /> Hapus
                          </button>
                        </div>

                        <div className="chart-preview-bottom-bar">
                          <span>✓ Siap disimpan</span>
                          <span>Tekan Ctrl+V untuk ganti</span>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className={`chart-paste-dropzone ${isDragging.result ? 'is-dragging' : ''}`}
                        onDragOver={(e) => handleDragOver(e, 'result')}
                        onDragLeave={(e) => handleDragLeave(e, 'result')}
                        onDrop={(e) => handleDrop(e, 'result')}
                        onClick={() => setActivePasteTarget('result')}
                      >
                        {isProcessingImage.result ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <div className="spinner" style={{ width: '24px', height: '24px' }} />
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Mengompres & memproses gambar...</span>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-secondary)' }}>
                              <Clipboard size={24} />
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>
                              Tekan <kbd className="shortcut-badge">Ctrl</kbd> + <kbd className="shortcut-badge">V</kbd> untuk Paste
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              atau drag & drop screenshot chart ke sini
                            </div>

                            <div className="chart-dropzone-actions" onClick={e => e.stopPropagation()}>
                              <button
                                type="button"
                                className="btn-dropzone-action primary"
                                onClick={() => handlePasteFromClipboardBtn('result')}
                              >
                                <Clipboard size={13} /> Paste Clipboard
                              </button>
                              <button
                                type="button"
                                className="btn-dropzone-action"
                                onClick={() => resultInputRef.current?.click()}
                              >
                                <UploadCloud size={13} /> Pilih File
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    <input 
                      ref={resultInputRef}
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }}
                      onChange={e => handleFileChange(e, 'result')} 
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Catatan Hari Ini (Evaluasi Ringkas)</label>
                <textarea rows="4" placeholder="Tulis catatan, emosi, kendala, atau kepatuhan SOP Anda hari ini..." value={catatanHariIni} onChange={e => setCatatanHariIni(e.target.value)}></textarea>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
            <button type="button" onClick={() => { resetForm(); setActiveSubTab('list'); }} className="btn btn-secondary">Batal</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Menyimpan...' : editingTradeId ? 'Simpan Perubahan' : 'Simpan Jurnal Trade'}
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
            
            <div className="flex-align-center gap-20" style={{ flexWrap: 'wrap' }}>
              <div className="flex-align-center gap-10">
                <Filter size={16} className="text-secondary" />
                <select 
                  value={filterMethod} 
                  onChange={e => setFilterMethod(e.target.value)}
                  style={{ padding: '8px 12px', fontSize: '13px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', width: '160px' }}
                >
                  <option value="">Semua Metode</option>
                  {methods.map(m => (
                    <option key={m.id} value={m.id}>{m.nama}</option>
                  ))}
                </select>
              </div>

              <div className="flex-align-center gap-10">
                <select 
                  value={filterKonfirmasi} 
                  onChange={e => setFilterKonfirmasi(e.target.value)}
                  style={{ padding: '8px 12px', fontSize: '13px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', width: '170px' }}
                >
                  <option value="">Semua Konfirmasi</option>
                  {allKonfirmasiTags.map((tag, i) => (
                    <option key={i} value={tag}>⚡ {tag}</option>
                  ))}
                </select>
              </div>

              <div className="flex-align-center gap-10">
                <select 
                  value={filterResult} 
                  onChange={e => setFilterResult(e.target.value)}
                  style={{ padding: '8px 12px', fontSize: '13px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', width: '140px' }}
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
                          {trade.isAutoSynced && (
                            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', fontWeight: 'bold' }}>
                              MT5
                            </span>
                          )}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: '700', color: '#fff' }}>
                        {trade.pair}
                        {trade.lotSize && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                            {trade.lotSize} Lot {trade.sesi ? `• ${trade.sesi}` : ''}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span className={`badge ${trade.arah === 'BUY' ? 'badge-buy' : 'badge-sell'}`}>
                          {trade.arah}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                        <div>{getMethodName(trade.metodeId)}</div>
                        {trade.konfirmasiEntry && trade.konfirmasiEntry.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                            {trade.konfirmasiEntry.slice(0, 3).map((tag, idx) => (
                              <span key={idx} style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', color: 'var(--color-win)', border: '1px solid rgba(16,185,129,0.2)', fontWeight: '600' }}>
                                {tag}
                              </span>
                            ))}
                            {trade.konfirmasiEntry.length > 3 && (
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>+{trade.konfirmasiEntry.length - 3}</span>
                            )}
                          </div>
                        )}
                      </td>
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
                            title="Lihat Detail"
                          >
                            <Eye size={12} /> Detail
                          </button>
                          <button 
                            onClick={() => handleEditTrade(trade)} 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 10px', fontSize: '12px', color: 'var(--accent)' }}
                            title="Edit Catatan Trade"
                          >
                            <Pencil size={12} /> Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteTrade(trade.id)} 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 10px', fontSize: '12px', color: 'var(--color-lose)' }}
                            title="Hapus"
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

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Dibuat pada tanggal <strong>{selectedTrade.tanggal}</strong> • Metode: <strong>{getMethodName(selectedTrade.metodeId)}</strong>
            </p>

            {/* Konfirmasi Entry Badges in Modal */}
            {selectedTrade.konfirmasiEntry && selectedTrade.konfirmasiEntry.length > 0 && (
              <div style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent)', display: 'block', marginBottom: '8px' }}>
                  ⚡ Konfirmasi Entry & Confluences:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedTrade.konfirmasiEntry.map((tag, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        background: 'rgba(16,185,129,0.12)',
                        border: '1px solid rgba(16,185,129,0.3)',
                        color: 'var(--color-win)'
                      }}
                    >
                      ✓ {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* MT5 Execution Card */}
            {(selectedTrade.isAutoSynced || selectedTrade.mt5Ticket) && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))',
                border: '1px solid rgba(59,130,246,0.25)', borderRadius: '12px',
                padding: '16px', marginBottom: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    ⚡ MT5 Auto-Synced Execution
                  </span>
                  {selectedTrade.mt5Ticket && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      Ticket #{selectedTrade.mt5Ticket}
                    </span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Sesi Trading:</span>
                    <strong style={{ color: '#fff' }}>{selectedTrade.sesi || 'Asia'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Lot / Volume:</span>
                    <strong style={{ color: '#fff' }}>{selectedTrade.lotSize ?? '-'} Lot</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Open Price:</span>
                    <strong style={{ color: '#fff', fontFamily: 'monospace' }}>{selectedTrade.openPrice ?? '-'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Close Price:</span>
                    <strong style={{ color: '#fff', fontFamily: 'monospace' }}>{selectedTrade.closePrice ?? '-'}</strong>
                  </div>
                </div>
              </div>
            )}

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
                      <button 
                        type="button" 
                        className="btn-dropzone-action"
                        style={{ marginTop: '8px', fontSize: '11px', padding: '4px 10px' }}
                        onClick={() => handleEditTrade(selectedTrade)}
                      >
                        <Pencil size={11} /> Edit Trade untuk Tambah
                      </button>
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
                      <button 
                        type="button" 
                        className="btn-dropzone-action"
                        style={{ marginTop: '8px', fontSize: '11px', padding: '4px 10px' }}
                        onClick={() => handleEditTrade(selectedTrade)}
                      >
                        <Pencil size={11} /> Edit Trade untuk Tambah
                      </button>
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

            {/* Seksi Komentar & Catatan Setup */}
            <div className="comments-section">
              <div className="comments-header">
                <div className="comments-title">
                  <MessageSquare size={18} style={{ color: 'var(--accent)' }} />
                  <span>Komentar & Catatan Setup</span>
                  <span className="comments-count-pill">
                    {selectedTrade.komentarSetup ? selectedTrade.komentarSetup.length : 0}
                  </span>
                </div>
              </div>

              {/* Comments List */}
              <div className="comments-list">
                {(!selectedTrade.komentarSetup || selectedTrade.komentarSetup.length === 0) ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    Belum ada komentar setup. Tambahkan komentar atau catatan evaluasi untuk setup ini!
                  </div>
                ) : (
                  selectedTrade.komentarSetup.map((comm) => (
                    <div key={comm.id} className="comment-item">
                      <div className="comment-avatar">
                        <User size={16} />
                      </div>
                      <div className="comment-content">
                        <div className="comment-meta">
                          <span className="comment-author">Trader</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="comment-time">{formatCommentTime(comm.createdAt)}</span>
                            <div className="comment-actions">
                              <button
                                className="comment-action-btn"
                                title="Edit Komentar"
                                onClick={() => {
                                  setEditingCommentId(comm.id);
                                  setEditingCommentText(comm.text);
                                }}
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                className="comment-action-btn delete"
                                title="Hapus Komentar"
                                onClick={() => handleDeleteComment(selectedTrade.id, comm.id)}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {editingCommentId === comm.id ? (
                          <div style={{ marginTop: '6px', display: 'flex', gap: '6px' }}>
                            <input
                              type="text"
                              value={editingCommentText}
                              onChange={e => setEditingCommentText(e.target.value)}
                              style={{ flex: 1, padding: '6px 10px', fontSize: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--accent)', borderRadius: '6px', color: '#fff' }}
                              onKeyDown={e => { if (e.key === 'Enter') handleSaveEditedComment(selectedTrade.id, comm.id); }}
                            />
                            <button
                              onClick={() => handleSaveEditedComment(selectedTrade.id, comm.id)}
                              className="btn btn-primary"
                              style={{ padding: '6px 10px', fontSize: '12px' }}
                            >
                              <Check size={12} /> Simpan
                            </button>
                            <button
                              onClick={() => { setEditingCommentId(null); setEditingCommentText(''); }}
                              className="btn btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '12px' }}
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <p className="comment-text">{comm.text}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Form Add Comment */}
              <div className="comment-form">
                <div className="comment-quick-tags">
                  {['🎯 Target Hit', '⚠️ High Impact News', '📌 Re-entry Plan', '💡 Lesson Learned'].map((tag) => (
                    <span
                      key={tag}
                      className="tag-chip"
                      onClick={() => setNewCommentText(prev => prev ? `${prev} ${tag}` : tag)}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="comment-input-wrapper">
                  <input
                    type="text"
                    placeholder="Tulis komentar/catatan setup baru... (Tekan Enter)"
                    value={newCommentText}
                    onChange={e => setNewCommentText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment(selectedTrade.id, newCommentText);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="comment-send-btn"
                    onClick={() => handleAddComment(selectedTrade.id, newCommentText)}
                  >
                    <Send size={14} />
                    Kirim
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
              <button 
                onClick={() => {
                  handleDeleteTrade(selectedTrade.id);
                }} 
                className="btn btn-danger"
              >
                Hapus Trade Jurnal
              </button>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => handleEditTrade(selectedTrade)} 
                  className="btn btn-primary"
                >
                  <Pencil size={14} /> Edit Trade
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
        </div>
      )}
      
      {toastMessage && (
        <div className="chart-paste-toast animate-slide-up">
          <CheckCircle size={16} style={{ color: 'var(--color-win)' }} />
          <span>{toastMessage}</span>
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
