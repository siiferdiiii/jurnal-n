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
  jenis_trade           TEXT CHECK (jenis_trade IN ('continuation','reversal','ranging')),
  metode_id             UUID REFERENCES metode(id) ON DELETE SET NULL,
  checklist_terpenuhi   JSONB NOT NULL DEFAULT '[]',
  key_level_digunakan   TEXT,
  trigger_entry         TEXT,
  risk_reward_ratio     NUMERIC(6,2),
  hasil_trade           TEXT CHECK (hasil_trade IN ('win','lose','break_even','partial_tp','sl+')),
  profit_nominal        NUMERIC(12,2),
  rr_diperoleh          NUMERIC(6,2),
  psikologi_sebelum     TEXT,
  psikologi_saat_open   TEXT,
  psikologi_setelah     TEXT,
  faktor_kesalahan      JSONB NOT NULL DEFAULT '[]',
  catatan_hari_ini      TEXT,
  foto_premarket_url    TEXT,
  foto_result_url       TEXT,
  komentar_setup        JSONB NOT NULL DEFAULT '[]',

  -- MT5 Auto-Sync Fields:
  mt5_ticket            TEXT,
  lot_size              NUMERIC(8,2),
  open_price            NUMERIC(12,5),
  close_price           NUMERIC(12,5),
  sl_price              NUMERIC(12,5),
  tp_price              NUMERIC(12,5),
  open_time             TIMESTAMPTZ,
  close_time            TIMESTAMPTZ,
  sesi                  TEXT,
  is_auto_synced        BOOLEAN NOT NULL DEFAULT false,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alter Table statement untuk tabel yang sudah ada
ALTER TABLE jurnal ALTER COLUMN jenis_trade DROP NOT NULL;
ALTER TABLE jurnal ALTER COLUMN hasil_trade DROP NOT NULL;
ALTER TABLE jurnal ADD COLUMN IF NOT EXISTS mt5_ticket TEXT;
ALTER TABLE jurnal ADD COLUMN IF NOT EXISTS lot_size NUMERIC(8,2);
ALTER TABLE jurnal ADD COLUMN IF NOT EXISTS open_price NUMERIC(12,5);
ALTER TABLE jurnal ADD COLUMN IF NOT EXISTS close_price NUMERIC(12,5);
ALTER TABLE jurnal ADD COLUMN IF NOT EXISTS sl_price NUMERIC(12,5);
ALTER TABLE jurnal ADD COLUMN IF NOT EXISTS tp_price NUMERIC(12,5);
ALTER TABLE jurnal ADD COLUMN IF NOT EXISTS open_time TIMESTAMPTZ;
ALTER TABLE jurnal ADD COLUMN IF NOT EXISTS close_time TIMESTAMPTZ;
ALTER TABLE jurnal ADD COLUMN IF NOT EXISTS sesi TEXT;
ALTER TABLE jurnal ADD COLUMN IF NOT EXISTS is_auto_synced BOOLEAN DEFAULT false;
ALTER TABLE jurnal ADD COLUMN IF NOT EXISTS komentar_setup JSONB DEFAULT '[]';

-- 3. Row Level Security — setiap user hanya lihat data miliknya
ALTER TABLE metode ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurnal  ENABLE ROW LEVEL SECURITY;

-- Policy metode
DROP POLICY IF EXISTS "metode_user_policy" ON metode;
CREATE POLICY "metode_user_policy" ON metode
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy jurnal
DROP POLICY IF EXISTS "jurnal_user_policy" ON jurnal;
CREATE POLICY "jurnal_user_policy" ON jurnal
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Index untuk performa query per user
CREATE INDEX IF NOT EXISTS idx_metode_user  ON metode (user_id);
CREATE INDEX IF NOT EXISTS idx_jurnal_user  ON jurnal  (user_id);
CREATE INDEX IF NOT EXISTS idx_jurnal_tgl   ON jurnal  (user_id, tanggal DESC);

-- 5. Storage bucket untuk foto chart
INSERT INTO storage.buckets (id, name, public)
VALUES ('charts', 'charts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: user upload ke folder sendiri, publik baca
DROP POLICY IF EXISTS "charts_upload_policy" ON storage.objects;
CREATE POLICY "charts_upload_policy" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'charts' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "charts_update_policy" ON storage.objects;
CREATE POLICY "charts_update_policy" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'charts' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "charts_delete_policy" ON storage.objects;
CREATE POLICY "charts_delete_policy" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'charts' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "charts_read_policy" ON storage.objects;
CREATE POLICY "charts_read_policy" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'charts');

-- ============================================================
-- TOP TRADERS — Jalankan bagian ini di Supabase SQL Editor
-- ============================================================

-- 6. Tabel Profiles (profil publik trader)
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Trader',
  bio          TEXT,
  is_public    BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_read"  ON profiles;
DROP POLICY IF EXISTS "profiles_write" ON profiles;

-- Siapapun bisa baca profil publik; user bisa baca miliknya sendiri
CREATE POLICY "profiles_read" ON profiles
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

-- Hanya pemilik yang bisa tulis
CREATE POLICY "profiles_write" ON profiles
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_user   ON profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_public ON profiles (is_public) WHERE is_public = true;

-- 7. Tabel Trader Comments (komentar di profil trader)
CREATE TABLE IF NOT EXISTS trader_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trader_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  author_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  author_name TEXT NOT NULL,
  text        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE trader_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_read"   ON trader_comments;
DROP POLICY IF EXISTS "comments_insert" ON trader_comments;
DROP POLICY IF EXISTS "comments_delete" ON trader_comments;

-- Pengguna login bisa baca semua komentar
CREATE POLICY "comments_read" ON trader_comments
  FOR SELECT TO authenticated USING (true);

-- Hanya bisa insert sebagai diri sendiri
CREATE POLICY "comments_insert" ON trader_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

-- Hanya bisa hapus komentar sendiri
CREATE POLICY "comments_delete" ON trader_comments
  FOR DELETE TO authenticated USING (auth.uid() = author_id);

CREATE INDEX IF NOT EXISTS idx_comments_trader ON trader_comments (trader_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_author ON trader_comments (author_id);

-- 8. Update RLS jurnal — izinkan baca jurnal trader publik
-- Hapus policy ALL lama, pisah menjadi SELECT dan write terpisah
DROP POLICY IF EXISTS "jurnal_user_policy"      ON jurnal;
DROP POLICY IF EXISTS "jurnal_public_read"      ON jurnal;
DROP POLICY IF EXISTS "jurnal_user_write"       ON jurnal;

-- SELECT: user bisa baca milik sendiri ATAU milik trader yang profilnya publik
CREATE POLICY "jurnal_public_read" ON jurnal
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = jurnal.user_id AND p.is_public = true
    )
  );

-- INSERT / UPDATE / DELETE: hanya pemilik
CREATE POLICY "jurnal_user_write" ON jurnal
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
  