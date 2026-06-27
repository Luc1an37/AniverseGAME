let tg = window.Telegram?.WebApp;
if (tg) { tg.expand(); tg.ready(); }

const CONFIG = {
  API_URL: 'https://ваш-домен.com',
  MAX_ENERGY: 1000,
  ENERGY_REGEN_RATE: 1,
  MAX_FLOATS: 8,
  MAX_PARTICLES: 20,
  DAILY_REWARD_GOLD: 500
};

const state = {
  gold: parseInt(localStorage.getItem('gold_empire_gold') || '0'),
  clickPower: parseInt(localStorage.getItem('gold_empire_cpc') || '1'),
  energy: parseInt(localStorage.getItem('gold_empire_energy') || String(CONFIG.MAX_ENERGY)),
  lastEnergyTick: parseInt(localStorage.getItem('gold_empire_last_tick') || String(Date.now())),
  userId: tg?.initDataUnsafe?.user?.id || 'guest_dev_123',
  username: tg?.initDataUnsafe?.user?.first_name || 'Лорд Империи',
  selectedProduct: null,
  inventory: JSON.parse(localStorage.getItem('gold_empire_inv') || '[]'),
  equippedPet: localStorage.getItem('gold_empire_pet') || null,
  equippedSkin: localStorage.getItem('gold_empire_skin') || null,
  audioCtx: null,
  particles: []
};

const PRODUCTS = [
  { id: "gold_small", category: "gold", name: "Малый сундук золота", stars: 50, icon: "💰", rarity: "common", badge: "NEW", desc: "+1,000 золота" },
  { id: "gold_medium", category: "gold", name: "Средний сундук золота", stars: 150, icon: "💰", rarity: "rare", badge: "POPULAR", desc: "+5,500 золота" },
  { id: "gold_large", category: "gold", name: "Большой сундук золота", stars: 500, icon: "💰", rarity: "epic", badge: "HOT", desc: "+25,000 золота" },
  { id: "pet_griffin", category: "pet", name: "Питомец: Грифон", stars: 200, icon: "🦅", rarity: "rare", badge: "NEW", desc: "Доход x1.5" },
  { id: "pet_dragon", category: "pet", name: "Питомец: Дракон", stars: 500, icon: "🐉", rarity: "epic", badge: "HOT", desc: "Доход x2.0" },
  { id: "pet_phoenix", category: "pet", name: "Питомец: Феникс", stars: 1000, icon: "🦅", rarity: "legendary", badge: "POPULAR", desc: "Доход x4.0" },
  { id: "booster_2x", category: "booster", name: "Ускоритель x2", stars: 100, icon: "🚀", rarity: "rare", badge: "NEW", desc: "7 дней x2" },
  { id: "booster_5x", category: "booster", name: "Ускоритель x5", stars: 300, icon: "🚀", rarity: "epic", badge: "HOT", desc: "3 дня x5" },
  { id: "booster_auto", category: "booster", name: "Автокликер 24ч", stars: 250, icon: "⚙️", rarity: "rare", badge: "POPULAR", desc: "+50/сек" },
  { id: "skin_castle_gold", category: "skin", name: "Скин: Золотой замок", stars: 400, icon: "🏰", rarity: "epic", badge: "NEW", desc: "Замок" },
  { id: "skin_hero_king", category: "skin", name: "Скин: Король-воин", stars: 350, icon: "👑", rarity: "epic", badge: "POPULAR", desc: "Герой" },
  { id: "skin_weapon_legendary", category: "skin", name: "Скин: Меч Эскалибур", stars: 600, icon: "⚔️", rarity: "legendary", badge: "HOT", desc: "Меч" },
  { id: "premium_month", category: "premium", name: "Премиум на месяц", stars: 1000, icon: "💎", rarity: "epic", badge: "NEW", desc: "30 дней VIP" },
  { id: "premium_year", category: "premium", name: "Премиум на год", stars: 5000, icon: "💎", rarity: "legendary", badge: "HOT", desc: "365 дней VIP" },
  { id: "energy_full", category: "premium", name: "Полная энергия", stars: 75, icon: "⚡", rarity: "common", badge: "NEW", desc: "Полный бак" }
];

function showToast(msg) {
  const box = document.getElementById('toastBox');
  if (box) {
    box.textContent = msg;
    box.style.display = 'block';
    setTimeout(() => { box.style.display = 'none'; }, 3000);
  }
}

