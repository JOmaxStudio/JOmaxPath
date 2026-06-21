/* ═══════════════════════════════════════════════════════════════
   JOMAXPATH — shop.js
   Botiga d'items: visualització, compra, equipar
   Depèn de: _supabase, _currentUser, showToast, awardXP/Gold, _esc (globals)
═══════════════════════════════════════════════════════════════ */
'use strict';

let _shopItems     = null;   // tots els items disponibles
let _userItems     = null;   // items que té l'usuari [ { item_id } ]
let _equippedItems = {};     // { hat: id, accessory: id, background: id }

/* ════════════════════════════════════════════════════════════
   OBRE LA BOTIGA (modal)
════════════════════════════════════════════════════════════ */
function openShop() {
  if (document.getElementById('shop-modal-root')) return;
  _injectShopStyles();
  const root = document.createElement('div');
  root.id = 'shop-modal-root';
  root.innerHTML = `
    <div class="shop-backdrop" onclick="closeShop()"></div>
    <div class="shop-modal" role="dialog" aria-modal="true" aria-label="Botiga d'items">
      <div class="shop-header">
        <div class="shop-title">🛒 Botiga d'items</div>
        <div id="shop-gold-display" class="shop-gold">
          <span>🪙</span><span id="shop-gold-val">—</span>
        </div>
        <button class="shop-close" onclick="closeShop()" aria-label="Tanca">✕</button>
      </div>
      <div class="shop-tabs">
        <button class="shop-tab active" onclick="_shopFilterTab('all',this)">Tots</button>
        <button class="shop-tab" onclick="_shopFilterTab('hat',this)">🎩 Barrets</button>
        <button class="shop-tab" onclick="_shopFilterTab('accessory',this)">✨ Accessoris</button>
        <button class="shop-tab" onclick="_shopFilterTab('background',this)">🖼️ Fons</button>
      </div>
      <div id="shop-grid" class="shop-grid">
        <div class="shop-loading">Carregant botiga...</div>
      </div>
    </div>`;
  document.body.appendChild(root);
  renderShop();
}

function closeShop() {
  document.getElementById('shop-modal-root')?.remove();
}

