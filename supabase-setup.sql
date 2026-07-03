-- ═══════════════════════════════════════════════════════════════
-- JOMAXPATH — SUPABASE SETUP v2 (MIGRACIÓ SEGURA)
-- [AUDIT 2026-06-12] RLS policies endureces: INSERT/UPDATE oberts restringits
-- a auth.uid() IS NOT NULL o auth.uid() = id per evitar escriptura anònima.
-- Executa al SQL Editor: https://supabase.com/dashboard → SQL Editor
-- Si et dona error "already exists", simplement ignora'l i continua
-- ═══════════════════════════════════════════════════════════════

-- ── Extensió UUID ──
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ══════════════════════════
-- 1. PROFILES
-- ══════════════════════════
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  username TEXT,
  avatar TEXT DEFAULT '⚔️',
  hero_xp INTEGER DEFAULT 0,
  hero_level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Afegir columnes que potser falten (segur si ja existeix la taula)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT '⚔️';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hero_xp INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hero_level INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Índex per username (cerca ràpida)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_idx ON profiles (lower(username)) WHERE username IS NOT NULL;

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "perfils_select" ON profiles;
DROP POLICY IF EXISTS "Public read profiles" ON profiles;
DROP POLICY IF EXISTS "perfils_insert" ON profiles;
DROP POLICY IF EXISTS "perfils_update" ON profiles;
-- [AUDIT 2026-07-03] FUGA DE DADES: la lectura pública (USING true) exposava email, curs,
-- gustos i dies_estudi_preferits a qualsevol amb l'anon key. Ara cada usuari només llegeix
-- la seva fila; els camps públics d'altres usuaris s'exposen via la vista public_profiles.
CREATE POLICY "perfils_select" ON profiles FOR SELECT USING (auth.uid() = id);
REVOKE SELECT ON TABLE profiles FROM anon;
-- [AUDIT 2026-06-12] INSERT restringit a usuaris autenticats (el trigger handle_new_user
-- és SECURITY DEFINER i bypassa RLS, per tant no es veu afectat per aquest canvi)
CREATE POLICY "perfils_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
-- [AUDIT 2026-06-12] Eliminat OR auth.uid() IS NOT NULL: era redundant i massa permissiu
CREATE POLICY "perfils_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- [AUDIT 2026-07-03] Vista amb NOMÉS camps públics (amics, lligues, invitacions, rànquing).
-- Mai email ni preferències d'estudi. Només per a usuaris autenticats.
CREATE OR REPLACE VIEW public_profiles AS
SELECT username, avatar, hero_level, hero_xp, week_start_xp, week_anchor
FROM profiles;
ALTER VIEW public_profiles OWNER TO postgres;
REVOKE ALL ON TABLE public_profiles FROM public, anon;
GRANT SELECT ON TABLE public_profiles TO authenticated;

-- [AUDIT 2026-07-03] Disponibilitat de username al registre (pre-auth): només un booleà
CREATE OR REPLACE FUNCTION username_exists(uname TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE lower(username) = lower(uname));
$$;
REVOKE EXECUTE ON FUNCTION username_exists(TEXT) FROM public;
GRANT EXECUTE ON FUNCTION username_exists(TEXT) TO anon, authenticated;

-- Trigger auto-crear perfil quan es registra un usuari
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, username, avatar, hero_xp, hero_level)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    '⚔️', 0, 1
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(profiles.username, EXCLUDED.username);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- [AUDIT 2026-07-03] HIGIENE: les funcions trigger no s'han de poder cridar via /rest/v1/rpc/.
-- Els triggers continuen funcionant (EXECUTE no es comprova en disparar-se).
REVOKE EXECUTE ON FUNCTION handle_new_user() FROM public, anon, authenticated;
-- (idem per sync_audit_task_to_jomaxpath si existeix al projecte)
-- REVOKE EXECUTE ON FUNCTION sync_audit_task_to_jomaxpath() FROM public, anon, authenticated;


-- ══════════════════════════
-- 2. USER DATA
-- ══════════════════════════
CREATE TABLE IF NOT EXISTS user_data (
  user_id UUID PRIMARY KEY,
  data JSONB DEFAULT '{}',
  updated TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_data ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}';
