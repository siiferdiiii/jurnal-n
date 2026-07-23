import { supabase } from './supabase';

/* ─────────────────────────────────────────────────────────────
   IMAGE HELPERS — base64 → Supabase Storage
───────────────────────────────────────────────────────────── */

function base64ToBlob(base64) {
  const [meta, data] = base64.split(',');
  const mime = meta.match(/:(.*?);/)[1];
  const bytes = atob(data);
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i);
  return new Blob([buffer], { type: mime });
}

/**
 * Upload a base64 image to Supabase Storage.
 * If the value is already a URL (not base64), it is returned as-is.
 */
async function uploadImage(base64OrUrl, userId, recordId, type) {
  if (!base64OrUrl) return null;
  if (!base64OrUrl.startsWith('data:')) return base64OrUrl; // already a URL

  const blob = base64ToBlob(base64OrUrl);
  const path = `${userId}/${recordId}/${type}_${Date.now()}.jpg`;

  const { error } = await supabase.storage
    .from('charts')
    .upload(path, blob, { contentType: 'image/jpeg', upsert: true });

  if (error) {
    console.error('Image upload error:', error);
    return null; // degrade gracefully — don't block the save
  }

  const { data } = supabase.storage.from('charts').getPublicUrl(path);
  return data.publicUrl;
}

/* ─────────────────────────────────────────────────────────────
   TRADING SESSION CALCULATOR
───────────────────────────────────────────────────────────── */

export function calculateTradingSession(timeInput) {
  if (!timeInput) return 'Unknown';
  const date = new Date(timeInput);
  const hour = date.getUTCHours();

  if (hour >= 13 && hour < 16) {
    return 'London - NY Overlap';
  } else if (hour >= 8 && hour < 16) {
    return 'London';
  } else if (hour >= 13 && hour < 21) {
    return 'New York';
  } else {
    return 'Asia';
  }
}

/* ─────────────────────────────────────────────────────────────
   SCHEMA MAPPERS — camelCase (React) ↔ snake_case (Supabase)
───────────────────────────────────────────────────────────── */

function jurnalToDb(j, userId, premUrl, resUrl) {
  return {
    user_id:              userId,
    tanggal:              j.tanggal,
    pair:                 j.pair,
    arah:                 j.arah,
    jenis_trade:          j.jenisTrade || null,
    metode_id:            j.metodeId || null,
    checklist_terpenuhi:  j.checklistTerpenuhi  ?? [],
    key_level_digunakan:  j.keyLevelDigunakan   ?? null,
    trigger_entry:        j.triggerEntry         ?? null,
    risk_reward_ratio:    j.riskRewardRatio      ?? null,
    hasil_trade:          j.hasilTrade          || null,
    profit_nominal:       j.profitNominal        ?? null,
    rr_diperoleh:         j.rrDiperoleh          ?? null,
    psikologi_sebelum:    j.psikologiSebelum     ?? null,
    psikologi_saat_open:  j.psikologiSaatOpen    ?? null,
    psikologi_setelah:    j.psikologiSetelah     ?? null,
    faktor_kesalahan:     j.faktorKesalahan      ?? [],
    catatan_hari_ini:     j.catatanHariIni       ?? null,
    foto_premarket_url:   premUrl,
    foto_result_url:      resUrl,
    // MT5 Auto-Sync Fields
    mt5_ticket:           j.mt5Ticket           ?? null,
    lot_size:             j.lotSize              ?? null,
    open_price:           j.openPrice            ?? null,
    close_price:          j.closePrice           ?? null,
    sl_price:             j.slPrice              ?? null,
    tp_price:             j.tpPrice              ?? null,
    open_time:            j.openTime             ?? null,
    close_time:           j.closeTime            ?? null,
    sesi:                 j.sesi || (j.openTime ? calculateTradingSession(j.openTime) : null),
    is_auto_synced:       j.isAutoSynced         ?? false,
  };
}

