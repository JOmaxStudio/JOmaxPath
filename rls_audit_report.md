# RLS Security Audit Report — JOmaxPath
**Data:** 2026-06-21  
**Projecte Supabase:** `toefrxqijvextqqngapx`  
**Migració aplicada:** `rls_security_audit_fix`

---

## Estat inicial (PRE-audit)

| Taula | RLS actiu | Problema |
|-------|-----------|---------|
| `profiles` | ✓ | Policies correctes + lectura pública (intencional) |
| `user_data` | ✓ | Policy correcta (`user_id = auth.uid()`) |
| `audit_tasks` | ✓ | **CRÍTIC**: `audit_tasks_all` amb `USING(true)` → 52 tasques exposades públicament |
| `friend_requests` | ✓ | **CRÍTIC**: `Public read/write` amb `USING(true)` → totes les sol·licituds exposades |
| `competition_requests` | ✓ | **CRÍTIC**: `Public read/write` amb `USING(true)` → idem |
| `board_invites` | ✓ | **CRÍTIC**: `Public read/write` amb `USING(true)` → idem |
| `shared_boards` | ✓ | **CRÍTIC**: `Public read/write` amb `USING(true)` → idem |
| `leagues` | ✓ | **CRÍTIC**: `Public read/write` amb `USING(true)` → escriptura pública |

**Funcions exposades:**
- `handle_new_user()` — SECURITY DEFINER callable per `anon` i `authenticated` via `/rest/v1/rpc/`
- `sync_audit_task_to_jomaxpath()` — idem + `search_path` mutable

---

## Canvis aplicats

### 1. `audit_tasks` — Accés completament bloquejat
- **Eliminada**: policy `audit_tasks_all` (USING true)
- **Resultat**: RLS actiu sense policies = accés bloquejat via REST
- **Nota**: Les funcions SECURITY DEFINER (trigger) ignoren RLS → la sincronització continua funcionant

### 2. `friend_requests` — Policies per username
- **Eliminades**: `Public read/write friend_requests`, `freq_insert`, `freq_update`
- **Creades**:
  - `freq_select`: pots veure si ets `from_username` O `to_username`
  - `freq_insert`: `from_username` ha de ser el teu username
  - `freq_update`: `to_username` ha de ser el teu username (acceptar/rebutjar)
  - `freq_delete`: `from_username` ha de ser el teu username (cancel·lar)

### 3. `competition_requests` — Policies per username
- Idèntic al patró de `friend_requests`

### 4. `board_invites` — Policies per username
- **Eliminades**: `Public read/write board_invites`, `invites_insert`, `invites_update`
- **Creades**: select/insert/update/delete per sender (`from_username`) i receiver (`to_username`)

### 5. `shared_boards` — Policies per owner_id + convidats acceptats
- **Eliminades**: `Public read/write shared_boards`, `boards_insert`, `boards_update`
- **Creades**:
  - `boards_select`: `owner_id = auth.uid()` OR té board_invite acceptada
  - `boards_insert`: `owner_id = auth.uid()`
  - `boards_update`: owner O convidat acceptat
  - `boards_delete`: `owner_id = auth.uid()`

### 6. `leagues` — Lectura autenticada, escriptura per owner
- **Eliminada**: `Public read/write leagues`
- **Creades**:
  - `leagues_select`: qualsevol autenticat (necessari per buscar leagues)
  - `leagues_insert/update/delete`: `owner_username = teu username`

### 7. Funcions — Revocat accés RPC públic
```sql
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_audit_task_to_jomaxpath() FROM anon, authenticated;
```

### 8. `search_path` fixat a `sync_audit_task_to_jomaxpath`
- Afegit `SET search_path = public, pg_temp` a la definició de la funció

### 9. Índexs de rendiment per RLS
```sql
idx_friend_requests_from / _to
idx_competition_requests_from / _to
idx_board_invites_from / _to / _board_code
idx_shared_boards_owner
idx_leagues_owner
idx_profiles_username
```

---

## Test de verificació (POST-audit) — anon key

| Taula | Resultat | Esperat |
|-------|----------|---------|
| `profiles` | 3 files ✓ | Públic per cerca d'usuaris (intencional) |
| `user_data` | 0 files ✓ | Bloquejar |
| `audit_tasks` | 0 files ✓ | Bloquejar |
| `friend_requests` | 0 files ✓ | Bloquejar |
| `shared_boards` | 0 files ✓ | Bloquejar |
| `board_invites` | 0 files ✓ | Bloquejar |
| `competition_requests` | 0 files ✓ | Bloquejar |
| `leagues` | 0 files ✓ | Bloquejar (requereix autenticació) |

---

## Advertències pendents (no crítiques)

| Problema | Acció recomanada |
|----------|-----------------|
| `handle_new_user` — SECURITY DEFINER visible via RPC | Inevitable: és un trigger d'auth. El REVOKE limita l'accés però Supabase pot reassignar grants. Considera moure-la al schema `auth` o `extensions`. |
| `sync_audit_task_to_jomaxpath` — idem | Mateixa situació. Funciona com a trigger, no necessita ser RPC. |
| Leaked password protection desactivada | Activar al Dashboard → Authentication → Password Security → Enable HaveIBeenPwned |

---

## Nota tècnica: patró `(select auth.uid())`

Totes les policies utilitzen `(SELECT auth.uid())` amb wrapper SELECT en lloc de `auth.uid()` directament. Això evita que PostgreSQL avaluï la funció per cada fila de la taula, millorant el rendiment significativament en taules grans.

---

## Estat final Security Advisor

- ~~6 x `rls_policy_always_true` (WARN)~~ → **RESOLTS**
- ~~`function_search_path_mutable` (WARN)~~ → **RESOLT**
- `rls_enabled_no_policy` en `audit_tasks` (INFO) → **INTENCIONAL** (bloqueig total)
- `anon_security_definer_function_executable` (WARN) → **Parcialment resolt**, pendent revisió
- `auth_leaked_password_protection` (WARN) → **Pendent** (configuració de dashboard)