function triggerHaptic(style = 'light') {
  if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred(style);
}

function initAudio() {
  if (state.audioCtx) return;
  try { state.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
}

function playClickSound() {
  if (!state.audioCtx) return;
  const ctx = state.audioCtx;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
}

function playPurchaseSound() {
  if (!state.audioCtx) return;
  const ctx = state.audioCtx;
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.08 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.08);
    osc.stop(ctx.currentTime + i * 0.08 + 0.3);
  });
}

function playEmptySound() {
  if (!state.audioCtx) return;
  const ctx = state.audioCtx;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.15);
}

function initParticlesPool() {
  const pool = document.getElementById('particlesPool');
  for (let i = 0; i < CONFIG.MAX_PARTICLES; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    pool.appendChild(p);
    state.particles.push({ el: p, busy: false });
  }
}

function spawnParticles(clientX, clientY) {
  const area = document.getElementById('clickerArea');
  const rect = area.getBoundingClientRect();
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;
  let spawned = 0;
  for (let p of state.particles) {
    if (p.busy || spawned >= 6) continue;
    p.busy = true;
    const angle = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 80;
    p.el.style.left = localX + 'px';
    p.el.style.top = localY + 'px';
    p.el.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
    p.el.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
    p.el.style.opacity = '1';
    p.el.style.animation = 'particleFly 0.5s ease-out forwards';
    setTimeout(() => {
      p.el.style.animation = '';
      p.el.style.opacity = '0';
      p.busy = false;
    }, 500);
    spawned++;
  }
}

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetTab = btn.getAttribute('data-tab');
    triggerHaptic('light');
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab-page').forEach(p => p.classList.remove('active'));
    document.getElementById('tab-' + targetTab).classList.add('active');
    if (targetTab === 'stars') renderShop();
    if (targetTab === 'inventory') renderInventory();
  });
});

function updateEnergyUI() {
  const pct = (state.energy / CONFIG.MAX_ENERGY) * 100;
  const fill = document.getElementById('energyFill');
  fill.style.width = pct + '%';
  if (pct < 20) fill.classList.add('low');
  else fill.classList.remove('low');
  document.getElementById('energyVal').textContent = Math.floor(state.energy);
}

function energyTick() {
  const elapsed = (Date.now() - state.lastEnergyTick) / 1000;
  if (state.energy < CONFIG.MAX_ENERGY && elapsed >= 1) {
    state.energy = Math.min(CONFIG.MAX_ENERGY, state.energy + Math.floor(elapsed) * CONFIG.ENERGY_REGEN_RATE);
    state.lastEnergyTick = Date.now();
    saveEnergy();
    updateEnergyUI();
  }
}

function saveEnergy() {
  localStorage.setItem('gold_empire_energy', String(Math.floor(state.energy)));
  localStorage.setItem('gold_empire_last_tick', String(state.lastEnergyTick));
}

setInterval(() => {
  if (state.energy < CONFIG.MAX_ENERGY) {
    state.energy = Math.min(CONFIG.MAX_ENERGY, state.energy + CONFIG.ENERGY_REGEN_RATE);
    state.lastEnergyTick = Date.now();
    saveEnergy();
    updateEnergyUI();
  }
}, 1000);

const clickerBtn = document.getElementById('clickerBtn');
let activeFloats = 0;
clickerBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  initAudio();
  if (state.energy < 1) {
    playEmptySound();
    showToast('⚠️ Нет энергии!');
    triggerHaptic('heavy');
    return;
  }
  state.energy -= 1;
  saveEnergy();
  updateEnergyUI();
  let multiplier = 1;
  if (state.equippedPet === 'pet_griffin') multiplier = 1.5;
  if (state.equippedPet === 'pet_dragon') multiplier = 2.0;
  if (state.equippedPet === 'pet_phoenix') multiplier = 4.0;
  const earned = Math.floor(state.clickPower * multiplier);
  state.gold += earned;
  document.getElementById('goldVal').textContent = state.gold.toLocaleString('ru-RU');
  localStorage.setItem('gold_empire_gold', state.gold);
  playClickSound();
  triggerHaptic('medium');
  const clientX = e.clientX || window.innerWidth / 2;
  const clientY = e.clientY || window.innerHeight / 2;
  if (activeFloats < CONFIG.MAX_FLOATS) spawnClickText(clientX, clientY, earned);
  spawnParticles(clientX, clientY);
  const area = document.getElementById('clickerArea');
  area.classList.remove('shake');
  void area.offsetWidth;
  area.classList.add('shake');
});