function jurnalFromDb(row) {
  return {
    id:                   row.id,
    tanggal:              row.tanggal,
    pair:                 row.pair,
    arah:                 row.arah,
    jenisTrade:           row.jenis_trade,
    metodeId:             row.metode_id,
    checklistTerpenuhi:   row.checklist_terpenuhi  ?? [],
    keyLevelDigunakan:    row.key_level_digunakan,
    triggerEntry:         row.trigger_entry,
    riskRewardRatio:      row.risk_reward_ratio,
    hasilTrade:           row.hasil_trade,
    profitNominal:        row.profit_nominal    != null ? Number(row.profit_nominal)   : null,
    rrDiperoleh:          row.rr_diperoleh      != null ? Number(row.rr_diperoleh)     : null,
    psikologiSebelum:     row.psikologi_sebelum,
    psikologiSaatOpen:    row.psikologi_saat_open,
    psikologiSetelah:     row.psikologi_setelah,
    faktorKesalahan:      row.faktor_kesalahan  ?? [],
    catatanHariIni:       row.catatan_hari_ini,
    fotoPremarket:        row.foto_premarket_url,
    fotoResult:           row.foto_result_url,
    // MT5 Auto-Sync Fields
    mt5Ticket:            row.mt5_ticket,
    lotSize:              row.lot_size          != null ? Number(row.lot_size)         : null,
    openPrice:            row.open_price        != null ? Number(row.open_price)       : null,
    closePrice:           row.close_price       != null ? Number(row.close_price)      : null,
    slPrice:              row.sl_price          != null ? Number(row.sl_price)         : null,
    tpPrice:              row.tp_price          != null ? Number(row.tp_price)         : null,
    openTime:             row.open_time,
    closeTime:            row.close_time,
    sesi:                 row.sesi || (row.open_time ? calculateTradingSession(row.open_time) : null),
    isAutoSynced:         Boolean(row.is_auto_synced),
    createdAt:            new Date(row.created_at).getTime(),
  };
}

function metodeToDb(m, userId) {
  return {
    user_id:        userId,
    nama:           m.nama,
    sop_checklist:  m.sopChecklist  ?? [],
    key_levels:     m.keyLevels     ?? [],
    triggers:       m.triggers      ?? [],
    entry_rules:    m.entryRules    ?? [],
    no_entry_rules: m.noEntryRules  ?? [],
    sl_plus_rules:  m.slPlusRules   ?? [],
  };
}

function metodeFromDb(row) {
  return {
    id:           row.id,
    nama:         row.nama,
    sopChecklist: row.sop_checklist  ?? [],
    keyLevels:    row.key_levels     ?? [],
    triggers:     row.triggers       ?? [],
    entryRules:   row.entry_rules    ?? [],
    noEntryRules: row.no_entry_rules ?? [],
    slPlusRules:  row.sl_plus_rules  ?? [],
    createdAt:    new Date(row.created_at).getTime(),
  };
}

/* ─────────────────────────────────────────────────────────────
   JURNAL API
───────────────────────────────────────────────────────────── */

export async function getJurnal() {
  const { data, error } = await supabase
    .from('jurnal')
    .select('*')
    .order('tanggal', { ascending: false });
  if (error) throw error;
  return data.map(jurnalFromDb);
}

/**
 * Upsert a journal entry.
 * Handles image upload automatically — pass raw base64 or existing URL.
 */
export async function saveJurnal(journal, userId) {
  // If it's a new record, create a temporary ID for the storage path
  const recordId = journal.id || crypto.randomUUID();

  // Upload images (no-op if already a URL or null)
  const [premUrl, resUrl] = await Promise.all([
    uploadImage(journal.fotoPremarket, userId, recordId, 'premarket'),
    uploadImage(journal.fotoResult,    userId, recordId, 'result'),
  ]);

  const row = jurnalToDb(journal, userId, premUrl, resUrl);

  if (journal.id) {
    // UPDATE existing record
    const { data, error } = await supabase
      .from('jurnal')
      .update(row)
      .eq('id', journal.id)
      .select()
      .single();
    if (error) throw error;
    return jurnalFromDb(data);
  } else {
    // INSERT new record
    const { data, error } = await supabase
      .from('jurnal')
      .insert({ id: recordId, ...row })
      .select()
      .single();
    if (error) throw error;
    return jurnalFromDb(data);
  }
}

export async function deleteJurnal(id) {
  const { error } = await supabase.from('jurnal').delete().eq('id', id);
  if (error) throw error;
}

/* ─────────────────────────────────────────────────────────────
   METODE API
───────────────────────────────────────────────────────────── */

export async function getMetode() {
  const { data, error } = await supabase
    .from('metode')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data.map(metodeFromDb);
}

export async function saveMetode(metode, userId) {
  const row = metodeToDb(metode, userId);

  if (metode.id) {
    const { data, error } = await supabase
      .from('metode')
      .update(row)
      .eq('id', metode.id)
      .select()
      .single();
    if (error) throw error;
    return metodeFromDb(data);
  } else {
    const { data, error } = await supabase
      .from('metode')
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return metodeFromDb(data);
  }
}

export async function deleteMetode(id) {
  const { error } = await supabase.from('metode').delete().eq('id', id);
  if (error) throw error;
}