ALTER TABLE user_data ADD COLUMN IF NOT EXISTS updated TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "userdata_all" ON user_data;
CREATE POLICY "userdata_all" ON user_data FOR ALL USING (auth.uid() = user_id);


-- ══════════════════════════
-- 3. SHARED BOARDS
-- ══════════════════════════
CREATE TABLE IF NOT EXISTS shared_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  owner_id TEXT,
  owner_name TEXT,
  board_data JSONB DEFAULT '{}',
  updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- owner_id com TEXT (no FK) per evitar errors si l'usuari és local
ALTER TABLE shared_boards ADD COLUMN IF NOT EXISTS owner_id TEXT;
ALTER TABLE shared_boards ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE shared_boards ADD COLUMN IF NOT EXISTS board_data JSONB DEFAULT '{}';
ALTER TABLE shared_boards ADD COLUMN IF NOT EXISTS updated TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE shared_boards ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE shared_boards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "boards_select" ON shared_boards;
DROP POLICY IF EXISTS "boards_insert" ON shared_boards;
DROP POLICY IF EXISTS "boards_update" ON shared_boards;
CREATE POLICY "boards_select" ON shared_boards FOR SELECT USING (true);
-- [AUDIT 2026-06-12] Restringit a usuaris autenticats per evitar creació anònima de boards
CREATE POLICY "boards_insert" ON shared_boards FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
-- [AUDIT 2026-06-22] FIX SEGURETAT: restringit a propietari del board (auth.uid() IS NOT NULL
-- permetia que QUALSEVOL autenticat modifiqués taulers d'altri).
-- [AUDIT 2026-07-03] FIX COL·LABORACIÓ: els membres amb invitació acceptada també poden
-- editar (abans les seves edicions fallaven en silenci — RLS retorna 0 files, no error).
CREATE POLICY "boards_update" ON shared_boards FOR UPDATE TO authenticated
USING (
  owner_id::uuid = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM board_invites bi
    WHERE bi.board_code = shared_boards.code
      AND bi.status = 'accepted'
      AND bi.to_username = (SELECT p.username FROM profiles p WHERE p.id = (SELECT auth.uid()))
  )
)
WITH CHECK (
  owner_id::uuid = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM board_invites bi
    WHERE bi.board_code = shared_boards.code
      AND bi.status = 'accepted'
      AND bi.to_username = (SELECT p.username FROM profiles p WHERE p.id = (SELECT auth.uid()))
  )
);


-- ══════════════════════════
-- 4. BOARD INVITES
-- ══════════════════════════
CREATE TABLE IF NOT EXISTS board_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_code TEXT NOT NULL,
  board_name TEXT,
  from_username TEXT NOT NULL,
  to_username TEXT NOT NULL,
  invite_type TEXT DEFAULT 'username',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE board_invites ADD COLUMN IF NOT EXISTS board_code TEXT;
ALTER TABLE board_invites ADD COLUMN IF NOT EXISTS board_name TEXT;
ALTER TABLE board_invites ADD COLUMN IF NOT EXISTS from_username TEXT;
ALTER TABLE board_invites ADD COLUMN IF NOT EXISTS to_username TEXT;
ALTER TABLE board_invites ADD COLUMN IF NOT EXISTS invite_type TEXT DEFAULT 'username';
ALTER TABLE board_invites ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE board_invites ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE board_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invites_select" ON board_invites;
DROP POLICY IF EXISTS "invites_insert" ON board_invites;
DROP POLICY IF EXISTS "invites_update" ON board_invites;
CREATE POLICY "invites_select" ON board_invites FOR SELECT USING (true);
-- [AUDIT 2026-06-12] Restringit: només usuaris autenticats poden enviar invitacions
CREATE POLICY "invites_insert" ON board_invites FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
-- [AUDIT 2026-06-12] Restringit: acceptar/rebutjar invitació requereix autenticació
CREATE POLICY "invites_update" ON board_invites FOR UPDATE USING (auth.uid() IS NOT NULL);