function spawnClickText(x, y, amount) {
  activeFloats++;
  const float = document.createElement('div');
  float.className = 'click-float';
  float.textContent = `+${amount}`;
  float.style.left = `${x - 10}px`;
  float.style.top = `${y - 15}px`;
  document.body.appendChild(float);
  setTimeout(() => { float.remove(); activeFloats--; }, 600);
}

function renderShop(filter = 'all') {
  const grid = document.getElementById('shopGridContainer');
  if (!grid) return;
  grid.innerHTML = '';
  const filtered = PRODUCTS.filter(p => filter === 'all' || p.category === filter);
  filtered.forEach(p => {
    const item = document.createElement('div');
    item.className = `shop-item ${p.rarity}`;
    item.innerHTML = `
      <div class="shop-item-top">
        <span class="shop-item-badge" style="background:${p.badge === 'HOT' ? '#ef4444' : p.badge === 'NEW' ? '#10b981' : '#f59e0b'}">${p.badge}</span>
        <span style="font-size:8px; color:var(--text-muted); font-weight:bold; text-transform:uppercase;">${p.rarity}</span>
      </div>
      <div class="shop-item-icon">${p.icon}</div>
      <div class="shop-item-name">${p.name}</div>
      <div class="shop-item-desc">${p.desc}</div>
      <button class="shop-item-btn" data-product-id="${p.id}">КУПИТЬ ⭐ ${p.stars}</button>
    `;
    grid.appendChild(item);
  });
}

document.getElementById('shopGridContainer').addEventListener('click', (e) => {
  const btn = e.target.closest('.shop-item-btn');
  if (btn) openPurchaseModal(btn.dataset.productId);
});

document.querySelectorAll('.category-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    triggerHaptic('light');
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderShop(btn.getAttribute('data-category'));
  });
});

function renderInventory(filter = 'all') {
  const grid = document.getElementById('inventoryGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const owned = state.inventory;
  if (owned.length === 0) {
    grid.innerHTML = '<div class="empty-inventory"><div class="empty-icon">📦</div><div class="empty-text">Инвентарь пуст</div><div class="empty-hint">Купите товары во вкладке Stars</div></div>';
    return;
  }
  const items = filter === 'all' ? owned : owned.filter(i => i.category === filter);
  if (items.length === 0) {
    grid.innerHTML = '<div class="empty-inventory"><div class="empty-text">Нет предметов в этой категории</div></div>';
    return;
  }
  items.forEach(invItem => {
    const product = PRODUCTS.find(p => p.id === invItem.id);
    if (!product) return;
    const isEquipped = (product.category === 'pet' && state.equippedPet === invItem.id) ||
                       (product.category === 'skin' && state.equippedSkin === invItem.id);
    const el = document.createElement('div');
    el.className = `inv-item ${product.rarity} ${isEquipped ? 'equipped' : ''}`;
    el.innerHTML = `
      <div class="inv-icon">${product.icon}</div>
      <div class="inv-name">${product.name}</div>
      <div class="inv-desc">${product.desc}</div>
      <button class="inv-btn" data-item-id="${invItem.id}" data-category="${product.category}" ${isEquipped ? 'disabled' : ''}>
        ${isEquipped ? '✓ АКТИВНО' : (product.category === 'pet' || product.category === 'skin' ? 'ЭКИПИРОВАТЬ' : 'ИСПОЛЬЗОВАНО')}
      </button>
    `;
    grid.appendChild(el);
  });
}

document.getElementById('inventoryGrid').addEventListener('click', (e) => {
  const btn = e.target.closest('.inv-btn');
  if (!btn || btn.disabled) return;
  const itemId = btn.dataset.itemId;
  const category = btn.dataset.category;
  if (category === 'pet') {
    state.equippedPet = itemId;
    localStorage.setItem('gold_empire_pet', itemId);
    showToast('🐉 Питомец экипирован!');
    triggerHaptic('heavy');
  } else if (category === 'skin') {
    state.equippedSkin = itemId;
    localStorage.setItem('gold_empire_skin', itemId);
    showToast('👑 Скин активирован!');
    triggerHaptic('heavy');
  }
  renderInventory(document.querySelector('.inv-tab.active').dataset.invTab);
});

document.querySelectorAll('.inv-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    triggerHaptic('light');
    document.querySelectorAll('.inv-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderInventory(btn.dataset.invTab);
  });
});

