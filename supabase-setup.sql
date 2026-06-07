-- ═══════════════════════════════════════════════════════════════
-- JOMAXPATH — SUPABASE SETUP
-- Executa aquestes queries al SQL Editor del teu projecte Supabase
-- https://supabase.com/dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

-- 1. PROFILES (usuaris registrats)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT UNIQUE,
  avatar TEXT DEFAULT '⚔️',
  hero_xp INTEGER DEFAULT 0,
  hero_level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security per profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Perfils públics llegibles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Usuaris poden editar el seu perfil" ON profiles FOR ALL USING (auth.uid() = id);

-- Trigger per crear perfil automàticament al registrar-se
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, username, avatar)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    '⚔️'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- 2. USER DATA (sincronització de dades locals)
CREATE TABLE IF NOT EXISTS user_data (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  updated TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuaris veuen les seves dades" ON user_data FOR ALL USING (auth.uid() = user_id);


-- 3. SHARED BOARDS (llistes compartides)
CREATE TABLE IF NOT EXISTS shared_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_name TEXT,
  board_data JSONB DEFAULT '{}',
  updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shared_boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tothom pot veure llistes compartides" ON shared_boards FOR SELECT USING (true);
CREATE POLICY "Propietaris gestionen les seves llistes" ON shared_boards FOR ALL USING (auth.uid() = owner_id);


-- 4. BOARD INVITES (invitacions a llistes)
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

ALTER TABLE board_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tothom pot inserir invitacions" ON board_invites FOR INSERT WITH CHECK (true);
CREATE POLICY "Usuaris veuen les seves invitacions" ON board_invites FOR SELECT USING (true);
CREATE POLICY "Usuaris actualitzen invitacions" ON board_invites FOR UPDATE USING (true);


-- 5. FRIEND REQUESTS (sol·licituds d'amic per al hero)
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_username TEXT NOT NULL,
  to_username TEXT NOT NULL,
  from_avatar TEXT DEFAULT '⚔️',
  from_level INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_username, to_username)
);

ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sol·licituds visibles" ON friend_requests FOR SELECT USING (true);
CREATE POLICY "Inserir sol·licituds" ON friend_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualitzar sol·licituds" ON friend_requests FOR UPDATE USING (true);


-- 6. COMPETITION REQUESTS (reptes entre herois)
CREATE TABLE IF NOT EXISTS competition_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_username TEXT NOT NULL,
  to_username TEXT NOT NULL,
  from_avatar TEXT DEFAULT '⚔️',
  from_level INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE competition_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reptes visibles" ON competition_requests FOR SELECT USING (true);
CREATE POLICY "Inserir reptes" ON competition_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualitzar reptes" ON competition_requests FOR UPDATE USING (true);


-- ═══════════════════════════════════════════════════════════════
-- GOOGLE AUTH — Passos a seguir al dashboard de Supabase:
--
-- 1. Ves a Authentication → Providers → Google
-- 2. Activa "Enable Google provider"
-- 3. Entra el Client ID i Client Secret de Google Cloud Console:
--    - https://console.cloud.google.com/
--    - Crea un projecte → APIs & Services → Credentials
--    - OAuth 2.0 Client ID (Web application)
--    - Authorized redirect URIs: https://toefrxqijvextqqngapx.supabase.co/auth/v1/callback
-- 4. A Supabase → Authentication → URL Configuration:
--    - Site URL: https://jomaxpath.com (o http://localhost:PORT per local)
--    - Redirect URLs: afegeix https://jomaxpath.com/**  i  http://localhost:*/**
-- ═══════════════════════════════════════════════════════════════
