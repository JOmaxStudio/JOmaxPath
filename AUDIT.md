# JOmaxPath — auditoria i seguiment

## Tancament de la revisió · 12 setembre 2026

La taula següent substitueix els pendents històrics de les seccions anteriors. «Verificat» es refereix a les comprovacions descrites, no a una certificació exhaustiva de totes les combinacions de dades, temes o dispositius.

| Requisit del prompt original | Estat final i evidència |
| --- | --- |
| Auditoria tècnica i preservació de l’arquitectura | COMPLETAT I VERIFICAT: estructura, dependències, claus i components identificats; cap migració ni canvi de framework. |
| Home / Avui | COMPLETAT I VERIFICAT: jerarquia, Focus/captura, agenda, tasques pendents/endarrerides, entregues i resum; dates i completats coberts per regressions. |
| Navegació principal i secundària | COMPLETAT I VERIFICAT: Avui/Calendari/Tasques/Focus/Julians i Més; navegació local d’escriptori i mòbil comprovada en els blocs previs. |
| Calendari / Horari / Events | COMPLETAT I VERIFICAT localment: Dia/Setmana/Mes, creació per tipus, projecció dels events i persistència; durades que travessen mitjanit cobertes per regressió. Remot pendent de sessió. |
| Composer de tasques i prioritat | COMPLETAT I VERIFICAT localment: editor compartit, opcions avançades plegades, camps preservats; crear/editar/completar/refrescar/eliminar temporal comprovat. Sense migració destructiva. |
| Sistema visual | COMPLETAT I VERIFICAT en les pantalles revisades: tokens existents, espaiat, cards, controls, estats de focus/disabled/busy/error i tema clar; conservada la personalització existent. |
| Iconografia i textos | COMPLETAT I VERIFICAT per als elements modificats: SVG coherents a la navegació principal, emojis conservats en gamificació/hàbits; català i HEROI corregits. No es proclama una revisió lingüística exhaustiva de tots els textos antics. |
| Focus i gamificació | COMPLETAT I VERIFICAT: opcions secundàries plegades, inici/pausa/reprendre; regressió del cicle, descans, canvi de dia i recompensa única. |
| Julians / preparació amb IA | COMPLETAT A NIVELL DE CODI / VALIDACIÓ REAL PENDENT PER BILLING EXTERN DE GEMINI. Fora de l’abast d’aquesta sessió; cap petició nova. No es consideren provats remotament pla, resums, flashcards o quizzes. |
| Captura ràpida | COMPLETAT I VERIFICAT: durada, franges, tipus/prioritat i conservació de tasques/Notes V2. Ctrl/Cmd+K exclou inputs, composició de text i diàlegs oberts. |
| Notes i Hàbits | COMPLETAT I VERIFICAT localment: persistència i edició comprovades prèviament; cercador amb nom accessible; nota accessible amb Tab i activació amb Enter i Espai comprovades el 12/09, contingut conservat. |
| Estadístiques | COMPLETAT I VERIFICAT: resum basat en dades, dates de completat, dades antigues sense dates excloses de conclusions temporals, dies locals i filtres. |
| Compartir | COMPLETAT PERÒ NO VERIFICABLE PER DEPENDÈNCIA EXTERNA: ordre acceptar→llegir compatible amb la RLS real; regressions de denegació, resposta sense files i error de lectura passen. Falta destinatari autenticat per al cicle real. |
| Configuració | COMPLETAT I VERIFICAT localment: labels, validació, desament i tema; diàleg amb Tab/Esc; pestanyes sense tall i tancament tàctil de 44px; capturat a 390px, 820px i 1280px durant els blocs. Compte remot pendent. |
| Developer mode i funcions properament | COMPLETAT I VERIFICAT en el codi modificat: diagnòstics restringits a localhost, eliminada la falsa activació premium; accions experimentals fora del flux principal. |
| Responsive i accessibilitat principal | COMPLETAT I VERIFICAT dins les comprovacions registrades: mòbil/tauleta/escriptori, modals de tasques/calendari/configuració, confirmació d’eliminació i Notes. No és una certificació WCAG completa. |
| Seguretat de dades i sincronització | COMPLETAT PERÒ NO VERIFICABLE PER DEPENDÈNCIA EXTERNA quant al flux autenticat: proves locals preserven descripcions, subtasques, dates, notes, calendaris, exàmens, claus desconegudes i eliminacions; errors no anuncien desament correcte. Cap dada remota modificada. |

### Resultat final de comprovacions