/* ════════════════════════════════════════════════════════════
   CARREGA I RENDERITZA LA BOTIGA
════════════════════════════════════════════════════════════ */
async function renderShop(filterType) {
  const grid = document.getElementById('shop-grid');
  if (!grid) return;

  const uid = window._currentUser?.id;
  if (!uid || !window._supabase) {
    grid.innerHTML = `<div class="shop-empty">Cal iniciar sessió per accedir a la botiga.</div>`;
    return;
  }

  try {
    // Carrega en paral·lel si no tenim cache
    if (!_shopItems) {
      const { data } = await window._supabase.from('items').select('*').order('cost');
      _shopItems = data || [];
    }
    if (!_userItems) {
      const { data } = await window._supabase.from('user_items').select('item_id').eq('user_id', uid);
      _userItems = data || [];
    }

    // Gold actual
    const { data: prof } = await window._supabase
      .from('profiles').select('gold, equipped_items').eq('id', uid).single();
    const gold = prof?.gold || 0;
    _equippedItems = prof?.equipped_items || {};

    const goldEl = document.getElementById('shop-gold-val');
    if (goldEl) goldEl.textContent = gold;

    const ownedIds = new Set((_userItems || []).map(ui => ui.item_id));

    const items = filterType && filterType !== 'all'
      ? _shopItems.filter(i => i.type === filterType)
      : _shopItems;

    if (items.length === 0) {
      grid.innerHTML = `<div class="shop-empty">No hi ha items d'aquesta categoria.</div>`;
      return;
    }

    grid.innerHTML = items.map(item => {
      const owned    = ownedIds.has(item.id);
      const equipped = Object.values(_equippedItems).includes(item.id);
      const canAfford = gold >= item.cost;
      const typeLabel = { hat:'Barret', accessory:'Accessori', background:'Fons' }[item.type] || item.type;

      return `<div class="shop-card ${owned ? 'owned' : ''} ${equipped ? 'equipped' : ''}">
        <div class="shop-card-emoji">${item.emoji || '🎁'}</div>
        <div class="shop-card-type">${typeLabel}</div>
        <div class="shop-card-name">${_esc ? _esc(item.name) : item.name}</div>
        ${item.description ? `<div class="shop-card-desc">${_esc ? _esc(item.description) : item.description}</div>` : ''}
        <div class="shop-card-footer">
          ${owned ? `
            <span class="shop-badge-owned">✓ Obtingut</span>
            ${equipped
              ? `<span class="shop-badge-eq">Equipat</span>`
              : `<button class="shop-btn-equip" onclick="equipItem('${item.id}','${item.type}')">Equipar</button>`}
          ` : `
            <span class="shop-price">🪙 ${item.cost}</span>
            <button class="shop-btn-buy ${canAfford ? '' : 'disabled'}"
              onclick="${canAfford ? `buyItem('${item.id}',${item.cost},'${(item.name||'').replace(/'/g,"\\'")}')` : ''}"
              ${canAfford ? '' : 'disabled'}
              title="${canAfford ? 'Comprar' : 'Et falten ' + (item.cost - gold) + ' 🪙'}">
              ${canAfford ? 'Comprar' : 'Insuficient'}
            </button>
          `}
        </div>
      </div>`;
    }).join('');
  } catch (e) {
    grid.innerHTML = `<div class="shop-empty">❌ Error: ${_esc ? _esc(e.message) : e.message}</div>`;
  }
}

function _shopFilterTab(type, btn) {
  document.querySelectorAll('.shop-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderShop(type);
}

/* ════════════════════════════════════════════════════════════
   COMPRAR ITEM
════════════════════════════════════════════════════════════ */
async function buyItem(itemId, itemCost, itemName) {
  const uid = window._currentUser?.id;
  if (!uid || !window._supabase) return;

  try {
    const { data: profile } = await window._supabase
      .from('profiles').select('gold').eq('id', uid).single();

    if (!profile || profile.gold < itemCost) {
      if (typeof showToast === 'function') showToast('No tens prou gold! 🪙');
      return;
    }

    // Desconta gold + afegeix item
    await window._supabase.from('profiles')
      .update({ gold: profile.gold - itemCost }).eq('id', uid);

    await window._supabase.from('user_items')
      .insert({ user_id: uid, item_id: itemId });

    // Invalida cache
    _userItems = null;
    if (window._rpgProfile) window._rpgProfile.gold = profile.gold - itemCost;

    // Actualitza UI
    _updateRpgGoldUI(profile.gold - itemCost);

    if (typeof showToast === 'function')
      showToast('🎉 Has obtingut "' + itemName + '"!');

    renderShop(_currentShopFilter);
  } catch (e) {
    if (typeof showToast === 'function')
      showToast('❌ Error en la compra: ' + (e.message || e));
  }
}

let _currentShopFilter = 'all';

/* ════════════════════════════════════════════════════════════
   EQUIPAR ITEM
════════════════════════════════════════════════════════════ */
async function equipItem(itemId, itemType) {
  const uid = window._currentUser?.id;
  if (!uid || !window._supabase) return;

  try {
    const newEquipped = { ..._equippedItems, [itemType]: itemId };
    await window._supabase.from('profiles')
      .update({ equipped_items: newEquipped }).eq('id', uid);
    _equippedItems = newEquipped;
    if (typeof showToast === 'function') showToast('✅ Item equipat!');
    renderShop(_currentShopFilter);
  } catch (e) {
    if (typeof showToast === 'function') showToast('❌ Error equipant item');
  }
}

function _updateRpgGoldUI(gold) {
  const goldEl = document.getElementById('rpg-gold-count');
  if (goldEl) goldEl.textContent = gold;
  const shopGoldEl = document.getElementById('shop-gold-val');
  if (shopGoldEl) shopGoldEl.textContent = gold;
}

/* ════════════════════════════════════════════════════════════
   ESTILOS
════════════════════════════════════════════════════════════ */
function _injectShopStyles() {
  if (document.getElementById('shop-styles')) return;
  const s = document.createElement('style');
  s.id = 'shop-styles';
  s.textContent = `
/* Modal */
#shop-modal-root{position:fixed;inset:0;z-index:9100;display:flex;align-items:center;justify-content:center;}
.shop-backdrop{position:absolute;inset:0;background:rgba(0,0,0,0.8);backdrop-filter:blur(4px);}
.shop-modal{position:relative;background:var(--card,#13132a);border:1px solid rgba(124,58,237,0.3);border-radius:20px;width:min(660px,96vw);max-height:88dvh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.6);}

/* Header */
.shop-header{display:flex;align-items:center;gap:10px;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.07);}
.shop-title{font-family:'Space Mono',monospace;font-weight:700;font-size:14px;color:var(--text);flex:1;}
.shop-gold{display:flex;align-items:center;gap:5px;padding:5px 12px;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.28);border-radius:20px;font-weight:700;color:#fbbf24;font-size:13px;}
.shop-close{background:none;border:none;color:var(--muted);cursor:pointer;font-size:18px;padding:4px 8px;border-radius:6px;transition:color .2s;}
.shop-close:hover{color:var(--text);}

/* Tabs */
.shop-tabs{display:flex;gap:4px;padding:10px 16px;border-bottom:1px solid rgba(255,255,255,0.05);}
.shop-tab{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:var(--muted);border-radius:8px;padding:6px 12px;font-size:11px;cursor:pointer;transition:all .2s;}
.shop-tab.active,.shop-tab:hover{background:rgba(124,58,237,0.2);border-color:rgba(124,58,237,0.4);color:#a78bfa;}

/* Grid */
.shop-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;padding:16px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(124,58,237,0.3) transparent;}
.shop-loading,.shop-empty{grid-column:1/-1;text-align:center;color:var(--muted);padding:30px;font-size:13px;}

/* Cards */
.shop-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:14px 12px;display:flex;flex-direction:column;align-items:center;gap:6px;transition:all .2s;position:relative;}
.shop-card:hover{background:rgba(124,58,237,0.08);border-color:rgba(124,58,237,0.3);transform:translateY(-2px);}
.shop-card.owned{border-color:rgba(52,211,153,0.25);}
.shop-card.equipped{border-color:rgba(245,158,11,0.4);background:rgba(245,158,11,0.04);}
.shop-card-emoji{font-size:38px;line-height:1;margin-bottom:2px;}
.shop-card-type{font-family:'Space Mono',monospace;font-size:7.5px;letter-spacing:1.5px;color:var(--muted);text-transform:uppercase;}
.shop-card-name{font-size:12px;font-weight:700;color:var(--text);text-align:center;line-height:1.3;}
.shop-card-desc{font-size:10px;color:var(--muted);text-align:center;line-height:1.4;}
.shop-card-footer{margin-top:4px;display:flex;flex-direction:column;align-items:center;gap:5px;width:100%;}
.shop-price{font-family:'Space Mono',monospace;font-size:12px;font-weight:700;color:#fbbf24;}
.shop-badge-owned{font-size:10px;color:#34d399;font-weight:700;}
.shop-badge-eq{font-size:9px;color:#fbbf24;font-weight:700;letter-spacing:1px;}

/* Buttons */
.shop-btn-buy,.shop-btn-equip{width:100%;padding:7px 10px;border-radius:8px;border:none;font-size:11px;font-weight:700;cursor:pointer;transition:all .2s;}
.shop-btn-buy{background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;}
.shop-btn-buy:hover{opacity:.85;}
.shop-btn-buy.disabled{background:rgba(255,255,255,0.08);color:var(--muted);cursor:not-allowed;opacity:.55;}
.shop-btn-equip{background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.35);color:#fbbf24;}
.shop-btn-equip:hover{background:rgba(245,158,11,0.25);}

@media(max-width:480px){
  .shop-grid{grid-template-columns:repeat(2,1fr);}
  .shop-modal{border-radius:14px;}
}
`;
  document.head.appendChild(s);
}
