-- ============================================================
-- JURNAL-N — Supabase Database Migration
-- Jalankan ini di: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 1. Tabel Metode Trading
CREATE TABLE IF NOT EXISTS metode (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nama            TEXT NOT NULL,
  sop_checklist   JSONB NOT NULL DEFAULT '[]',
  key_levels      JSONB NOT NULL DEFAULT '[]',
  triggers        JSONB NOT NULL DEFAULT '[]',
  entry_rules     JSONB NOT NULL DEFAULT '[]',
  no_entry_rules  JSONB NOT NULL DEFAULT '[]',
  sl_plus_rules   JSONB NOT NULL DEFAULT '[]',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabel Jurnal Trade
CREATE TABLE IF NOT EXISTS jurnal (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tanggal               DATE NOT NULL,
  pair                  TEXT NOT NULL,
  arah                  TEXT NOT NULL CHECK (arah IN ('BUY','SELL')),
  jenis_trade           TEXT NOT NULL CHECK (jenis_trade IN ('continuation','reversal','ranging')),
  metode_id             UUID REFERENCES metode(id) ON DELETE SET NULL,
  checklist_terpenuhi   JSONB NOT NULL DEFAULT '[]',
  key_level_digunakan   TEXT,
  trigger_entry         TEXT,
  risk_reward_ratio     NUMERIC(6,2),
  hasil_trade           TEXT NOT NULL CHECK (hasil_trade IN ('win','lose','break_even','partial_tp','sl+')),
  profit_nominal        NUMERIC(12,2),
  rr_diperoleh          NUMERIC(6,2),
  psikologi_sebelum     TEXT,
  psikologi_saat_open   TEXT,
  psikologi_setelah     TEXT,
  faktor_kesalahan      JSONB NOT NULL DEFAULT '[]',
  catatan_hari_ini      TEXT,
  foto_premarket_url    TEXT,
  foto_result_url       TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Row Level Security — setiap user hanya lihat data miliknya
ALTER TABLE metode ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurnal  ENABLE ROW LEVEL SECURITY;

-- Policy metode
CREATE POLICY "metode_user_policy" ON metode
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy jurnal
CREATE POLICY "jurnal_user_policy" ON jurnal
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Index untuk performa query per user
CREATE INDEX IF NOT EXISTS idx_metode_user  ON metode (user_id);
CREATE INDEX IF NOT EXISTS idx_jurnal_user  ON jurnal  (user_id);
CREATE INDEX IF NOT EXISTS idx_jurnal_tgl   ON jurnal  (user_id, tanggal DESC);

-- 5. Storage bucket untuk foto chart
-- Jalankan ini TERPISAH setelah tabel dibuat:
-- Supabase Dashboard → Storage → New Bucket
--   Name    : charts
--   Public  : true (centang "Public bucket")
-- ATAU dengan SQL (perlu extension pg_storage):
INSERT INTO storage.buckets (id, name, public)
VALUES ('charts', 'charts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: user upload ke folder sendiri, publik baca
CREATE POLICY "charts_upload_policy" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'charts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "charts_update_policy" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'charts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "charts_delete_policy" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'charts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "charts_read_policy" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'charts');