- Passen `check.cjs`, `regression.cjs`, `data-regression.cjs`, `sync-regression.cjs`, `focus-regression.cjs` i `sharing-regression.cjs` de `scripts/`.
- Sintaxi de 21 scripts i referències locals correctes. No hi ha build/lint/typecheck configurats en aquest projecte estàtic.
- Notes: Tab, Enter i Espai verificats al navegador el 12/09; cerca amb nom accessible, contingut de la nota existent conservat i consola sense errors.
- S’aprofiten les comprovacions manuals anteriors de tasques, calendari, Focus, Notes, Hàbits, Configuració i responsive: no s’han repetit les que no depenen dels darrers canvis.
- Supabase real: estat `ACTIVE_HEALTHY`, consulta SQL i lectura d’esquemes/polítiques confirmats el 11/09. Sense sessió de prova disponible el 12/09. **No validats remotament**: login/logout, persistència de sessió, lectura/escriptura com a usuari, sincronització de les entitats i compartir amb destinatari. Limitació acceptada per l’usuari per a aquest tancament.
- Riscos residuals: validació autenticada i multiusuari pendent; les proves amb servei simulat no certifiquen concurrència entre dispositius. Warning preexistent de la configuració `lock` de Supabase anotat; no s’ha canviat l’autenticació sense sessió per provar-la.
- No s’inclouen logs, configuració personal de `.claude`, `_git_push.bat` ni dades de prova del navegador al commit. Les fixtures sintètiques dels scripts són part de les regressions.

## Represa · 11 setembre 2026 (estat actual, preval sobre les notes històriques)

- Supabase: `ACTIVE_HEALTHY` confirmat amb el connector; `select 1` retorna `connection_ok: 1`. Esquemes i polítiques de `user_data`, `profiles`, `shared_boards` i `board_invites` consultats sense modificar dades ni permisos.
- Autenticació i fluxos remots d’usuari: pendents d’iniciar sessió amb un compte de prova. La connexió SQL administrativa no els valida. S’ha demanat iniciar sessió a la previsualització local, sense enviar contrasenyes pel xat.
- Cicle de tasca temporal completat: `[PROVA] Regressió editada 11 setembre` conservava el nom, descripció i estat completat; eliminada només aquesta tasca i refrescat. La llista passa de 2/3 a 1/2 i l’element no reapareix.
- Confirmació d’eliminació compartida: afegits nom accessible, rol de diàleg, focus inicial a Cancel·lar, Tab circular, Esc i restauració del focus. Comprovat amb teclat en tasques i cancel·lació amb ratolí en hàbits; dades conservades i consola sense errors.
- Compartir: la política real només permet al destinatari llegir una llista després d’acceptar la invitació. Corregit l’ordre del client (acceptar abans de llegir), comprovant errors i actualitzacions sense files. Rebutjar ja no anuncia èxit quan falla. `scripts/sharing-regression.cjs` verifica aquests casos amb servei simulat; prova autenticada real encara pendent.
- Les cinc comprovacions anteriors passen: sintaxi/referències, regressions, dades, sincronització simulada i cicle Focus. La nova regressió de compartir també passa; dades i sincronització repetides després del canvi de compartir passen.
- Correccions de sincronització prèvies presents: Notes V2, calendaris mensuals, exàmens, claus desconegudes i eliminacions; errors de lectura/escriptura retornen fallada. Encara no qualificades com a validades remotament.
- Julians/Gemini: **pendent de validació per billing de Gemini**, segons confirmació de l’usuari. No es faran més peticions ni modificacions d’IA. El canvi anterior del model a `gemini-3.5-flash-lite` ja es va desplegar al Worker; això no implica validació funcional de Gemini.
- Auditoria final punt per punt i regressió global final encara pendents. Cap commit ni push final realitzat.

## Fase 0 · 9 setembre 2026

- Web estàtica: HTML, CSS i JavaScript global, sense framework, package.json, compilador ni tests previs.
- Entrades: index.html (app), hero.html (gamificació), pricing.html; worker.js serveix assets i proxy d'IA amb Cloudflare. _redirects manté les rutes SPA.
- Navegació: navTo, classes page-active, URL amb replaceState; sidebar, barra inferior, drawer i hub Estudi. El menú actiu depèn d'índexs fràgils.
- Estat: variables globals i localStorage; tasques planes i llistes v3 conviuen amb una sincronització explícita. Preservar claus, camps, recurrències i identificadors.
- Autenticació: Supabase (correu/contrasenya i Google) i mode local. Persistència al núvol: user_data; profiles, shared_boards i board_invites; subscripcions realtime i desament periòdic.
- Serveis: Supabase CDN, Chart.js, marked, PDF.js, Mammoth, JSZip, Google Fonts, Spotify i Gemini a través del Worker. No s'han canviat versions ni permisos.
- Components: modals de tasques, dia, mes, captura, notes i configuració. El Task Editor ja comparteix creació i edició; no cal un segon composer.
- Estils: tokens de color a :root i múltiples temes; styles.css gran i blocs CSS dins index.html amb overrides i !important. Responsive repartit entre tots dos.
- Extensions: analytics, rpg, missions, shop, adaptability, adaptive-context, nlp-parser i pixel-heroes; globals i ordre de càrrega acoblats.
- SW: notificacions i recordatoris; no implementa cache offline d'assets.
- Duplicació detectada: formatDateReadable i _playPomoAlarm; patches de renderització i estils. Cal revisar cada dependència abans d'eliminar res.
- Riscos: errors de localStorage silenciats; dades locals/núvol amb models paral·lels; HTML interpolat; mòdul de desenvolupador amb comprovació només al client (no és autorització segura); metadades de progrés que no sempre es reflecteixen a Home.
- Canvis previs de l'usuari: app.js, .claude/settings.local.json, _git_push.bat i logs/. No revertir-los.

