import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckSquare, 
  Sliders, 
  Zap, 
  BarChart3,
  AlertTriangle,
  Clock,
  ShieldOff,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getMetode, saveMetode, deleteMetode, getJurnal } from '../lib/api';

// Reusable chip-input row component
function ChipInput({ value, onChange, onAdd, onRemove, list, placeholder, color }) {
  return (
    <div>
      <div className="flex-align-center gap-10">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), onAdd())}
          style={{ flex: 1 }}
        />
        <button type="button" onClick={onAdd} className="btn btn-secondary" style={{ padding: '12px', flexShrink: 0 }}>
          <Plus size={15} />
        </button>
      </div>
      {list.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
          {list.map((item, idx) => (
            <span
              key={idx}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '12px', fontWeight: '500',
                padding: '4px 10px', borderRadius: '999px',
                background: color.bg, border: `1px solid ${color.border}`, color: color.text,
                textTransform: 'none'
              }}
            >
              {item}
              <Trash2 size={10} style={{ cursor: 'pointer', opacity: 0.7 }} onClick={() => onRemove(idx)} />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Reusable ordered list with delete
function OrderedList({ list, onRemove, color }) {
  if (list.length === 0) return (
    <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>Belum ada item ditambahkan.</p>
  );
  return (
    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {list.map((item, idx) => (
        <li
          key={idx}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: '10px', justifyContent: 'space-between',
            background: color.bg, border: `1px solid ${color.border}`, padding: '9px 14px',
            borderRadius: 'var(--radius-sm)', fontSize: '13px'
          }}
        >
          <span style={{ color, display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <span style={{ color: color.text, fontWeight: 'bold', flexShrink: 0 }}>{idx + 1}.</span>
            <span style={{ color: 'var(--text-primary)' }}>{item}</span>
          </span>
          <button type="button" onClick={() => onRemove(idx)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0 }}>
            <Trash2 size={13} />
          </button>
        </li>
      ))}
    </ul>
  );
}

// Rule section heading
function RuleSection({ icon, title, color, children }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.015)', border: `1px solid ${color.border}`, borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: color.text }}>{icon}</span>
        <h4 style={{ fontSize: '13px', fontWeight: '700', color: color.text, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h4>
      </div>
      {children}
    </div>
  );
}

export default function Methods({ dbTrigger, onDataChange, userId }) {
  const [methods, setMethods] = useState([]);
  const [trades, setTrades] = useState([]);
  const [expandedCard, setExpandedCard] = useState(null);
  
  // Form State — basic info
  const [name, setName] = useState('');
  const [sopInput, setSopInput] = useState('');
  const [sopList, setSopList] = useState([]);
  const [keyLevelInput, setKeyLevelInput] = useState('');
  const [keyLevelsList, setKeyLevelsList] = useState([]);
  const [triggerInput, setTriggerInput] = useState('');
  const [triggersList, setTriggersList] = useState([]);

  // Form State — rules
  const [entryRuleInput, setEntryRuleInput] = useState('');
  const [entryRulesList, setEntryRulesList] = useState([]);
  const [noEntryRuleInput, setNoEntryRuleInput] = useState('');
  const [noEntryRulesList, setNoEntryRulesList] = useState([]);
  const [slPlusRuleInput, setSlPlusRuleInput] = useState('');
  const [slPlusRulesList, setSlPlusRulesList] = useState([]);

  const [errorMsg, setErrorMsg] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    Promise.all([getMetode(), getJurnal()]).then(([metodeData, jurnalData]) => {
      setMethods(metodeData);
      setTrades(jurnalData);
    });
  }, [dbTrigger]);

  // Generic add/remove helpers
  const makeAdder = (list, setList, input, setInput) => () => {
    if (input.trim()) { setList([...list, input.trim()]); setInput(''); }
  };
  const makeRemover = (list, setList) => (idx) => setList(list.filter((_, i) => i !== idx));

  const addSopItem      = makeAdder(sopList, setSopList, sopInput, setSopInput);
  const removeSopItem   = makeRemover(sopList, setSopList);
  const addKeyLevel     = makeAdder(keyLevelsList, setKeyLevelsList, keyLevelInput, setKeyLevelInput);
  const removeKeyLevel  = makeRemover(keyLevelsList, setKeyLevelsList);
  const addTrigger      = makeAdder(triggersList, setTriggersList, triggerInput, setTriggerInput);
  const removeTrigger   = makeRemover(triggersList, setTriggersList);
  const addEntryRule    = makeAdder(entryRulesList, setEntryRulesList, entryRuleInput, setEntryRuleInput);
  const removeEntryRule = makeRemover(entryRulesList, setEntryRulesList);
  const addNoEntryRule  = makeAdder(noEntryRulesList, setNoEntryRulesList, noEntryRuleInput, setNoEntryRuleInput);
  const removeNoEntry   = makeRemover(noEntryRulesList, setNoEntryRulesList);
  const addSlPlusRule   = makeAdder(slPlusRulesList, setSlPlusRulesList, slPlusRuleInput, setSlPlusRuleInput);
  const removeSlPlus    = makeRemover(slPlusRulesList, setSlPlusRulesList);

  const handleSaveMethod = (e) => {
    e.preventDefault();
    if (!name.trim())    { setErrorMsg('Nama metode harus diisi!'); return; }
    if (!sopList.length) { setErrorMsg('Minimal harus ada 1 SOP Checklist!'); return; }

    const newMethod = {
      nama: name.trim(),
      sopChecklist: sopList,
      keyLevels: keyLevelsList,
      triggers: triggersList,
      entryRules: entryRulesList,
      noEntryRules: noEntryRulesList,
      slPlusRules: slPlusRulesList,
    };

    saveMetode(newMethod, userId).then(() => {
      onDataChange();
      setName(''); setSopList([]); setKeyLevelsList([]); setTriggersList([]);
      setEntryRulesList([]); setNoEntryRulesList([]); setSlPlusRulesList([]);
      setErrorMsg(''); setShowAddForm(false);
    }).catch(err => {
      console.error('Gagal menyimpan metode:', err);
      setErrorMsg('Gagal menyimpan. Coba lagi.');
    });
  };

  const handleDeleteMethod = (id) => {
    const isUsed = trades.some(t => t.metodeId === id);
    if (isUsed) {
      alert('Metode ini tidak dapat dihapus karena sedang digunakan dalam beberapa catatan trade jurnal Anda.');
      return;
    }
    if (confirm('Apakah Anda yakin ingin menghapus metode ini?')) {
      deleteMetode(id).then(() => onDataChange()).catch(err => {
        console.error('Gagal menghapus metode:', err);
        alert('Gagal menghapus metode. Coba lagi.');
      });
    }
  };

  const getMethodStats = (metodeId) => {
    const methodTrades = trades.filter(t => t.metodeId === metodeId);
    const total = methodTrades.length;
    const wins = methodTrades.filter(t => ['win', 'partial_tp', 'sl+'].includes(t.hasilTrade)).length;
    const wr = total > 0 ? ((wins / total) * 100).toFixed(1) : 0;
    const totalRR = methodTrades.reduce((acc, cur) => acc + (cur.rrDiperoleh || 0), 0);
    const avgRR = total > 0 ? (totalRR / total).toFixed(2) : 0;
    return { total, wr, avgRR, cumulativeRR: totalRR.toFixed(2) };
  };

  // Colors per rule category
  const COLOR_ENTRY    = { bg: 'rgba(16,185,129,0.05)',  border: 'rgba(16,185,129,0.2)',  text: 'var(--color-win)' };
  const COLOR_NENTRY   = { bg: 'rgba(244,63,94,0.05)',   border: 'rgba(244,63,94,0.2)',   text: 'var(--color-lose)' };
  const COLOR_SLPLUS   = { bg: 'rgba(6,182,212,0.05)',   border: 'rgba(6,182,212,0.2)',   text: 'var(--color-partial)' };
  const COLOR_CHIPS_KL = { bg: 'rgba(99,102,241,0.1)',   border: 'rgba(99,102,241,0.2)',  text: 'var(--color-be)' };
  const COLOR_CHIPS_TR = { bg: 'rgba(16,185,129,0.1)',   border: 'rgba(16,185,129,0.2)',  text: 'var(--color-win)' };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>Manajemen Metode & SOP</h1>
          <p>Kelola SOP, key levels, trigger entry, dan <strong>aturan trading</strong> untuk setiap strategi Anda.</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-primary">
          <Plus size={16} />
          {showAddForm ? 'Tutup Form' : 'Tambah Metode Baru'}
        </button>
      </div>

      {/* ── ADD FORM ── */}
      {showAddForm && (
        <form onSubmit={handleSaveMethod} className="glass-card mb-30" style={{ maxWidth: '900px', margin: '0 auto 30px auto' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
            Setup Strategi & SOP Baru
          </h2>

          {errorMsg && (
            <div style={{ color: 'var(--color-lose)', background: 'var(--color-lose-bg)', border: '1px solid var(--color-lose-border)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} /> {errorMsg}
            </div>
          )}

          {/* Nama */}
          <div className="form-group">
            <label htmlFor="method-name">Nama Metode / Strategi *</label>
            <input id="method-name" type="text" placeholder="Contoh: SMC Continuation, SnR Breakout, Fibo Retracement" value={name} onChange={e => setName(e.target.value)} />
          </div>

          {/* Key Levels & Triggers */}
          <div className="form-grid-2 mb-20">
            <div className="form-group">
              <label>Daftar Key Level (Pilihan)</label>
              <ChipInput value={keyLevelInput} onChange={setKeyLevelInput} onAdd={addKeyLevel} onRemove={removeKeyLevel} list={keyLevelsList} placeholder="Contoh: Fibonacci 0.618, Daily FVG, OB" color={COLOR_CHIPS_KL} />
            </div>
            <div className="form-group">
              <label>Daftar Entry Trigger (Pilihan)</label>
              <ChipInput value={triggerInput} onChange={setTriggerInput} onAdd={addTrigger} onRemove={removeTrigger} list={triggersList} placeholder="Contoh: iFVG, MSS, CISD, Choch" color={COLOR_CHIPS_TR} />
            </div>
          </div>

          {/* SOP Checklist */}
          <div className="form-group mb-20">
            <label>SOP Checklist Wajib Sebelum Trade *</label>
            <div className="flex-align-center gap-10">
              <input type="text" placeholder="Contoh: Cek kalender berita, Bias HTF searah, MSS terbentuk..." value={sopInput} onChange={e => setSopInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSopItem())} />
              <button type="button" onClick={addSopItem} className="btn btn-secondary" style={{ padding: '12px', flexShrink: 0 }}>
                <Plus size={16} />
              </button>
            </div>
            <div style={{ marginTop: '10px' }}>
              <OrderedList list={sopList} onRemove={removeSopItem} color={COLOR_ENTRY} />
            </div>
          </div>

          {/* ── RULES SECTION ── */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
              📋 Aturan Trading (Rules)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Entry Rules */}
              <RuleSection icon={<Clock size={15} />} title="Rules Wajib Entry (Sesi, Jam & Kondisi)" color={COLOR_ENTRY}>
                <ChipInput
                  value={entryRuleInput} onChange={setEntryRuleInput}
                  onAdd={addEntryRule} onRemove={removeEntryRule}
                  list={[]} placeholder='Contoh: "Entry HANYA sesi London 08:00–12:00 WIB"'
                  color={COLOR_ENTRY}
                />
                <OrderedList list={entryRulesList} onRemove={removeEntryRule} color={COLOR_ENTRY} />
              </RuleSection>

              {/* No-Entry Rules */}
              <RuleSection icon={<ShieldOff size={15} />} title="Larangan Entry (Jangan entry kalau...)" color={COLOR_NENTRY}>
                <ChipInput
                  value={noEntryRuleInput} onChange={setNoEntryRuleInput}
                  onAdd={addNoEntryRule} onRemove={removeNoEntry}
                  list={[]} placeholder='Contoh: "Jangan entry 15 menit sebelum berita red folder"'
                  color={COLOR_NENTRY}
                />
                <OrderedList list={noEntryRulesList} onRemove={removeNoEntry} color={COLOR_NENTRY} />
              </RuleSection>

              {/* SL+ Rules */}
              <RuleSection icon={<ShieldCheck size={15} />} title="Aturan SL+ / Trailing (Pasang SL+ kalau...)" color={COLOR_SLPLUS}>
                <ChipInput
                  value={slPlusRuleInput} onChange={setSlPlusRuleInput}
                  onAdd={addSlPlusRule} onRemove={removeSlPlus}
                  list={[]} placeholder='Contoh: "Geser SL ke BE ketika harga +1R dari entry"'
                  color={COLOR_SLPLUS}
                />
                <OrderedList list={slPlusRulesList} onRemove={removeSlPlus} color={COLOR_SLPLUS} />
              </RuleSection>

            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary">Batal</button>
            <button type="submit" className="btn btn-primary">Simpan Metode</button>
          </div>
        </form>
      )}

      {/* ── METHOD CARDS ── */}
      <div className="methods-grid">
        {methods.length === 0 ? (
          <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
            <p>Belum ada metode trading yang dibuat. Silakan tambahkan metode baru di atas.</p>
          </div>
        ) : (
          methods.map(method => {
            const stats = getMethodStats(method.id);
            const isExpanded = expandedCard === method.id;
            const hasRules = (method.entryRules?.length || method.noEntryRules?.length || method.slPlusRules?.length);

            return (
              <div key={method.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Card Header */}
                <div className="flex-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', margin: 0 }}>{method.nama}</h3>
                  <button onClick={() => handleDeleteMethod(method.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* SOP */}
                <div>
                  <h4 className="flex-align-center gap-10" style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    <CheckSquare size={12} style={{ color: 'var(--accent)' }} /> SOP Checklist
                  </h4>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '4px' }}>
                    {method.sopChecklist.map((sop, idx) => (
                      <li key={idx} style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'flex', gap: '6px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>•</span> {sop}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Key Levels & Triggers */}
                <div className="form-grid-2">
                  <div>
                    <h4 className="flex-align-center gap-10" style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      <Sliders size={12} style={{ color: 'var(--accent-secondary)' }} /> Key Levels
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {method.keyLevels?.length > 0
                        ? method.keyLevels.map((k, i) => (
                          <span key={i} style={{ fontSize: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-secondary)' }}>{k}</span>
                        ))
                        : <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tidak ada</span>
                      }
                    </div>
                  </div>
                  <div>
                    <h4 className="flex-align-center gap-10" style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      <Zap size={12} style={{ color: 'var(--color-win)' }} /> Entry Triggers
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {method.triggers?.length > 0
                        ? method.triggers.map((t, i) => (
                          <span key={i} style={{ fontSize: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-secondary)' }}>{t}</span>
                        ))
                        : <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tidak ada</span>
                      }
                    </div>
                  </div>
                </div>

                {/* ── RULES (expandable) ── */}
                {hasRules > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setExpandedCard(isExpanded ? null : method.id)}
                      style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                    >
                      <span>📋 Lihat Rules Trading ({(method.entryRules?.length || 0) + (method.noEntryRules?.length || 0) + (method.slPlusRules?.length || 0)} aturan)</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {isExpanded && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>

                        {/* Entry Rules */}
                        {method.entryRules?.length > 0 && (
                          <div style={{ background: COLOR_ENTRY.bg, border: `1px solid ${COLOR_ENTRY.border}`, borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                            <div className="flex-align-center gap-10" style={{ marginBottom: '8px' }}>
                              <Clock size={13} style={{ color: COLOR_ENTRY.text }} />
                              <span style={{ fontSize: '11px', fontWeight: '700', color: COLOR_ENTRY.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rules Wajib Entry</span>
                            </div>
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {method.entryRules.map((r, i) => (
                                <li key={i} style={{ fontSize: '12px', color: 'var(--text-primary)', display: 'flex', gap: '6px' }}>
                                  <span style={{ color: COLOR_ENTRY.text, fontWeight: 'bold', flexShrink: 0 }}>✓</span> {r}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* No-Entry Rules */}
                        {method.noEntryRules?.length > 0 && (
                          <div style={{ background: COLOR_NENTRY.bg, border: `1px solid ${COLOR_NENTRY.border}`, borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                            <div className="flex-align-center gap-10" style={{ marginBottom: '8px' }}>
                              <ShieldOff size={13} style={{ color: COLOR_NENTRY.text }} />
                              <span style={{ fontSize: '11px', fontWeight: '700', color: COLOR_NENTRY.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Larangan Entry</span>
                            </div>
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {method.noEntryRules.map((r, i) => (
                                <li key={i} style={{ fontSize: '12px', color: 'var(--text-primary)', display: 'flex', gap: '6px' }}>
                                  <span style={{ color: COLOR_NENTRY.text, fontWeight: 'bold', flexShrink: 0 }}>✕</span> {r}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* SL+ Rules */}
                        {method.slPlusRules?.length > 0 && (
                          <div style={{ background: COLOR_SLPLUS.bg, border: `1px solid ${COLOR_SLPLUS.border}`, borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                            <div className="flex-align-center gap-10" style={{ marginBottom: '8px' }}>
                              <ShieldCheck size={13} style={{ color: COLOR_SLPLUS.text }} />
                              <span style={{ fontSize: '11px', fontWeight: '700', color: COLOR_SLPLUS.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Aturan SL+ / Trailing</span>
                            </div>
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {method.slPlusRules.map((r, i) => (
                                <li key={i} style={{ fontSize: '12px', color: 'var(--text-primary)', display: 'flex', gap: '6px' }}>
                                  <span style={{ color: COLOR_SLPLUS.text, fontWeight: 'bold', flexShrink: 0 }}>⚡</span> {r}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                )}

                {/* Stats Footer */}
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.04)', padding: '12px 16px', marginTop: 'auto' }}>
                  <h4 className="flex-align-center gap-10" style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                    <BarChart3 size={12} /> Statistik Performa
                  </h4>
                  <div className="stats-grid-4">
                    {[
                      { label: 'Trades', value: stats.total, color: '#fff' },
                      { label: 'Win Rate', value: `${stats.wr}%`, color: 'var(--color-win)' },
                      { label: 'Avg R:R', value: stats.avgRR, color: 'var(--accent-secondary)' },
                      { label: 'Total R', value: stats.cumulativeRR >= 0 ? `+${stats.cumulativeRR}` : stats.cumulativeRR, color: stats.cumulativeRR >= 0 ? 'var(--color-win)' : 'var(--color-lose)' }
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{label}</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color, marginTop: '2px' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