let isProcessingPayment = false;

window.openPurchaseModal = function(productId) {
  const p = PRODUCTS.find(prod => prod.id === productId);
  if (!p) return;
  state.selectedProduct = p;
  document.getElementById('modalProductIcon').textContent = p.icon;
  document.getElementById('modalProductTitle').textContent = p.name;
  document.getElementById('modalProductBadge').textContent = p.badge;
  document.getElementById('modalProductDesc').textContent = p.desc;
  document.getElementById('modalProductPrice').textContent = p.stars;
  document.getElementById('purchaseModal').classList.add('active');
  triggerHaptic('medium');
};

document.getElementById('btnCancelPurchase').addEventListener('click', () => {
  document.getElementById('purchaseModal').classList.remove('active');
  triggerHaptic('light');
});

document.getElementById('btnConfirmPurchase').addEventListener('click', () => {
  initAudio();
  const p = state.selectedProduct;
  if (!p || isProcessingPayment) return;
  isProcessingPayment = true;
  const btn = document.getElementById('btnConfirmPurchase');
  btn.textContent = '⏳ Обработка...';
  btn.disabled = true;
  document.getElementById('purchaseModal').classList.remove('active');
  showToast(`⭐ Запускаем оплату: ${p.name}...`);
  fetch(`${CONFIG.API_URL}/create-invoice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: state.userId, product_id: p.id })
  })
  .then(res => { if (!res.ok) throw new Error('Ошибка'); return res.json(); })
  .then(data => {
    if (data && data.invoice_url) {
      tg.openInvoice(data.invoice_url, function(status) {
        isProcessingPayment = false;
        btn.textContent = `Оплатить ⭐ ${p.stars}`;
        btn.disabled = false;
        if (status === 'paid') {
          playPurchaseSound();
          triggerHaptic('heavy');
          showToast(`✅ Оплата успешна!`);
          if (p.category !== 'gold' && p.category !== 'premium') {
            if (!state.inventory.find(i => i.id === p.id)) {
              state.inventory.push({ id: p.id, category: p.category, purchasedAt: Date.now() });
              localStorage.setItem('gold_empire_inv', JSON.stringify(state.inventory));
            }
          }
          if (p.id === 'energy_full') {
            state.energy = CONFIG.MAX_ENERGY;
            saveEnergy();
            updateEnergyUI();
          }
          if (p.category === 'gold') {
            const goldAdded = p.id === 'gold_small' ? 1000 : p.id === 'gold_medium' ? 5500 : 25000;
            state.gold += goldAdded;
            document.getElementById('goldVal').textContent = state.gold.toLocaleString('ru-RU');
            localStorage.setItem('gold_empire_gold', state.gold);
          }
        } else if (status === 'cancelled') {
          showToast('❌ Оплата отменена.');
        } else {
          showToast('⚠️ Ошибка транзакции.');
        }
      });
    }
  })
  .catch(err => {
    console.error(err);
    isProcessingPayment = false;
    btn.textContent = `Оплатить ⭐ ${p.stars}`;
    btn.disabled = false;
    showToast('❌ Сетевой сбой.');
  });
});

function checkDailyReward() {
  const today = new Date().toDateString();
  const lastClaim = localStorage.getItem('gold_empire_daily');
  if (lastClaim !== today) {
    setTimeout(() => {
      document.getElementById('dailyModal').classList.add('active');
    }, 800);
  }
}

document.getElementById('btnClaimDaily').addEventListener('click', () => {
  initAudio();
  playPurchaseSound();
  triggerHaptic('heavy');
  state.gold += CONFIG.DAILY_REWARD_GOLD;
  document.getElementById('goldVal').textContent = state.gold.toLocaleString('ru-RU');
  localStorage.setItem('gold_empire_gold', state.gold);
  localStorage.setItem('gold_empire_daily', new Date().toDateString());
  document.getElementById('dailyModal').classList.remove('active');
  showToast(`🎁 +${CONFIG.DAILY_REWARD_GOLD} золота получено!`);
});

document.getElementById('goldVal').textContent = state.gold.toLocaleString('ru-RU');
document.getElementById('clickPowerVal').textContent = state.clickPower;
document.getElementById('usernameText').textContent = state.username;
energyTick();
updateEnergyUI();
initParticlesPool();
checkDailyReward();