## Validació

`node scripts/check.cjs`: sintaxi de JS, scripts inline i referències locals. Equival a la verificació estàtica disponible, no a un build ni a una prova de runtime.

Comprovació inicial: tots els scripts passen sintaxi. Navegador local obert a 127.0.0.1:4173, mode sense compte disponible. Login real, realtime, compartir, IA i notificacions externes requereixen validació amb serveis i comptes de prova.

## Seguiment contrastat amb el prompt · 10 setembre 2026

Cap fase visual es dona per tancada només perquè s'ha modificat. No hi ha commit, push ni desplegament d'aquests canvis.

| Fase | Implementació i evidència | Validació encara pendent |
| --- | --- | --- |
| 0 Auditoria | Arquitectura i models identificats; canvis previs preservats | Auditoria final del diff complet |
| 1 Sistema visual | Tokens d'espaiat/radis/focus; controls compartits; tipografia de títols i labels; estats disabled/busy/invalid | Revisió visual completa de totes les pantalles i temes; contrast i iconografia secundària |
| 2 Navegació | Avui/Calendari/Tasques/Focus/Julians; accessos secundaris preservats; botons semàntics i aria-current | Teclat complet i rutes secundàries; revisió final d'escriptori |
| 3 Avui | Focus/captura, properes entregues, recompte segons completat real i data local | Durada dels events validada amb tests; completar prova visual de totes les situacions |
| 4 Tasques | Composer existent compartit; avançat plegat; focus/Escape/Tab; captura compatible amb llistes | Eliminació de dades de prova, recurrències, assignació remota |
| 5 Calendari | Dia/Setmana/Mes i creació per tipus; projecció dels events sense canviar els models | Regressions de recurrència, edició des del mes i persistència remota |
| 6 Focus | Temporitzador prioritari; recompenses i opcions plegades; iniciar/pausar/reprendre provat | Completar sessió i transició a descans; revisió de mitjanit |
| 7 Julians/exàmens | Escriptura immediata, opcions plegades, accés a preparar examen; labels i adjunt amb teclat | IA real, fitxers, pla, flashcards, quiz i creació de tasques |
| 8 Hàbits/Notes/Estadístiques | Crear/completar hàbit i crear/editar nota persisteixen després de refrescar; resum factual d'estadístiques | Gràfics amb dates locals, filtres i remot |
| 9 Compartir/Configuració | Compartir per usuari conservat; diagnòstics només locals; Configuració i tema clar provats | Invitacions reals; polir formularis i comprovar desament de configuració |
| 10 Regressions | 3 scripts de comprovació passen; tauleta 820px sense overflow; exàmens 390px sense overflow | Matriu final mòbil/tauleta/escriptori, autenticació i sincronització real |

### Evidència del bloc actual

- Notes: «Nota local editada» i contingut conservats després de recarregar; hàbit de prova continua completat.
- Tauleta 820px: sidebar 58px, contenidor 759px amb viewport útil 817px; no overflow horitzontal.
- Mòbil 390px: exàmens dins 359px; inputs amb noms accessibles. Menús tancats ja no exposen controls ocults.
- Modal de tasques: detectat que la barra inferior tapava Cancel·lar; corregit movent el mateix node al body quan s'obre. Comprovat per captura i hit testing; Cancel·lar funciona sense modificar dades.
- Consola: sense errors JavaScript nous. Warning preexistent de Supabase sobre `lock` obsolet; pendent revisar amb autenticació real.
- `node scripts/check.cjs`, `node scripts/regression.cjs`, `node scripts/data-regression.cjs`: passen. No hi ha build/lint/typecheck configurats.

### Dependències remotes i riscos oberts

- Supabase `toefrxqijvextqqngapx`: consultat diverses vegades el 10/09; darrera resposta INACTIVE. L'usuari n'està gestionant l'activació. No s'ha executat SQL ni restauració.
- Pendents login/logout, persistència remota, realtime i compartir amb comptes de prova. Cap prova local substitueix aquestes comprovacions.
- Revisió de codi ha detectat riscos preexistents en sincronització: la whitelist no inclou Notes V2 ni claus mensuals; upsert no comprova `error`; merge de tasques planes pot recuperar elements eliminats. Cal tractar-los amb proves específiques i sense migracions destructives abans de publicar.
- GitHub accessible amb connector; consulta Git per HTTPS necessita resoldre l'accés schannel. Cloudflare Worker existent identificat, sense desplegar.

### Fonts consultades

- WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- Progressive disclosure: https://www.nngroup.com/articles/progressive-disclosure/
- Supabase upsert i errors: https://supabase.com/docs/reference/javascript/upsert