-- ══════════════════════════
-- 5. FRIEND REQUESTS
-- ══════════════════════════
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_username TEXT NOT NULL,
  to_username TEXT NOT NULL,
  from_avatar TEXT DEFAULT '⚔️',
  from_level INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE friend_requests ADD COLUMN IF NOT EXISTS from_username TEXT;
ALTER TABLE friend_requests ADD COLUMN IF NOT EXISTS to_username TEXT;
ALTER TABLE friend_requests ADD COLUMN IF NOT EXISTS from_avatar TEXT DEFAULT '⚔️';
ALTER TABLE friend_requests ADD COLUMN IF NOT EXISTS from_level INTEGER DEFAULT 1;
ALTER TABLE friend_requests ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE friend_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Índex per evitar duplicats
CREATE UNIQUE INDEX IF NOT EXISTS friend_req_unique ON friend_requests (lower(from_username), lower(to_username));

ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "freq_select" ON friend_requests;
DROP POLICY IF EXISTS "freq_insert" ON friend_requests;
DROP POLICY IF EXISTS "freq_update" ON friend_requests;
CREATE POLICY "freq_select" ON friend_requests FOR SELECT USING (true);
-- [AUDIT 2026-06-12] Restringit: sol·licituds d'amistat requereixen autenticació
CREATE POLICY "freq_insert" ON friend_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "freq_update" ON friend_requests FOR UPDATE USING (auth.uid() IS NOT NULL);


-- ══════════════════════════
-- 6. COMPETITION REQUESTS
-- ══════════════════════════
CREATE TABLE IF NOT EXISTS competition_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_username TEXT NOT NULL,
  to_username TEXT NOT NULL,
  from_avatar TEXT DEFAULT '⚔️',
  from_level INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE competition_requests ADD COLUMN IF NOT EXISTS from_username TEXT;
ALTER TABLE competition_requests ADD COLUMN IF NOT EXISTS to_username TEXT;
ALTER TABLE competition_requests ADD COLUMN IF NOT EXISTS from_avatar TEXT DEFAULT '⚔️';
ALTER TABLE competition_requests ADD COLUMN IF NOT EXISTS from_level INTEGER DEFAULT 1;
ALTER TABLE competition_requests ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE competition_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE competition_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "creq_select" ON competition_requests;
DROP POLICY IF EXISTS "creq_insert" ON competition_requests;
DROP POLICY IF EXISTS "creq_update" ON competition_requests;
CREATE POLICY "creq_select" ON competition_requests FOR SELECT USING (true);
-- [AUDIT 2026-06-12] Restringit: sol·licituds de competició requereixen autenticació
CREATE POLICY "creq_insert" ON competition_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "creq_update" ON competition_requests FOR UPDATE USING (auth.uid() IS NOT NULL);


-- ══════════════════════════════════════════════════════════════
-- VERIFICACIÓ — executa per comprovar que tot és correcte:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' ORDER BY table_name;
-- ══════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════
-- 🔐 GOOGLE AUTH — PASSOS AL DASHBOARD (no es fa des d'aquí)
-- ════════════════════════════════════════════════════════════════
-- 1. https://console.cloud.google.com/
--    → Crea projecte → APIs & Services → Credentials
--    → "+ CREATE CREDENTIALS" → OAuth 2.0 Client ID
--    → Application type: Web application
--    → Authorized redirect URIs: https://toefrxqijvextqqngapx.supabase.co/auth/v1/callback
--    → Guarda el CLIENT ID i CLIENT SECRET
--
-- 2. https://supabase.com/dashboard/project/toefrxqijvextqqngapx
--    → Authentication → Providers → Google → ENABLE
--    → Enganxa Client ID i Client Secret
--    → Save
--
-- 3. Authentication → URL Configuration
--    → Site URL: https://jomaxpath.com (o la teva URL)
--    → Redirect URLs (afegeix totes):
--        https://jomaxpath.com/**
--        http://localhost:3000/**
--        http://localhost:8080/**
--        http://127.0.0.1:*/**
--    → Save
--
-- Un cop fet, el botó "Continuar amb Google" funcionarà! ✅
-- ════════════════════════════════════════════════════════════════
