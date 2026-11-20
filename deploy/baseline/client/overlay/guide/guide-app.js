(function () {
  'use strict';

  const DATA = window.SEER_GUIDE_DATA;
  if (!DATA) {
    document.body.innerHTML = '<div style="padding:40px;color:#fff">数据文件 guide-data.js 未加载，请先运行 node scripts/build-guide-site.cjs</div>';
    return;
  }

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const petIconSet = new Set(DATA.assets?.pets || []);
  const mapImgSet = new Set(DATA.assets?.maps || []);

  function petAvatar(petId, name, extraCls = '') {
    const id = Number(petId);
    if (id && petIconSet.has(id)) {
      return `<span class="pet-avatar ${extraCls}"><img src="./img/pets/${id}.png" alt="${esc(name || '#' + id)}" loading="lazy"></span>`;
    }
    const ch = (name || '#').slice(0, 1);
    return `<span class="pet-avatar ${extraCls}"><span class="pet-avatar-fallback">${esc(ch)}</span></span>`;
  }

  function mapBanner(mapId, label) {
    const id = Number(mapId);
    if (!id || !mapImgSet.has(id)) return '';
    return `<div class="drawer-banner"><img src="./img/maps/${id}.jpg" alt="${esc(label || '地图 ' + id)}" loading="lazy"><span class="mech-thumb-badge">${esc(label || '')} · 地图 ${id}</span></div>`;
  }

  const state = {
    theme: localStorage.getItem('seer-guide-theme') || 'dark',
    bossTab: 'all',
    bossQuery: '',
    bossPage: 1,
    petTab: 'all',
    petQuery: '',
    petPage: 1,
    fusionTab: 'fixed',
    fusionQuery: '',
    hideDoneMiracles: false,
    mechTab: 'all',
    markTab: 'all',
    markQuery: '',
    refTab: 'features',
    matQuery: '',
    matrixAtk: 0,
    matrixDef: 0,
    drawerOpen: false,
    cmdOpen: false,
  };

  /* =========================================================================
   * 0.5 Account Sync & Local Collection Tracker
   * ========================================================================= */
  const OWNED_KEY = 'seer-guide-owned-v1';
  const UID_KEY = 'seer-guide-uid-v1';
  const ownedSet = new Set();
  const accountSync = {
    uid: Number(localStorage.getItem(UID_KEY) || 0) || 0,
    nick: '',
    synced: false,
    syncing: false,
    editingUid: false,
    error: '',
    unhatchedCount: 0,
    rogueTower: { currentFloor: 1, bestFloor: 0, buffs: [] },
    traitCrystals: 0,
    bountyClears: [],
  };
  const DEX_MILESTONES_UI = [
    { count: 50, title: '星际见习生', desc: '捕捉率+20%' },
    { count: 150, title: '精灵猎手', desc: '学习力×2' },
    { count: 300, title: '融合大师', desc: '满个体孵化30%' },
    { count: 500, title: '霸主克星', desc: '31霸主概率翻倍' },
    { count: 800, title: '星海霸主', desc: '豆/经验+30%' },
    { count: 1200, title: '全图鉴传奇', desc: '捕捉+40%/伤害+10%' },
  ];
  const BOUNTIES_UI = [
    { id: 'speed_3', name: '⚡ 闪电斩杀', desc: '3回合内胜Lv.60+BOSS' },
    { id: 'grass_win', name: '🌿 草木克星', desc: '草系胜阿克/纳多/里奥斯' },
    { id: 'solo_boss', name: '🔥 烈焰孤狼', desc: '无阵亡胜Lv.75+BOSS' },
    { id: 'full_hp', name: '🛡️ 铜墙铁壁', desc: 'HP≥95%胜任意BOSS' },
    { id: 'underdog', name: '🎯 以弱胜强', desc: '≤500种族胜Lv.70+BOSS' },
    { id: 'hamo_6', name: '💎 龙族试炼', desc: '6回合内胜哈莫雷特' },
    { id: 'leiyi_pure', name: '⚡ 雷神降临', desc: '无瞬杀胜雷伊' },
    { id: 'gaiya_clean', name: '🥊 战神无双', desc: '无阵亡胜盖亚' },
    { id: 'puni_pure', name: '👑 圣灵破壁', desc: '无瞬杀胜谱尼' },
    { id: 'rogue_10', name: '🌌 无尽征服者', desc: '无尽爬塔过第10层' },
  ];
  function renderProfileBanner() {
    let box = $('#account-profile-banner');
    if (!accountSync.synced) {
      if (box) box.remove();
      return;
    }
    if (!box) {
      const firstSection = $('#bosses');
      if (!firstSection || !firstSection.parentNode) return;
      box = document.createElement('section');
      box.id = 'account-profile-banner';
      box.className = 'section';
      box.style.paddingTop = '8px';
      box.style.paddingBottom = '8px';
      firstSection.parentNode.insertBefore(box, firstSection);
    }
    const cnt = ownedSet.size;
    let curTitle = '新手赛尔';
    let nextM = DEX_MILESTONES_UI[0];
    const unlockedHtml = DEX_MILESTONES_UI.map((m) => {
      const ok = cnt >= m.count;
      if (ok) {
        curTitle = m.title;
        nextM = DEX_MILESTONES_UI[DEX_MILESTONES_UI.indexOf(m) + 1] || null;
      }
      return `<span class="badge ${ok ? 'teal' : ''}" style="opacity:${ok ? '1' : '.45'}" title="${m.count}只解锁：${m.desc}">${ok ? '✓' : '🔒'} ${m.count}·${m.title}(${m.desc})</span>`;
    }).join(' ');
    const clearedSet = new Set(accountSync.bountyClears || []);
    const bountiesHtml = BOUNTIES_UI.map((b) => {
      const ok = clearedSet.has(b.id);
      return `<span class="badge ${ok ? 'gold' : ''}" style="opacity:${ok ? '1' : '.45'}" title="${esc(b.desc)}">${ok ? '🏅' : '○'} ${esc(b.name)}</span>`;
    }).join(' ');
    const rt = accountSync.rogueTower || { currentFloor: 1, bestFloor: 0, buffs: [] };
    box.innerHTML = `
      <div class="callout" style="border-color:rgba(99,102,241,.45)">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
          <div>
            <strong>✨ 星际养成档案 · ${esc(accountSync.nick || '#' + accountSync.uid)}</strong>
            <span class="badge indigo" style="margin-left:6px">${esc(curTitle)}</span>
            <span class="badge teal" style="margin-left:4px">图鉴 ${cnt} / ${DATA.pets.length}</span>
            <span class="badge gold" style="margin-left:4px">💎 特性晶石 ${accountSync.traitCrystals || 0}</span>
            <span class="badge pink" style="margin-left:4px">🌌 无尽爬塔 最高第 ${rt.bestFloor} 层（当前第 ${rt.currentFloor} 层）</span>
          </div>
          <span style="font-size:12px;color:var(--text-secondary)">${nextM ? `距下一光环「${nextM.title}」还差 ${Math.max(0, nextM.count - cnt)} 只` : '已解锁全部图鉴光环！'}</span>
        </div>
        <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;align-items:center">
          <strong style="font-size:12px;color:var(--text-secondary)">永久光环：</strong>${unlockedHtml}
        </div>
        <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;align-items:center">
          <strong style="font-size:12px;color:var(--text-secondary)">极限赏金 (${clearedSet.size}/${BOUNTIES_UI.length})：</strong>${bountiesHtml}
        </div>
        <div style="margin-top:8px;font-size:12px;color:var(--text-secondary)">
          <strong>🎮 游戏内入口：</strong>
          前往 <strong>精灵太空站（地图 102）</strong> 或 <strong>勇者之塔（地图 500）</strong> 点击场景内的发光传送门「星际试炼塔」，或点击游戏右上角「星际试炼」徽章，即可在图形面板中挑战无尽爬塔、3选1肉鸽词条、免费技能回忆与特性定向觉醒。
        </div>
      </div>`;
  }
  try {
    const rawOwned = JSON.parse(localStorage.getItem(OWNED_KEY) || '[]');
    if (Array.isArray(rawOwned)) rawOwned.forEach((id) => { if (Number(id) > 0) ownedSet.add(Number(id)); });
  } catch {}
  function saveOwned() {
    try { localStorage.setItem(OWNED_KEY, JSON.stringify([...ownedSet].sort((a, b) => a - b))); } catch {}
  }
  function expandOwnedWithPreEvos(ids) {
    const expanded = new Set();
    const queue = [];
    for (const raw of ids) {
      const id = Number(raw);
      if (id > 0 && !expanded.has(id)) {
        expanded.add(id);
        queue.push(id);
      }
    }
    while (queue.length) {
      const cur = queue.shift();
      const pet = petMap.get(cur);
      if (!pet || !Array.isArray(pet.evolvesFrom)) continue;
      for (const prev of pet.evolvesFrom) {
        const pid = Number(prev && prev.id);
        if (pid > 0 && !expanded.has(pid)) {
          expanded.add(pid);
          queue.push(pid);
        }
      }
    }
    return expanded;
  }
  async function syncAccountProgress(uidInput, { silent = false } = {}) {
    const uid = Number(String(uidInput || '').trim());
    if (!Number.isInteger(uid) || uid <= 0) {
      if (!silent) {
        accountSync.error = '请输入有效的数字米米号';
        renderPetTabs();
      }
      return false;
    }
    if (!/^https?:$/i.test(window.location.protocol)) {
      if (!silent) {
        accountSync.error = '本地文件模式无法直连服务器，请通过游戏网页打开';
        renderPetTabs();
      }
      return false;
    }
    accountSync.syncing = true;
    accountSync.error = '';
    renderPetTabs();
    try {
      const res = await fetch(`/api/guide/account?uid=${encodeURIComponent(uid)}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        accountSync.syncing = false;
        accountSync.error = res.status === 404 ? `未找到米米号 ${uid}` : '同步失败，请稍后重试';
        renderPetTabs();
        return false;
      }
      const expanded = expandOwnedWithPreEvos(Array.isArray(data.ownedPetIds) ? data.ownedPetIds : []);
      ownedSet.clear();
      expanded.forEach((id) => ownedSet.add(id));
      saveOwned();
      accountSync.uid = Number(data.uid) || uid;
      accountSync.nick = String(data.nick || '');
      accountSync.synced = true;
      accountSync.syncing = false;
      accountSync.editingUid = false;
      accountSync.error = '';
      accountSync.unhatchedCount = Array.isArray(data.unhatchedPetIds) ? data.unhatchedPetIds.length : 0;
      accountSync.rogueTower = data.rogueTower || { currentFloor: 1, bestFloor: 0, buffs: [] };
      accountSync.traitCrystals = Number(data.traitCrystals || 0);
      accountSync.bountyClears = Array.isArray(data.bountyClears) ? data.bountyClears : [];
      try { localStorage.setItem(UID_KEY, String(accountSync.uid)); } catch {}
      renderProfileBanner();
      renderPetTabs();
      renderPets();
      renderFusion();
      return true;
    } catch {
      accountSync.syncing = false;
      if (!silent) accountSync.error = '无法连接账号服务';
      renderPetTabs();
      return false;
    }
  }
  function toggleOwned(petId) {
    const id = Number(petId);
    if (!id) return;
    if (ownedSet.has(id)) ownedSet.delete(id);
    else ownedSet.add(id);
    saveOwned();
    renderPetTabs();
    renderPets();
    renderFusion();
  }
  function exportOwned() {
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), owned: [...ownedSet].sort((a, b) => a - b) }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `seer-dex-progress-${ownedSet.size}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function importOwned() {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json,application/json';
    inp.onchange = () => {
      const f = inp.files?.[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result || '{}'));
          const arr = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.owned) ? parsed.owned : []);
          ownedSet.clear();
          arr.forEach((id) => { if (Number(id) > 0) ownedSet.add(Number(id)); });
          saveOwned();
          renderPetTabs();
          renderPets();
          renderFusion();
          alert(`已成功导入 ${ownedSet.size} 只精灵收集进度！`);
        } catch {
          alert('导入失败：JSON 格式无效。');
        }
      };
      reader.readAsText(f);
    };
    inp.click();
  }

  /* =========================================================================
   * 1. Theme Management (Dark Cosmic <-> Light Editorial)
   * ========================================================================= */
  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('seer-guide-theme', theme);
    $('#theme-icon').textContent = theme === 'dark' ? '☀' : '☾';
    $('#theme-label').textContent = theme === 'dark' ? '浅色' : '深色';
  }
  applyTheme(state.theme);
  $('#theme-toggle').addEventListener('click', () => {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  });

  /* =========================================================================
   * 2. Lusion-Style Smooth Inertia Scroll Engine
   * ========================================================================= */
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollState = {
    current: window.scrollY || 0,
    target: window.scrollY || 0,
    running: false,
    lastTime: performance.now(),
  };

  function maxScrollY() {
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }

  function isInnerScrollable(el, deltaY) {
    let node = el;
    while (node && node !== document.body && node !== document.documentElement) {
      const style = window.getComputedStyle(node);
      const oy = style.overflowY;
      if ((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight + 2) {
        if (deltaY < 0 && node.scrollTop > 0) return true;
        if (deltaY > 0 && node.scrollTop + node.clientHeight < node.scrollHeight - 1) return true;
      }
      node = node.parentElement;
    }
    return false;
  }

  function smoothScrollTo(y) {
    const clamped = Math.max(0, Math.min(maxScrollY(), y));
    if (reducedMotion) {
      window.scrollTo(0, clamped);
      return;
    }
    scrollState.target = clamped;
    if (!scrollState.running) {
      scrollState.current = window.scrollY;
      scrollState.lastTime = performance.now();
      scrollState.running = true;
      requestAnimationFrame(tickScroll);
    }
  }

  function tickScroll(now) {
    const dt = Math.min(0.05, (now - scrollState.lastTime) / 1000);
    scrollState.lastTime = now;
    const ease = 1 - Math.exp(-10.5 * dt);
    const diff = scrollState.target - scrollState.current;
    if (Math.abs(diff) < 0.4) {
      scrollState.current = scrollState.target;
      window.scrollTo(0, scrollState.current);
      scrollState.running = false;
      updateScrollChrome();
      return;
    }
    scrollState.current += diff * ease;
    window.scrollTo(0, scrollState.current);
    updateScrollChrome();
    requestAnimationFrame(tickScroll);
  }

  if (!reducedMotion && !('ontouchstart' in window)) {
    window.addEventListener(
      'wheel',
      (e) => {
        if (e.ctrlKey || state.drawerOpen || state.cmdOpen) return;
        if (isInnerScrollable(e.target, e.deltaY)) return;
        e.preventDefault();
        if (!scrollState.running) scrollState.current = scrollState.target = window.scrollY;
        const delta = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
        smoothScrollTo(scrollState.target + delta * 1.05);
      },
      { passive: false }
    );
  }

  window.addEventListener('scroll', () => {
    if (!scrollState.running) {
      scrollState.current = scrollState.target = window.scrollY;
    }
    updateScrollChrome();
  }, { passive: true });

  // Anchor smooth scroll
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"], [data-scroll-to]');
    if (!link) return;
    const targetSel = link.getAttribute('data-scroll-to') || link.getAttribute('href');
    if (!targetSel || targetSel === '#') return;
    const el = $(targetSel);
    if (!el) return;
    e.preventDefault();
    const top = targetSel === '#top' ? 0 : el.getBoundingClientRect().top + window.scrollY - 84;
    smoothScrollTo(top);
  });

  /* =========================================================================
   * 3. Scroll Progress + Morphing Liquid Nav Indicator + Reveal Observer
   * ========================================================================= */
  const progressBar = $('#scroll-progress');
  const navLinks = $$('#main-nav .nav-link');
  const navIndicator = $('#nav-indicator');
  const sections = navLinks.map((a) => $('#' + a.dataset.section)).filter(Boolean);

  function updateNavIndicator(activeLink) {
    if (!activeLink || !navIndicator) return;
    navIndicator.style.width = `${activeLink.offsetWidth}px`;
    navIndicator.style.transform = `translate3d(${activeLink.offsetLeft}px, 0, 0)`;
    navIndicator.style.opacity = '1';
  }

  function updateScrollChrome() {
    const maxY = maxScrollY();
    const pct = maxY > 0 ? Math.min(1, Math.max(0, window.scrollY / maxY)) : 0;
    progressBar.style.transform = `scaleX(${pct})`;

    let currentSec = sections[0]?.id || 'bosses';
    const probe = window.scrollY + 180;
    for (const sec of sections) {
      if (sec.offsetTop <= probe) currentSec = sec.id;
    }
    let activeEl = null;
    for (const a of navLinks) {
      const isAct = a.dataset.section === currentSec;
      a.classList.toggle('active', isAct);
      if (isAct) activeEl = a;
    }
    updateNavIndicator(activeEl);
  }

  window.addEventListener('resize', () => {
    const act = $('#main-nav .nav-link.active');
    updateNavIndicator(act);
  });
  requestAnimationFrame(() => updateScrollChrome());

  // Scroll Reveal Observer
  const revealObs = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObs.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.06, rootMargin: '0px 0px -40px 0px' }
  );
  $$('.reveal').forEach((el) => revealObs.observe(el));

  /* =========================================================================
   * 4. Interactive Fluid Nebula & Parallax Starfield Canvas
   * ========================================================================= */
  function initAmbientCanvas() {
    const canvas = $('#ambient-canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pointer = { x: 0.5, y: 0.35, tx: 0.5, ty: 0.35 };
    const stars = [];

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!stars.length) {
        for (let i = 0; i < 85; i++) {
          stars.push({
            x: Math.random(),
            y: Math.random(),
            r: 0.6 + Math.random() * 1.6,
            z: 0.2 + Math.random() * 0.8,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    }
    resize();
    window.addEventListener('resize', resize);

    const glowEl = $('#cursor-glow');
    let glowX = -400;
    let glowY = -400;
    let glowTX = -400;
    let glowTY = -400;

    window.addEventListener('pointermove', (e) => {
      pointer.tx = e.clientX / Math.max(1, w);
      pointer.ty = e.clientY / Math.max(1, h);
      glowTX = e.clientX;
      glowTY = e.clientY;
      if (glowEl.style.opacity !== '1') glowEl.style.opacity = '1';
    }, { passive: true });

    let t = 0;
    function render() {
      t += 0.0055;
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;
      glowX += (glowTX - glowX) * 0.1;
      glowY += (glowTY - glowY) * 0.1;
      glowEl.style.transform = `translate3d(${glowX - 220}px, ${glowY - 220}px, 0)`;

      ctx.clearRect(0, 0, w, h);
      const isDark = state.theme === 'dark';
      const sy = (window.scrollY || 0) * 0.00022;

      // Fluid aurora orbs
      const blobs = isDark
        ? [
            { x: 0.22 + Math.sin(t) * 0.08 + (pointer.x - 0.5) * 0.1, y: 0.24 + Math.cos(t * 0.8) * 0.06 - sy, r: Math.max(w, h) * 0.42, c: 'rgba(45, 212, 191, 0.11)' },
            { x: 0.78 + Math.cos(t * 0.9) * 0.08 - (pointer.x - 0.5) * 0.08, y: 0.38 + Math.sin(t * 0.7) * 0.08 - sy * 0.7, r: Math.max(w, h) * 0.46, c: 'rgba(129, 140, 248, 0.11)' },
            { x: 0.52 + Math.sin(t * 0.6) * 0.1, y: 0.82 + Math.cos(t * 0.5) * 0.07 - sy * 0.5, r: Math.max(w, h) * 0.38, c: 'rgba(244, 114, 182, 0.07)' },
          ]
        : [
            { x: 0.24 + Math.sin(t) * 0.07 + (pointer.x - 0.5) * 0.08, y: 0.22 + Math.cos(t * 0.8) * 0.05, r: Math.max(w, h) * 0.42, c: 'rgba(13, 148, 136, 0.08)' },
            { x: 0.76 + Math.cos(t * 0.9) * 0.07, y: 0.42 + Math.sin(t * 0.7) * 0.06, r: Math.max(w, h) * 0.44, c: 'rgba(79, 70, 229, 0.07)' },
          ];

      for (const b of blobs) {
        const bx = b.x * w;
        const by = ((b.y % 1.4) + 1.4) % 1.4 * h - h * 0.15;
        const grad = ctx.createRadialGradient(bx, by, 0, bx, by, b.r);
        grad.addColorStop(0, b.c);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(bx, by, b.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Parallax star motes
      for (const s of stars) {
        const px = ((s.x + (pointer.x - 0.5) * 0.03 * s.z + Math.sin(t + s.phase) * 0.003) % 1 + 1) % 1 * w;
        const py = ((s.y - sy * s.z * 0.9 + (pointer.y - 0.5) * 0.025 * s.z) % 1 + 1) % 1 * h;
        const alpha = (isDark ? 0.22 : 0.12) + Math.sin(t * 2 + s.phase) * 0.14;
        ctx.fillStyle = isDark ? `rgba(210, 235, 255, ${Math.max(0.05, alpha)})` : `rgba(30, 41, 59, ${Math.max(0.03, alpha)})`;
        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reducedMotion) requestAnimationFrame(render);
    }
    render();
  }
  initAmbientCanvas();

  /* =========================================================================
   * 5. Magnetic Buttons & Card Radial Spotlight
   * ========================================================================= */
  if (!reducedMotion) {
    document.addEventListener('pointermove', (e) => {
      const card = e.target.closest('.card');
      if (card) {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      }
    }, { passive: true });

    $$('.magnetic').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * 0.18;
        const dy = (e.clientY - (r.top + r.height / 2)) * 0.18;
        btn.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.transform = 'translate3d(0, 0, 0)';
      });
    });
  }

  /* =========================================================================
   * 6. Hero Stats & Footer Meta
   * ========================================================================= */
  const stats = DATA.meta.stats;
  $('[data-stat="bossCount"]').textContent = stats.bossCount;
  $('[data-stat="obtainablePets"]').textContent = stats.obtainablePets;
  $('[data-stat="fusionCount"]').textContent = stats.fixedFusions + stats.miracleFusions;
  $('[data-stat="countermarks"]').textContent = stats.countermarks;
  $('#footer-meta').textContent = `基线版本：${DATA.meta.version} · 生成于 ${DATA.meta.generatedAt.slice(0, 10)}`;

  /* =========================================================================
   * 7. Slide-Over Detail Drawer
   * ========================================================================= */
  const drawerBackdrop = $('#drawer-backdrop');
  const drawer = $('#detail-drawer');

  function openDrawer(kicker, title, sub, bodyHtml) {
    $('#drawer-kicker').textContent = kicker;
    $('#drawer-title').textContent = title;
    $('#drawer-sub').textContent = sub || '';
    $('#drawer-body').innerHTML = bodyHtml;
    $('#drawer-body').scrollTop = 0;
    drawerBackdrop.classList.add('open');
    drawer.classList.add('open');
    state.drawerOpen = true;
  }

  let demoRaf = 0;
  function stopDemo() {
    if (demoRaf) cancelAnimationFrame(demoRaf);
    demoRaf = 0;
  }

  function closeDrawer() {
    stopDemo();
    drawerBackdrop.classList.remove('open');
    drawer.classList.remove('open');
    state.drawerOpen = false;
  }

  $('#drawer-close').addEventListener('click', closeDrawer);
  drawerBackdrop.addEventListener('click', closeDrawer);

  function showBossDetail(b) {
    const blocks = [];
    const banner = mapBanner(b.mapId, b.mapName);
    if (banner) blocks.push(banner);
    blocks.push(`
      <div class="detail-block" style="display:flex;align-items:center;gap:14px">
        ${petAvatar(b.petId, b.name, 'pet-avatar-lg')}
        <div style="flex:1;min-width:0">
          <h4>核心机制与解法</h4>
          <div style="font-size:14.5px;line-height:1.8;color:var(--text)">${esc(b.hint || '常规首领战斗')}</div>
          ${b.comment && b.comment !== b.hint ? `<div style="margin-top:8px;font-size:12.5px;color:var(--text-secondary)">备注：${esc(b.comment)}</div>` : ''}
        </div>
      </div>
    `);

    if (b.category === 'puni') {
      const seal = DATA.puniSeals.find((s) => s.doorIndex === b.param2);
      if (seal && seal.trueFormLives) {
        blocks.push(`
          <div class="detail-block">
            <h4>谱尼真身 · 六命阶段</h4>
            <ol class="step-list">
              ${seal.trueFormLives.map((l) => `<li>第 ${l.lifeIndex} 命：体力 <strong>${l.hp.toLocaleString()}</strong>${l.autoHealThreshold ? `（低于 ${l.autoHealThreshold} 血自动回满）` : ''}</li>`).join('')}
            </ol>
          </div>
        `);
      }
    }
    if (b.category === 'alder' && b.param2 === 7) {
      blocks.push(`
        <div class="detail-block">
          <h4>奥尔德真身 · 五命阶段</h4>
          <ol class="step-list">
            ${DATA.alderConfig.trueForm.lives.map((l, i) => `<li>第 ${i + 1} 命：体力 <strong>${l.hp.toLocaleString()}</strong>${l.stealStats ? ' · 偷强化' : ''}${l.lifesteal ? ' · 吸血' : ''}${l.turnStatus ? ' · 每回合异常' : ''}${l.ppCostMultiplier ? ` · 耗PP×${l.ppCostMultiplier}` : ''}</li>`).join('')}
          </ol>
        </div>
      `);
    }

    blocks.push(`
      <div class="detail-block">
        <h4>基础参数与地点</h4>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          <span class="badge accent">地图：${esc(b.mapName)} (${b.mapId})</span>
          <span class="badge indigo">属性：${esc(b.typeName || '未知')}</span>
          <span class="badge">等级：Lv.${b.level}</span>
          ${b.hp ? `<span class="badge gold">体力：${b.hp.toLocaleString()}</span>` : ''}
          ${b.extraLives ? `<span class="badge pink">共 ${b.extraLives + 1} 条命</span>` : ''}
          ${b.signatureId ? `<span class="badge">规则ID：${esc(b.signatureId)}</span>` : ''}
        </div>
      </div>
    `);

    if (b.rewards.length || b.exclusiveMarks.length || b.genericDropPool) {
      blocks.push(`
        <div class="detail-block">
          <h4>首胜奖励与刻印掉落</h4>
          <ul class="step-list">
            ${b.rewards.map((r) => `<li>${esc(r)}</li>`).join('')}
            ${b.exclusiveMarks.map((m) => `<li><strong>专属技能刻印 (重复挑战 25%)</strong>：${esc(m.name)}（${esc(m.desc)}）</li>`).join('')}
            ${b.genericDropPool ? `<li><strong>通用刻印池</strong>：${esc(b.genericDropPool)}</li>` : ''}
          </ul>
        </div>
      `);
    }

    if (b.skills.length) {
      blocks.push(`
        <div class="detail-block">
          <h4>首领配招</h4>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${b.skills.map((sk) => `<span class="badge">${esc(sk)}</span>`).join('')}
          </div>
        </div>
      `);
    }

    openDrawer(b.subtitle, `${b.name} (#${b.petId})`, `${b.mapName} · 入口 ${b.key}`, blocks.join(''));
  }

  const petMap = new Map(DATA.pets.map((p) => [p.id, p]));

  function showPetDetail(p) {
    const statNames = ['体力', '攻击', '防御', '特攻', '特防', '速度'];
    const statRows = p.stats.map((val, i) => {
      const pct = Math.min(100, Math.round((val / 160) * 100));
      return `<div class="stat-bar-row"><span>${statNames[i]}</span><strong style="font-variant-numeric:tabular-nums">${val}</strong><div class="stat-bar-track"><div class="stat-bar-fill" style="width:${pct}%"></div></div></div>`;
    }).join('');

    const sourceKindLabel = {
      wild: ['野外捕捉', 'green'],
      boss: ['BOSS / SPT', 'gold'],
      fusion: ['融合获得', 'indigo'],
      mechanism: ['机关 / 变身', 'pink'],
      collect: ['收集奖励', 'accent'],
      arena: ['星系擂台', 'gold'],
      evolve: ['进化获得', ''],
      task: ['任务奖励', 'accent'],
      starter: ['初始三选一', 'green'],
    };

    const evoHtml = [];
    if (p.evolvesFrom.length) {
      evoHtml.push(`前置形态：${p.evolvesFrom.map((e) => `<button class="pill" data-open-pet="${e.id}" style="padding:3px 10px 3px 4px;font-size:12px;display:inline-flex;align-items:center;gap:6px">${petAvatar(e.id, e.name, 'pet-avatar-sm')}${esc(e.name)} (#${e.id})${e.lv ? ` Lv.${e.lv}` : ''}</button>`).join(' ')}`);
    }
    if (p.evolvesTo) {
      evoHtml.push(`进化形态：<button class="pill" data-open-pet="${p.evolvesTo.id}" style="padding:3px 10px 3px 4px;font-size:12px;display:inline-flex;align-items:center;gap:6px">${petAvatar(p.evolvesTo.id, p.evolvesTo.name, 'pet-avatar-sm')}${esc(p.evolvesTo.name)} (#${p.evolvesTo.id})${p.evolvesTo.lv ? ` Lv.${p.evolvesTo.lv}` : ''}</button>`);
    }

    const build = p.build;
    const buildHtml = build ? `
      <div class="detail-block">
        <h4>培养推荐 · ${esc(build.role)}${build.basedOn ? `（按终态 ${esc(build.basedOn)}）` : ''}</h4>
        <div style="display:flex;flex-direction:column;gap:10px;font-size:13px">
          <div>
            <span class="badge accent">学习力</span>
            <strong style="margin-left:6px">${esc(build.ev)}</strong>
            ${build.evAlt ? `<div style="color:var(--text-secondary);font-size:12px;margin-top:2px;padding-left:4px">备选：${esc(build.evAlt)}</div>` : ''}
          </div>
          <div>
            <span class="badge indigo">推荐性格</span>
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">
              ${build.natures.map((n) => `<span class="badge">${esc(n)}</span>`).join('')}
            </div>
          </div>
          <div>
            <span class="badge gold">推荐特性</span>
            <div style="display:flex;flex-direction:column;gap:4px;margin-top:6px">
              ${build.abilities.map((a) => `<div><strong>${esc(a.name)}</strong><span style="color:var(--text-secondary);margin-left:6px;font-size:12px">${esc(a.desc)}</span></div>`).join('')}
            </div>
          </div>
          <div>
            <span class="badge pink">推荐刻印</span>
            <div style="display:flex;flex-direction:column;gap:4px;margin-top:6px;color:var(--text-secondary)">
              ${build.marks.map((m) => `<div>• ${esc(m)}</div>`).join('')}
            </div>
          </div>
          ${build.topSkills && build.topSkills.length ? `
          <div>
            <span class="badge green">核心技能参考</span>
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">
              ${build.topSkills.map((sk) => `<span class="badge">${esc(sk)}</span>`).join('')}
            </div>
          </div>` : ''}
        </div>
      </div>
    ` : '';

    const html = `
      <div class="detail-block" style="display:flex;align-items:center;gap:16px">
        ${petAvatar(p.id, p.name, 'pet-avatar-lg')}
        <div>
          <div style="font-size:18px;font-weight:700">${esc(p.name)} <span style="font-size:13px;color:var(--text-muted)">#${p.id}</span></div>
          <div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:6px">
            <span class="badge indigo">${esc(p.typeName)}系</span>
            <span class="badge accent">种族总和 ${p.total}</span>
            <span class="badge">${p.sources.length} 条获取途径</span>
          </div>
        </div>
      </div>
      ${buildHtml}
      <div class="detail-block">
        <h4>获取途径 (${p.sources.length})</h4>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${p.sources.map((s) => {
            const [lbl, cls] = sourceKindLabel[s.kind] || [s.kind, ''];
            return `<div style="display:flex;flex-direction:column;gap:3px">
              <div><span class="badge ${cls}">${esc(lbl)}</span> <strong style="margin-left:6px">${esc(s.label)}</strong></div>
              <div style="font-size:13px;color:var(--text-secondary);padding-left:4px">${esc(s.detail)}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
      ${evoHtml.length ? `<div class="detail-block"><h4>进化链</h4><div style="display:flex;flex-direction:column;gap:8px;font-size:13px">${evoHtml.join('')}</div></div>` : ''}
      <div class="detail-block">
        <h4>种族值总和：${p.total}</h4>
        ${statRows}
      </div>
    `;
    openDrawer(`图鉴 #${p.id} · ${p.typeName}系`, p.name, `种族总和 ${p.total} · ${p.sources.length} 条获取途径`, html);
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-open-pet]');
    if (!btn) return;
    const p = petMap.get(Number(btn.dataset.openPet));
    if (p) showPetDetail(p);
  });

  function mountMechDemo(demo) {
    stopDemo();
    const svg = $('#demo-svg');
    const caption = $('#demo-caption-text');
    const toggleBtn = $('#demo-toggle');
    if (!svg || !demo || !demo.actions.length) return;
    const actions = demo.actions;
    const STEP_MS = 2200;
    let playing = true;
    let startTime = performance.now();
    let pausedAt = 0;

    function jumpTo(stepIdx) {
      startTime = performance.now() - stepIdx * STEP_MS;
      pausedAt = stepIdx * STEP_MS;
      drawFrame(stepIdx * STEP_MS + 10);
    }

    function drawFrame(elapsed) {
      const total = actions.length * STEP_MS;
      const t = ((elapsed % total) + total) % total;
      const idx = Math.floor(t / STEP_MS);
      const p = (t % STEP_MS) / STEP_MS; // 0..1 within current step
      const act = actions[idx];
      if (caption) caption.textContent = act.label;

      $$('[data-demo-step]').forEach((b) => b.classList.toggle('active', Number(b.dataset.demoStep) === idx));

      const parts = [];
      // Draw static numbered markers for all steps so player sees full sequence at a glance
      actions.forEach((a, i) => {
        const ax = a.type === 'drag' ? a.x2 : a.x;
        const ay = a.type === 'drag' ? a.y2 : a.y;
        const active = i === idx;
        if (a.type === 'drag') {
          parts.push(`<line x1="${a.x1}" y1="${a.y1}" x2="${a.x2}" y2="${a.y2}" stroke="${active ? '#fbbf24' : 'rgba(94,234,212,0.4)'}" stroke-width="${active ? 5 : 2.5}" stroke-dasharray="10 8" stroke-linecap="round"/>`);
          parts.push(`<circle cx="${a.x1}" cy="${a.y1}" r="${active ? 14 : 9}" fill="rgba(15,23,42,0.85)" stroke="#5eead4" stroke-width="2.5"/>`);
        } else if (i > 0 && actions[i - 1].type !== 'drag') {
          const prev = actions[i - 1];
          parts.push(`<line x1="${prev.x}" y1="${prev.y}" x2="${ax}" y2="${ay}" stroke="rgba(94,234,212,0.45)" stroke-width="3" stroke-dasharray="8 8"/>`);
        }
        parts.push(`<circle cx="${ax}" cy="${ay}" r="${active ? 22 : 16}" fill="${active ? 'rgba(251,191,36,0.95)' : 'rgba(15,23,42,0.82)'}" stroke="${active ? '#fff' : '#5eead4'}" stroke-width="3"/>`);
        parts.push(`<text x="${ax}" y="${ay + 6}" text-anchor="middle" font-size="${active ? 19 : 15}" font-weight="800" fill="${active ? '#07101c' : '#e2f4ff'}">${i + 1}</text>`);
      });

      // Animated action indicator (smooth ease-out-expo)
      const ease = 1 - Math.pow(1 - Math.min(1, p / 0.72), 3);
      if (act.type === 'drag') {
        const cx = act.x1 + (act.x2 - act.x1) * ease;
        const cy = act.y1 + (act.y2 - act.y1) * ease;
        parts.push(`<circle cx="${cx}" cy="${cy}" r="26" fill="rgba(251,191,36,0.28)" stroke="#fbbf24" stroke-width="3.5"/>`);
        parts.push(`<circle cx="${cx}" cy="${cy}" r="9" fill="#fff"/>`);
      } else if (act.type === 'shoot') {
        const r = 44 - 16 * ease;
        parts.push(`<circle cx="${act.x}" cy="${act.y}" r="${r}" fill="none" stroke="#fb7185" stroke-width="4"/>`);
        parts.push(`<line x1="${act.x - r - 12}" y1="${act.y}" x2="${act.x + r + 12}" y2="${act.y}" stroke="#fb7185" stroke-width="3"/>`);
        parts.push(`<line x1="${act.x}" y1="${act.y - r - 12}" x2="${act.x}" y2="${act.y + r + 12}" stroke="#fb7185" stroke-width="3"/>`);
        if (p > 0.55) {
          const blast = (p - 0.55) / 0.45;
          parts.push(`<circle cx="${act.x}" cy="${act.y}" r="${20 + blast * 42}" fill="none" stroke="#fbbf24" stroke-width="${5 * (1 - blast)}" opacity="${1 - blast}"/>`);
        }
      } else {
        // Click ripple
        const rip = p;
        parts.push(`<circle cx="${act.x}" cy="${act.y}" r="${20 + rip * 44}" fill="none" stroke="#5eead4" stroke-width="${4.5 * (1 - rip)}" opacity="${1 - rip}"/>`);
        parts.push(`<circle cx="${act.x}" cy="${act.y}" r="${18 + (rip * 0.6) * 32}" fill="none" stroke="#fbbf24" stroke-width="${3 * (1 - rip)}" opacity="${1 - rip}"/>`);
      }
      svg.innerHTML = parts.join('');
    }

    function loop(now) {
      if (playing) drawFrame(now - startTime);
      demoRaf = requestAnimationFrame(loop);
    }

    if (toggleBtn) {
      toggleBtn.onclick = () => {
        if (playing) {
          pausedAt = performance.now() - startTime;
          playing = false;
          toggleBtn.textContent = '▶ 继续演示';
        } else {
          startTime = performance.now() - pausedAt;
          playing = true;
          toggleBtn.textContent = '❚❚ 暂停';
        }
      };
    }
    $$('[data-demo-step]').forEach((b) => {
      b.onclick = () => jumpTo(Number(b.dataset.demoStep));
    });

    drawFrame(0);
    demoRaf = requestAnimationFrame(loop);
  }

  function showMechDetail(m) {
    stopDemo();
    const hasDemo = m.demo && mapImgSet.has(m.demo.mapId);
    const visualBlock = hasDemo
      ? `
        <div class="demo-stage">
          <img src="./img/maps/${m.demo.mapId}.jpg" alt="${esc(m.mapName)}">
          <svg class="demo-svg" id="demo-svg" viewBox="0 0 960 560" preserveAspectRatio="xMidYMid slice"></svg>
          <div class="demo-caption">
            <span id="demo-caption-text"></span>
            <span class="badge accent">静默演示</span>
          </div>
        </div>
        <div class="demo-controls">
          <button class="pill active" id="demo-toggle" type="button">❚❚ 暂停</button>
          ${m.demo.actions.map((a, i) => `<button class="pill" data-demo-step="${i}" type="button">步骤 ${i + 1}</button>`).join('')}
        </div>
      `
      : mapBanner(m.mapId, m.mapName);

    const html = `
      ${visualBlock}
      <div class="detail-block">
        <h4>机制概要</h4>
        <div style="font-size:14px;color:var(--text)">${esc(m.summary)}</div>
      </div>
      <div class="detail-block">
        <h4>操作步骤</h4>
        <ol class="step-list">${m.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
      </div>
      <div class="detail-block">
        <h4>产出与奖励</h4>
        <div style="display:flex;flex-wrap:wrap;gap:6px">${m.rewards.map((r) => `<span class="badge accent">${esc(r)}</span>`).join('')}</div>
      </div>
    `;
    openDrawer(m.tag, m.title, m.mapId ? `${m.mapName} (地图 ${m.mapId})` : m.mapName, html);
    if (hasDemo) mountMechDemo(m.demo);
  }

  /* =========================================================================
   * 8. Module 1: BOSS 招牌特性攻略
   * ========================================================================= */
  const BOSS_TABS = [
    ['all', '全部'],
    ['classic', '经典 SPT'],
    ['star', '星系霸主'],
    ['dark', '暗黑武斗场'],
    ['train_normal', '训练师·普通'],
    ['train_hero', '训练师·勇者'],
    ['puni', '谱尼九关'],
    ['alder', '奥尔德七试炼'],
    ['story', '剧情首领'],
  ];

  function renderBossTabs() {
    $('#boss-tabs').innerHTML = BOSS_TABS.map(([id, label]) => {
      const cnt = id === 'all' ? DATA.bosses.length : DATA.bosses.filter((b) => b.category === id).length;
      return `<button class="pill ${state.bossTab === id ? 'active' : ''}" data-boss-tab="${id}">${label} <span style="opacity:.65">${cnt}</span></button>`;
    }).join('');
  }

  function renderBosses() {
    const q = state.bossQuery.trim().toLowerCase();
    const list = DATA.bosses.filter((b) => {
      if (state.bossTab !== 'all' && b.category !== state.bossTab) return false;
      if (!q) return true;
      return `${b.name} ${b.subtitle} ${b.mapName} ${b.mapId} ${b.hint} ${b.typeName} ${b.signatureId}`.toLowerCase().includes(q);
    });
    const perPage = 18;
    const totalPages = Math.max(1, Math.ceil(list.length / perPage));
    state.bossPage = Math.min(state.bossPage, totalPages);
    const slice = list.slice((state.bossPage - 1) * perPage, state.bossPage * perPage);

    $('#boss-grid').innerHTML = slice.length
      ? slice.map((b) => `
        <article class="card" data-boss-key="${esc(b.key)}">
          <div class="card-top">
            <div class="card-head-row">
              ${petAvatar(b.petId, b.name)}
              <div style="min-width:0">
                <h3 class="card-title">${esc(b.name)}</h3>
                <div class="card-sub">${esc(b.subtitle)} · ${esc(b.mapName)}(${b.mapId})</div>
              </div>
            </div>
            <span class="badge indigo">${esc(b.typeName || 'BOSS')}</span>
          </div>
          <div class="card-body">${esc(b.hint || b.comment)}</div>
          <div class="card-footer">
            <span class="badge">Lv.${b.level}</span>
            ${b.hp ? `<span class="badge gold">HP ${b.hp.toLocaleString()}</span>` : ''}
            ${b.extraLives ? `<span class="badge pink">${b.extraLives + 1} 命</span>` : ''}
            ${b.exclusiveMarks.length ? `<span class="badge accent">掉专属刻印</span>` : ''}
          </div>
        </article>
      `).join('')
      : '<div style="grid-column:1/-1;padding:32px;text-align:center;color:var(--text-muted)">没有找到匹配的 BOSS</div>';

    $('#boss-pager').innerHTML = totalPages > 1
      ? `<button class="pill" data-boss-page="${Math.max(1, state.bossPage - 1)}" ${state.bossPage <= 1 ? 'disabled' : ''}>上一页</button>
         <span style="font-size:13px;color:var(--text-secondary)">第 ${state.bossPage} / ${totalPages} 页（共 ${list.length} 位）</span>
         <button class="pill" data-boss-page="${Math.min(totalPages, state.bossPage + 1)}" ${state.bossPage >= totalPages ? 'disabled' : ''}>下一页</button>`
      : '';
  }

  const bossByKey = new Map(DATA.bosses.map((b) => [b.key, b]));
  $('#boss-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-boss-tab]');
    if (!btn) return;
    state.bossTab = btn.dataset.bossTab;
    state.bossPage = 1;
    renderBossTabs();
    renderBosses();
  });
  $('#boss-search').addEventListener('input', (e) => {
    state.bossQuery = e.target.value;
    state.bossPage = 1;
    renderBosses();
  });
  $('#boss-pager').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-boss-page]');
    if (!btn) return;
    state.bossPage = Number(btn.dataset.bossPage);
    renderBosses();
  });
  $('#boss-grid').addEventListener('click', (e) => {
    const card = e.target.closest('[data-boss-key]');
    if (!card) return;
    const b = bossByKey.get(card.dataset.bossKey);
    if (b) showBossDetail(b);
  });

  /* =========================================================================
   * 9. Module 2: 精灵获取全检索
   * ========================================================================= */
  const PET_TABS = [
    ['all', '全部'],
    ['wild', '野外捕捉'],
    ['boss', 'BOSS / SPT'],
    ['fusion', '融合获得'],
    ['mechanism', '机关 / 变身'],
    ['collect', '收集 / 擂台'],
    ['evolve', '进化获得'],
    ['unowned', '未收集'],
    ['owned', '已收集 ✓'],
  ];

  function renderPetTabs() {
    const pct = DATA.pets.length ? ((ownedSet.size / DATA.pets.length) * 100).toFixed(1) : '0.0';
    const syncUi = accountSync.synced && !accountSync.editingUid
      ? `<span class="badge indigo" title="已同步服务器实时图鉴">👤 ${esc(accountSync.nick || '米米号 ' + accountSync.uid)} (#${accountSync.uid})${accountSync.unhatchedCount ? ` · ${accountSync.unhatchedCount}颗待孵` : ''}</span>
         <button class="pill" type="button" data-dex-action="refresh-sync" style="padding:4px 10px;font-size:12px" ${accountSync.syncing ? 'disabled' : ''}>${accountSync.syncing ? '同步中...' : '↻ 刷新同步'}</button>
         <button class="pill" type="button" data-dex-action="switch-uid" style="padding:4px 10px;font-size:12px">切换账号</button>`
      : `<form id="dex-sync-form" style="display:inline-flex;align-items:center;gap:6px">
           <input id="dex-uid-input" type="text" inputmode="numeric" placeholder="输入米米号同步账号" value="${accountSync.uid || ''}" style="width:152px;padding:4px 10px;border-radius:999px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;outline:none">
           <button class="pill active" type="submit" style="padding:4px 10px;font-size:12px" ${accountSync.syncing ? 'disabled' : ''}>${accountSync.syncing ? '同步中...' : '🔗 同步账号'}</button>
         </form>`;
    const errHtml = accountSync.error
      ? `<span class="badge pink" style="font-size:12px">${esc(accountSync.error)}</span>`
      : '';
    $('#pet-tabs').innerHTML =
      PET_TABS.map(([id, label]) => `<button class="pill ${state.petTab === id ? 'active' : ''}" data-pet-tab="${id}">${label}</button>`).join('') +
      `<span style="margin-left:auto;display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap">
        <span class="badge teal">收集进度 ${ownedSet.size} / ${DATA.pets.length} (${pct}%)</span>
        ${syncUi}
        ${errHtml}
        <button class="pill" type="button" data-dex-action="export" style="padding:4px 10px;font-size:12px">导出进度</button>
        <button class="pill" type="button" data-dex-action="import" style="padding:4px 10px;font-size:12px">导入进度</button>
      </span>`;
  }

  function renderPets() {
    const q = state.petQuery.trim().toLowerCase();
    const list = DATA.pets.filter((p) => {
      if (state.petTab === 'owned') {
        if (!ownedSet.has(p.id)) return false;
      } else if (state.petTab === 'unowned') {
        if (ownedSet.has(p.id)) return false;
      } else if (state.petTab !== 'all') {
        const matchKind = state.petTab === 'collect'
          ? p.sources.some((s) => s.kind === 'collect' || s.kind === 'arena' || s.kind === 'starter' || s.kind === 'task')
          : p.sources.some((s) => s.kind === state.petTab);
        if (!matchKind) return false;
      }
      if (!q) return true;
      const srcStr = p.sources.map((s) => `${s.label} ${s.detail}`).join(' ');
      return `${p.id} ${p.name} ${p.typeName} ${srcStr}`.toLowerCase().includes(q);
    });

    const perPage = 24;
    const totalPages = Math.max(1, Math.ceil(list.length / perPage));
    state.petPage = Math.min(state.petPage, totalPages);
    const slice = list.slice((state.petPage - 1) * perPage, state.petPage * perPage);

    $('#pet-grid').innerHTML = slice.length
      ? slice.map((p) => {
          const primary = p.sources[0];
          const isOwned = ownedSet.has(p.id);
          return `
            <article class="card" data-pet-id="${p.id}" style="${isOwned ? 'border-color:rgba(20,184,166,.55)' : ''}">
              <div class="card-top">
                <div class="card-head-row">
                  ${petAvatar(p.id, p.name)}
                  <div style="min-width:0">
                    <h3 class="card-title">${esc(p.name)}</h3>
                    <div class="card-sub">#${p.id} · ${esc(p.typeName)}系 · 种族 ${p.total}</div>
                  </div>
                </div>
                <button type="button" class="badge ${isOwned ? 'teal' : ''}" data-toggle-owned="${p.id}" style="cursor:pointer;border:1px solid var(--border)" title="点击标记/取消已收集">${isOwned ? '✓ 已收集' : '+ 标记'}</button>
              </div>
              <div class="card-body"><strong>${esc(primary.label)}</strong><br>${esc(primary.detail)}</div>
            </article>
          `;
        }).join('')
      : '<div style="grid-column:1/-1;padding:32px;text-align:center;color:var(--text-muted)">没有找到匹配的精灵</div>';

    $('#pet-pager').innerHTML = totalPages > 1
      ? `<button class="pill" data-pet-page="${Math.max(1, state.petPage - 1)}" ${state.petPage <= 1 ? 'disabled' : ''}>上一页</button>
         <span style="font-size:13px;color:var(--text-secondary)">第 ${state.petPage} / ${totalPages} 页（共 ${list.length} 只）</span>
         <button class="pill" data-pet-page="${Math.min(totalPages, state.petPage + 1)}" ${state.petPage >= totalPages ? 'disabled' : ''}>下一页</button>`
      : '';
  }

  $('#pet-tabs').addEventListener('click', (e) => {
    const act = e.target.closest('[data-dex-action]');
    if (act) {
      if (act.dataset.dexAction === 'export') exportOwned();
      else if (act.dataset.dexAction === 'import') importOwned();
      else if (act.dataset.dexAction === 'refresh-sync') syncAccountProgress(accountSync.uid);
      else if (act.dataset.dexAction === 'switch-uid') {
        accountSync.editingUid = true;
        accountSync.error = '';
        renderPetTabs();
        const inp = $('#dex-uid-input');
        if (inp) { inp.focus(); inp.select(); }
      }
      return;
    }
    const btn = e.target.closest('[data-pet-tab]');
    if (!btn) return;
    state.petTab = btn.dataset.petTab;
    state.petPage = 1;
    renderPetTabs();
    renderPets();
  });
  $('#pet-tabs').addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'dex-sync-form') {
      e.preventDefault();
      const inp = $('#dex-uid-input');
      syncAccountProgress(inp ? inp.value : '');
    }
  });
  $('#pet-search').addEventListener('input', (e) => {
    state.petQuery = e.target.value;
    state.petPage = 1;
    renderPets();
  });
  $('#pet-pager').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-pet-page]');
    if (!btn) return;
    state.petPage = Number(btn.dataset.petPage);
    renderPets();
  });
  $('#pet-grid').addEventListener('click', (e) => {
    const tgl = e.target.closest('[data-toggle-owned]');
    if (tgl) {
      e.stopPropagation();
      toggleOwned(tgl.dataset.toggleOwned);
      return;
    }
    const card = e.target.closest('[data-pet-id]');
    if (!card) return;
    const p = petMap.get(Number(card.dataset.petId));
    if (p) showPetDetail(p);
  });

  /* =========================================================================
   * 10. Module 3: 融合手册与元神珠吸收
   * ========================================================================= */
  const FUSION_TABS = [
    ['fixed', `固定配方 (${DATA.fusion.fixed.length})`],
    ['miracle', `奇迹融合 (${DATA.fusion.miracles.length})`],
    ['hatch', `元神珠吸收地图 (${DATA.fusion.hatchBeads.length})`],
  ];

  function renderFusionTabs() {
    $('#fusion-tabs').innerHTML = FUSION_TABS.map(([id, label]) => `<button class="pill ${state.fusionTab === id ? 'active' : ''}" data-fusion-tab="${id}">${label}</button>`).join('');
  }

  function renderFusion() {
    const q = state.fusionQuery.trim().toLowerCase();
    const root = $('#fusion-content');

    if (state.fusionTab === 'fixed') {
      const list = DATA.fusion.fixed.filter((r) => !q || `${r.mainName} ${r.subNames.join(' ')} ${r.petName} ${r.soulName} ${r.essenceName} ${r.rare?.petName || ''}`.toLowerCase().includes(q));
      root.innerHTML = `
        <div class="callout">
          <strong>固定配方本服优化（唯一亲本保护 · 25% 异变 + 3 发必出保底 · 免跑图高个体孵化）</strong><br>
          1. <strong>唯一亲本自动保护</strong>：使用三主宠（布布花/巴鲁斯/烈焰猩猩）、SPT 首胜孤品（林奇/伊洛花/上古炎兽）、依依或闪光尼尔参与融合时，<strong>原精灵不会被消耗删除，自动安全退回精灵仓库</strong>。<br>
          2. <strong>稀有异变 25% + 防脸黑硬保底</strong>：闪光艾斯菲亚(#313)与闪光格林/埃洛(#639)异变率提升至 <strong>25%</strong>；若已拥有普通产物且未拥有异变宠则<strong>第 2 发 100% 必出异变</strong>（常规最多连续 3 发 100% 必出异变）。<br>
          3. <strong>免跑图吸收 & 保底高个体</strong>：合成出的元神珠默认自带满能量，可直接去实验室分子转化仪赋形孵化；孵化精灵<strong>保底个体值 20~31（15% 概率直出 31 满个体）</strong>。
        </div>
        <div class="card-grid">${list.map((r) => `
        <article class="card" data-open-pet="${r.petId}">
          <div class="card-top">
            <div class="card-head-row">
              ${petAvatar(r.petId, r.petName)}
              <div style="min-width:0">
                <h3 class="card-title">${esc(r.petName)} <span style="font-size:12px;color:var(--text-muted)">#${r.petId}</span></h3>
                <div class="card-sub">${esc(r.soulName)} · 吸收点：${esc(r.absorbMaps.join(' / ') || '转化仪直接转化')}</div>
              </div>
            </div>
            <span class="badge indigo">固定 #${r.index}</span>
          </div>
          <div class="formula-flow">
            <span class="formula-node">${petAvatar(r.mainId, r.mainName, 'pet-avatar-sm')}${esc(r.mainName)}</span>
            <span class="formula-op">+</span>
            <span class="formula-node">${petAvatar(r.subIds[0], r.subNames[0], 'pet-avatar-sm')}${esc(r.subNames[0])}一族</span>
            <span class="formula-op">+</span>
            <span class="formula-node" style="padding-left:10px">${esc(r.essenceName)}</span>
          </div>
          <div class="card-footer">
            <span class="badge">副宠可用：${esc(r.subNames.join(' / '))}</span>
            ${r.rare ? `<span class="badge pink">${esc(r.rare.chance)} 异变 → ${esc(r.rare.petName)} (${esc(r.rare.soulName)})</span>` : ''}
          </div>
        </article>
      `).join('')}</div>`;
    } else if (state.fusionTab === 'miracle') {
      const donePools = DATA.fusion.miracles.filter((m) => m.pool.every((p) => ownedSet.has(p.petId))).length;
      const list = DATA.fusion.miracles.filter((m) => {
        if (state.hideDoneMiracles && m.pool.every((p) => ownedSet.has(p.petId))) return false;
        return !q || `${m.mainName} ${m.mainSource || ''} ${m.subTypeName} ${m.essenceName} ${m.pool.map((p) => p.petName).join(' ')}`.toLowerCase().includes(q);
      });
      root.innerHTML = `
        <div class="callout">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:6px">
            <strong>什么是奇迹融合？（76 组纯野怪主宠奖池 · 未拥有优先 + 隔 1 发必出新绝版硬保底）</strong>
            <span style="display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap">
              <span class="badge teal">奇迹池毕业 ${donePools} / ${DATA.fusion.miracles.length}</span>
              <button type="button" class="pill ${state.hideDoneMiracles ? 'active' : ''}" data-toggle-hide-done="1" style="padding:4px 10px;font-size:12px">${state.hideDoneMiracles ? '✓ 已隐藏毕业池' : '隐藏已集齐奖池'}</button>
            </span>
          </div>
          1. <strong>素材 100% 纯野怪</strong>：投入 <strong>指定野怪终态主宠</strong> + <strong>任意同系野怪副宠（或尼尔）</strong> + <strong>1 个对应材料 + 1000 赛尔豆</strong>，合成的元神珠<strong>默认满能量免跑图，直接去右侧分子转化仪即可赋形孵化</strong>（保底个体值 20~31、15% 直出 31 满个体）。<br>
          2. <strong>防脸黑出货硬保底</strong>：系统自动识别你背包、仓库与未孵化元神珠中已拥有的家族——奖池内<strong>尚未拥有的绝版精灵权重自动 ×4</strong>，绝不连续两发出同一只；且<strong>若上一发出了已拥有精灵，下一发（第 2 发）100% 强制只从尚未拥有的绝版精灵中产出</strong>（即使某池已全图鉴集齐，连续 N 发未出最低权重大奖也会 100% 触发硬保底必出大奖，绝不会合几十上百次不出！）。
        </div>
        <div class="card-grid">${list.map((m) => {
          const gotCnt = m.pool.filter((p) => ownedSet.has(p.petId)).length;
          const allDone = gotCnt === m.pool.length;
          return `
          <article class="card" style="cursor:default;${allDone ? 'border-color:rgba(20,184,166,.55)' : ''}">
            <div class="card-top">
              <div class="card-head-row">
                ${petAvatar(m.mainId, m.mainName)}
                <div style="min-width:0">
                  <h3 class="card-title">主宠：${esc(m.mainName)} <span style="font-size:12px;color:var(--text-muted)">#${m.mainId}</span></h3>
                  <div class="card-sub">主宠来源：${esc(m.mainSource || '野外可重复捕捉')}</div>
                  <div class="card-sub">产出 ${esc(m.soulName)} · 吸收点：${esc(m.absorbMaps.join(' / ') || '转化仪直接转化')}</div>
                </div>
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
                <span class="badge pink">奇迹 #${m.index}</span>
                <span class="badge ${allDone ? 'teal' : ''}">${allDone ? '✓ 已毕业' : `${gotCnt}/${m.pool.length}`}</span>
              </div>
            </div>
            <div class="formula-flow">
              <span class="formula-node">${petAvatar(m.mainId, m.mainName, 'pet-avatar-sm')}${esc(m.mainName)}</span>
              <span class="formula-op">+</span>
              <span class="formula-node" style="padding-left:10px">任意${esc(m.subTypeName)}系 / 尼尔</span>
              <span class="formula-op">+</span>
              <span class="formula-node" style="padding-left:10px">${esc(m.essenceName)}</span>
            </div>
            <div style="font-size:11.5px;color:var(--text-muted);margin:10px 0 6px;font-weight:600">▼ 转化随机开出以下 1 只（共 ${m.pool.length} 种，点左侧 ✓ 可打卡已拥有）：</div>
            <div class="card-footer" style="margin-top:0">
              ${m.pool.map((p) => {
                const owned = ownedSet.has(p.petId);
                return `<span class="badge ${owned ? 'teal' : (p.rate <= 13 ? 'gold' : '')}" data-open-pet="${p.petId}" style="cursor:pointer"><span data-toggle-owned="${p.petId}" title="标记已拥有" style="display:inline-block;padding:0 3px;opacity:${owned ? '1' : '.45'}">${owned ? '✓' : '○'}</span>${petAvatar(p.petId, p.petName, 'pet-avatar-sm')} ${esc(p.petName)} <strong>${p.rate}%</strong></span>`;
              }).join('')}
            </div>
          </article>`;
        }).join('')}</div>`;
    } else {
      const fb = DATA.fusion.beigeFallback;
      const list = DATA.fusion.hatchBeads.filter((b) => !q || `${b.name} ${b.id} ${b.steps.map((s) => `${s.mapName} ${s.mapId}`).join(' ')}`.toLowerCase().includes(q));
      root.innerHTML = `
        <div class="callout">
          <strong>通用兜底（米色元神珠）：</strong>任意最终形态主宠 + 可融合副宠，若不命中固定/奇迹配方，将产出 <strong>${esc(fb.soulName)}</strong>（吸收点：${esc(fb.absorbMaps.join(' / '))}），随机孵出：${fb.pets.map((p) => `<strong>${esc(p.name)}</strong>`).join('、')}。<br>
          <strong>吸收点定位说明：</strong>下方黄色发光方框直接按地图 SWF 内 <code>hatchTaskMC</code> 坐标精准标出吸收位置；点击卡片可放大查看。本服元神转化仪也支持直接满能量转化。
        </div>
        <div class="card-grid">${list.map((b) => {
          const first = b.steps[0];
          const hasImg = first && mapImgSet.has(first.mapId);
          const reticle = first && first.coord
            ? `<div class="hatch-reticle" style="left:${first.coord.pctX}%;top:${first.coord.pctY}%"></div>`
            : '';
          return `
          <article class="card mech-card" data-hatch-id="${b.id}">
            ${hasImg ? `<div class="mech-thumb"><img src="./img/maps/${first.mapId}.jpg" alt="${esc(first.mapName)}" loading="lazy">${reticle}<span class="mech-thumb-badge">${esc(first.mapName)} · 地图 ${first.mapId}</span></div>` : ''}
            <div class="mech-card-pad">
              <div class="card-top">
                <div>
                  <h3 class="card-title">${esc(b.name)}</h3>
                  <div class="card-sub">道具 ID #${b.id}${first?.coord ? ` · 坐标 (${first.coord.x}, ${first.coord.y})` : ''}</div>
                </div>
                <span class="badge gold">${b.steps.length} 处地点</span>
              </div>
              <div class="card-footer">
                ${b.steps.map((s) => `<span class="badge accent">${esc(s.mapName)}(${s.mapId})${s.times > 1 ? ` ×${s.times}次` : ''}</span>`).join('')}
              </div>
            </div>
          </article>
        `;
        }).join('')}</div>
      `;
    }
  }

  const hatchById = new Map(DATA.fusion.hatchBeads.map((b) => [b.id, b]));
  $('#fusion-content').addEventListener('click', (e) => {
    const hideBtn = e.target.closest('[data-toggle-hide-done]');
    if (hideBtn) {
      state.hideDoneMiracles = !state.hideDoneMiracles;
      renderFusion();
      return;
    }
    const tgl = e.target.closest('[data-toggle-owned]');
    if (tgl) {
      e.stopPropagation();
      toggleOwned(tgl.dataset.toggleOwned);
      return;
    }
    const card = e.target.closest('[data-hatch-id]');
    if (!card) return;
    const b = hatchById.get(Number(card.dataset.hatchId));
    if (!b) return;
    const related = DATA.fusion.fixed.filter((r) => r.soulId === b.id || r.rare?.soulId === b.id);
    const stepHtml = b.steps.map((s) => {
      const hasImg = mapImgSet.has(s.mapId);
      const reticle = s.coord ? `<div class="hatch-reticle" style="left:${s.coord.pctX}%;top:${s.coord.pctY}%"></div>` : '';
      return `
        <div class="detail-block">
          <h4>${esc(s.mapName)} (地图 ${s.mapId})${s.times > 1 ? ` · 吸收 ${s.times} 次` : ''}</h4>
          ${hasImg ? `<div class="drawer-banner" style="margin-bottom:10px"><img src="./img/maps/${s.mapId}.jpg" alt="${esc(s.mapName)}">${reticle}</div>` : ''}
          <div style="font-size:13px;color:var(--text-secondary)">${s.coord ? `精准位置坐标：<strong>(${s.coord.x}, ${s.coord.y})</strong>（已用黄框标出）` : '前往地图寻找场景发光吸收点交互'}</div>
          ${s.desc ? `<div style="margin-top:6px;font-size:12.5px;color:var(--text-muted)">${esc(s.desc)}</div>` : ''}
        </div>
      `;
    }).join('');
    const relHtml = related.length
      ? `<div class="detail-block"><h4>对应产出精灵 (${related.length})</h4><div style="display:flex;flex-wrap:wrap;gap:6px">${related.map((r) => `<span class="badge" data-open-pet="${r.petId}" style="cursor:pointer">${petAvatar(r.petId, r.petName, 'pet-avatar-sm')} ${esc(r.petName)}</span>`).join('')}</div></div>`
      : '';
    openDrawer(`元神珠 #${b.id}`, b.name, '黄框位置直接取自原版地图 SWF 内 hatchTaskMC 坐标', stepHtml + relHtml);
  });

  $('#fusion-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-fusion-tab]');
    if (!btn) return;
    state.fusionTab = btn.dataset.fusionTab;
    renderFusionTabs();
    renderFusion();
  });
  $('#fusion-search').addEventListener('input', (e) => {
    state.fusionQuery = e.target.value;
    renderFusion();
  });

  /* =========================================================================
   * 11. Module 4: 地图机关与特殊遭遇
   * ========================================================================= */
  const MECH_TABS = [
    ['all', '全部'],
    ['demo', '▶ 有动画演示'],
    ['terrain', '星球地形机关'],
    ['pet-puzzle', '稀有精灵机关'],
    ['boss-puzzle', 'BOSS 机关'],
    ['treasure', '密室与爬塔'],
    ['utility', '养成与便利'],
  ];

  function renderMechTabs() {
    $('#mech-tabs').innerHTML = MECH_TABS.map(([id, label]) => {
      const cnt = id === 'all' ? DATA.mechanisms.length : id === 'demo' ? DATA.mechanisms.filter((m) => !!m.demo).length : DATA.mechanisms.filter((m) => m.category === id).length;
      return `<button class="pill ${state.mechTab === id ? 'active' : ''}" data-mech-tab="${id}">${label} <span style="opacity:.65">${cnt}</span></button>`;
    }).join('');
  }

  function renderMechs() {
    const list = DATA.mechanisms.filter((m) => state.mechTab === 'all' || (state.mechTab === 'demo' ? !!m.demo : m.category === state.mechTab));
    $('#mech-grid').innerHTML = list.map((m) => {
      const hasImg = m.mapId && mapImgSet.has(m.mapId);
      return `
      <article class="card mech-card" data-mech-id="${esc(m.id)}">
        ${hasImg ? `<div class="mech-thumb"><img src="./img/maps/${m.mapId}.jpg" alt="${esc(m.mapName)}" loading="lazy"><span class="mech-thumb-badge">${esc(m.mapName)} · 地图 ${m.mapId}</span>${m.demo ? '<span class="mech-thumb-badge" style="left:auto;right:12px;background:rgba(251,191,36,0.92);color:#0b1220;border-color:#fde68a">▶ 动画演示</span>' : ''}</div>` : ''}
        <div class="mech-card-pad">
          <div class="card-top">
            <div>
              <h3 class="card-title">${esc(m.title)}</h3>
              <div class="card-sub">${m.mapId ? `${esc(m.mapName)} (地图 ${m.mapId})` : esc(m.mapName)}</div>
            </div>
            <span class="badge accent">${esc(m.tag)}</span>
          </div>
          <div class="card-body">${esc(m.summary)}</div>
          <div class="card-footer">
            ${m.demo ? '<span class="badge gold">▶ 动画演示</span>' : ''}
            ${m.rewards.slice(0, 3).map((r) => `<span class="badge">${esc(r)}</span>`).join('')}
          </div>
        </div>
      </article>
    `;
    }).join('');
  }

  const mechById = new Map(DATA.mechanisms.map((m) => [m.id, m]));
  $('#mech-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-mech-tab]');
    if (!btn) return;
    state.mechTab = btn.dataset.mechTab;
    renderMechTabs();
    renderMechs();
  });
  $('#mech-grid').addEventListener('click', (e) => {
    const card = e.target.closest('[data-mech-id]');
    if (!card) return;
    const m = mechById.get(card.dataset.mechId);
    if (m) showMechDetail(m);
  });

  /* =========================================================================
   * 12. Module 5: 精灵刻印图鉴与 BOSS 掉落
   * ========================================================================= */
  $('#mark-rules').innerHTML = `<strong>刻印掉落与生效规则：</strong><ul>${DATA.countermarks.dropRules.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>`;

  const MARK_TABS = [
    ['all', '全部 (87)'],
    ['ability', '能力刻印 (30)'],
    ['skill_boss', 'BOSS专属技能 (37)'],
    ['skill_type', '15系属性通用 (15)'],
    ['skill_base', '基础/三主宠 (5)'],
    ['shop', '赛尔豆兑换'],
    ['drop', 'BOSS 掉落'],
  ];

  function renderMarkTabs() {
    $('#mark-tabs').innerHTML = MARK_TABS.map(([id, label]) => `<button class="pill ${state.markTab === id ? 'active' : ''}" data-mark-tab="${id}">${label}</button>`).join('');
  }

  function renderMarks() {
    const q = state.markQuery.trim().toLowerCase();
    const list = DATA.countermarks.marks.filter((mk) => {
      if (state.markTab === 'ability' && mk.kind !== 'ability') return false;
      if (state.markTab === 'skill_boss' && !(mk.kind === 'skill' && mk.bossPetId)) return false;
      if (state.markTab === 'skill_type' && !(mk.kind === 'skill' && mk.skillType)) return false;
      if (state.markTab === 'skill_base' && !(mk.kind === 'skill' && !mk.bossPetId && !mk.skillType)) return false;
      if (state.markTab === 'shop' && !(mk.price > 0)) return false;
      if (state.markTab === 'drop' && mk.price > 0) return false;
      if (!q) return true;
      return `${mk.name} ${mk.description} ${mk.source} ${mk.bossPetName} ${mk.skillTypeName} ${mk.skillNames.join(' ')} ${mk.tierLabel}`.toLowerCase().includes(q);
    });

    const tierColor = { 微型: '', 小型: 'green', 中型: 'indigo', 大型: 'gold', 双属性: 'accent', 'BOSS专属': 'pink', 属性通用: 'indigo', '基础/主宠': 'green' };

    $('#mark-grid').innerHTML = list.length
      ? list.map((mk) => `
        <article class="card" style="cursor:default">
          <div class="card-top">
            <div class="card-head-row">
              ${mk.bossPetId ? petAvatar(mk.bossPetId, mk.bossPetName) : ''}
              <div style="min-width:0">
                <h3 class="card-title">${esc(mk.name)}</h3>
                <div class="card-sub">#${mk.id} · Lv.${mk.minLevel} 生效</div>
              </div>
            </div>
            <span class="badge ${tierColor[mk.tierLabel] || ''}">${esc(mk.tierLabel)}</span>
          </div>
          <div class="card-body" style="-webkit-line-clamp:4">${esc(mk.description)}</div>
          <div class="card-footer">
            ${mk.price > 0 ? `<span class="badge gold">${mk.price.toLocaleString()} 赛尔豆</span>` : `<span class="badge accent">${esc(mk.source)}</span>`}
            ${mk.bossPetName ? `<span class="badge pink">对应：${esc(mk.bossPetName)}</span>` : ''}
          </div>
        </article>
      `).join('')
      : '<div style="grid-column:1/-1;padding:32px;text-align:center;color:var(--text-muted)">没有找到匹配的刻印</div>';
  }

  $('#mark-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-mark-tab]');
    if (!btn) return;
    state.markTab = btn.dataset.markTab;
    renderMarkTabs();
    renderMarks();
  });
  $('#mark-search').addEventListener('input', (e) => {
    state.markQuery = e.target.value;
    renderMarks();
  });

  /* =========================================================================
   * 13. Module 6: 星系擂台与实用速查
   * ========================================================================= */
  const REF_TABS = [
    ['features', '✨ 本服特色玩法与保底'],
    ['arena', '星系擂台'],
    ['collect', '实验室收集奖励'],
    ['elements', '属性克制矩阵'],
    ['natures', '25 种性格表'],
    ['materials', '矿产与融合材料'],
  ];

  function renderRefTabs() {
    $('#ref-tabs').innerHTML = REF_TABS.map(([id, label]) => `<button class="pill ${state.refTab === id ? 'active' : ''}" data-ref-tab="${id}">${label}</button>`).join('');
  }

  function renderReference() {
    const root = $('#ref-content');

    if (state.refTab === 'features') {
      const rogueBuffs = [
        ['⚡ 疾风突袭', '我方伤害 +20%（可叠加）'],
        ['🛡️ 星际护盾', '受到伤害 -15%（可叠加）'],
        ['💚 生命源泉', '每回合末回复 12% 最大 HP'],
        ['🌟 吸血寄生', '造成伤害的 20% 转化为自身回复'],
        ['🔥 狂暴输出', 'HP 低于 50% 时伤害 +45%'],
        ['🚀 先声夺人', '前 2 回合我方伤害 +35%'],
        ['❄️ 铁壁反伤', '受击反弹 15% 伤害给对手'],
        ['💥 斩杀渴望', '对手 HP 低于 40% 时伤害 +35%'],
      ];
      root.innerHTML = `<div class="card-grid">
        <article class="card" style="cursor:default">
          <div class="card-top">
            <div>
              <h3 class="card-title">🌌 无尽星际爬塔（肉鸽模式）</h3>
              <div class="card-sub">入口：精灵太空站(102) / 勇者之塔(500) 发光传送门，或右上角「试炼」徽章</div>
            </div>
            <span class="badge indigo">原生图形面板</span>
          </div>
          <div style="font-size:13px;color:var(--text-secondary);margin:8px 0">
            由高阶终态精灵把守的无尽层数，每层通关奖励赛尔豆与<strong>特性晶石</strong>，并在面板弹出 <strong>3 选 1 肉鸽词条</strong>（可无限叠加，战败重置本轮并保留历史最高层）：
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">
            ${rogueBuffs.map(([n, d]) => `<span class="badge teal" title="${esc(d)}">${esc(n)}：${esc(d)}</span>`).join('')}
          </div>
        </article>

        <article class="card" style="cursor:default">
          <div class="card-top">
            <div>
              <h3 class="card-title">🏆 图鉴里程碑 · 6 档永久账号光环</h3>
              <div class="card-sub">按账号历史收集图鉴数自动激活，无需手动领取</div>
            </div>
            <span class="badge teal">收集反哺养成</span>
          </div>
          <ol class="step-list" style="font-size:12.5px;margin-top:8px">
            <li><strong>50 只（星际见习生）</strong>：野外捕捉率 +20%</li>
            <li><strong>150 只（精灵猎手）</strong>：战斗学习力获取 ×2</li>
            <li><strong>300 只（融合大师）</strong>：元神珠孵化 31 满个体概率 15% → <strong>30%</strong></li>
            <li><strong>500 只（霸主克星）</strong>：野外 31 满个体霸主概率翻倍（10% / 8 场保底）</li>
            <li><strong>800 只（星海霸主）</strong>：战斗赛尔豆与经验额外 +30%</li>
            <li><strong>1200 只（全图鉴传奇）</strong>：捕捉 +40%、满个体孵化 45%、全队 PVE 伤害 +10%</li>
          </ol>
        </article>

        <article class="card" style="cursor:default">
          <div class="card-top">
            <div>
              <h3 class="card-title">⚡ 野外 31 满个体霸主奇遇</h3>
              <div class="card-sub">常规 5%（15 场必出保底）｜500 图鉴后 10%（8 场必出保底）</div>
            </div>
            <span class="badge gold">极品胚子盲盒</span>
          </div>
          <div style="font-size:13px;color:var(--text-secondary);margin-top:8px;line-height:1.7">
            • 野外刷怪进战首回合战报会弹出醒目提示<strong>「⚡ 遭遇 31 满个体霸主野怪」</strong>。<br>
            • 霸主血量略厚（1.35×，方便控血捕捉），成功捕获后自动强化为：<strong>31 满个体 + 智能匹配物/特攻极品性格（固执/开朗或保守/胆小）+ 先天特性</strong>。
          </div>
        </article>

        <article class="card" style="cursor:default">
          <div class="card-top">
            <div>
              <h3 class="card-title">🧬 免费技能回忆 &amp; 特性定向觉醒</h3>
              <div class="card-sub">在「星际试炼中心」面板 Tab 2 / Tab 3 一键操作</div>
            </div>
            <span class="badge pink">告别看脸</span>
          </div>
          <div style="font-size:13px;color:var(--text-secondary);margin-top:8px;line-height:1.7">
            • <strong>免费技能回忆</strong>：自动列出背包首发精灵<strong>全进化链</strong>所有历史技能，点击 <code>[装入1~4]</code> 免费替换，不再怕升级漏学关键技能。<br>
            • <strong>特性定向觉醒</strong>：击败 Lv.60+ BOSS（+2）、无尽爬塔、极限赏金均可获得<strong>特性晶石</strong>；花费 <strong>5 颗晶石</strong>即可在全部特性中 100% 定向赋予（如瞬杀、会心、坚硬、高热、精神等）。
          </div>
        </article>

        <article class="card" style="cursor:default">
          <div class="card-top">
            <div>
              <h3 class="card-title">⚔️ 经典 BOSS · 10 大极限赏金挑战</h3>
              <div class="card-sub">击败对应 BOSS 自动检测发奖（10~25 特性晶石 + 3000~10000 赛尔豆）</div>
            </div>
            <span class="badge gold">策略勋章</span>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">
            ${BOUNTIES_UI.map((b) => `<span class="badge" title="${esc(b.desc)}">${esc(b.name)}：${esc(b.desc)}</span>`).join('')}
          </div>
        </article>

        <article class="card" style="cursor:default">
          <div class="card-top">
            <div>
              <h3 class="card-title">🛡️ 全链路防脸黑硬保底 &amp; 体验减负</h3>
              <div class="card-sub">1501 全图鉴 100% 可获取 · 零绝版死档</div>
            </div>
            <span class="badge accent">全服生效</span>
          </div>
          <ul class="step-list" style="font-size:12.5px;margin-top:8px">
            <li><strong>奇迹融合 76 组纯野怪池</strong>：未拥有绝版权重 ×4，<strong>隔 1 发 100% 必出未拥有精灵</strong>；固定融合稀有异变 25% 且最多 2~3 发必出；唯一亲本（三主宠/SPT孤品等）融合自动保护退回仓库不消失。</li>
            <li><strong>野外稀有 &amp; 变身保底</strong>：同图稀有野怪刷出与变身遭遇均为<strong>连续 9 次未出、第 10 次 100% 必出</strong>；深海漩涡救援隔 1 次必出未拥有精灵。</li>
            <li><strong>BOSS 掉落保底</strong>：高阶 SPT 8 种超进化道具<strong>最多 2 次必掉</strong>；专属技能刻印最多 3 次、通用高阶刻印最多 4 次必掉。</li>
            <li><strong>养成与操作减负</strong>：元神珠免跑图吸收直接孵化且保底 20~31 个体；战斗 3× 赛尔豆 / 2× 经验 / 50% 自动存入经验分配器；BOSS 开战首回合战报推送机制简报；<strong>剧情动画与 NPC 对话支持右上角一键跳过（或按 Space/Esc）</strong>。</li>
          </ul>
        </article>
      </div>`;
    } else if (state.refTab === 'arena') {
      root.innerHTML = `<div class="card-grid">${DATA.starArenas.map((a) => `
        <article class="card" style="cursor:default">
          <div class="card-top">
            <div class="card-head-row">
              ${petAvatar(a.rewardPetId, a.rewardPetName)}
              <div style="min-width:0">
                <h3 class="card-title">${esc(a.name)}</h3>
                <div class="card-sub">入口：${esc(a.entryMapName)}(${a.entryMapId}) → 擂台地图 ${a.mapId}</div>
              </div>
            </div>
            <span class="badge gold">冠军：${esc(a.rewardPetName)}</span>
          </div>
          <div style="font-size:13px;color:var(--text-secondary);margin:8px 0">
            冠军奖励：<strong>Lv.100 满个体 ${esc(a.rewardPetName)}</strong>（配招：${esc(a.rewardSkills.join(' / '))}）
          </div>
          <ol class="step-list" style="font-size:12.5px">
            ${a.trainers.map((t) => `<li><strong>${esc(t.name)} · ${esc(t.title)}</strong>：${esc(t.team.join('、'))}</li>`).join('')}
          </ol>
        </article>
      `).join('')}</div>`;
    } else if (state.refTab === 'collect') {
      root.innerHTML = `<div class="card-grid">${DATA.collectGroups.map((g) => `
        <article class="card" style="cursor:default">
          <div class="card-top">
            <div>
              <h3 class="card-title">${esc(g.title)}</h3>
              <div class="card-sub">${esc(g.condition)}</div>
            </div>
            <span class="badge accent">组 #${g.id}</span>
          </div>
          <div class="card-footer">
            ${g.rewards.map((r) => `<span class="badge gold" data-open-pet="${r.id}" style="cursor:pointer">奖励：${esc(r.name)}</span>`).join('')}
          </div>
          ${g.families.length ? `<div style="margin-top:10px;font-size:12.5px;color:var(--text-secondary)">所需家族：${esc(g.families.join('；'))}</div>` : ''}
        </article>
      `).join('')}</div>`;
    } else if (state.refTab === 'elements') {
      const types = DATA.elements.types;
      const eff = DATA.elements.effectiveness;
      root.innerHTML = `
        <div class="callout">点击下方表头任意<strong>攻击方（行）</strong>或<strong>防御方（列）</strong>可高亮对应克制关系。<span class="badge green">2× 克制</span> <span class="badge pink">0.5× 微弱</span> <span class="badge">0× 无效</span></div>
        <div class="table-wrap">
          <table class="matrix-table">
            <thead>
              <tr>
                <th>攻 \ 防</th>
                ${types.map((t) => `<th style="cursor:pointer" data-mdef="${t.id}" class="${state.matrixDef === t.id ? 'matrix-hl' : ''}">${esc(t.name)}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${types.map((atk) => `
                <tr>
                  <th style="cursor:pointer" data-matk="${atk.id}" class="${state.matrixAtk === atk.id ? 'matrix-hl' : ''}">${esc(atk.name)}</th>
                  ${types.map((def) => {
                    const v = eff[atk.id]?.[def.id];
                    const hl = state.matrixAtk === atk.id || state.matrixDef === def.id ? 'matrix-hl' : '';
                    if (v === 2) return `<td class="matrix-cell-2 ${hl}">2</td>`;
                    if (v === 0.5) return `<td class="matrix-cell-half ${hl}">½</td>`;
                    if (v === 0) return `<td class="matrix-cell-0 ${hl}">0</td>`;
                    return `<td class="${hl}" style="color:var(--text-muted)">·</td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (state.refTab === 'natures') {
      root.innerHTML = `
        <div class="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>性格</th><th>分类</th><th>属性修正（+10% / -10%）</th></tr></thead>
            <tbody>
              ${DATA.natures.map((n) => `<tr><td style="font-family:var(--font-mono)">${n.id}</td><td><strong>${esc(n.name)}</strong></td><td><span class="badge">${esc(n.category)}</span></td><td>${esc(n.desc)}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else {
      const q = state.matQuery.trim().toLowerCase();
      const mines = DATA.miningSites.filter((x) => !q || `${x.itemName} ${x.mapName} ${x.tool}`.toLowerCase().includes(q));
      const drops = DATA.materialDrops.filter((x) => !q || `${x.itemName} ${x.mapName} ${x.petName}`.toLowerCase().includes(q));
      const bdrops = DATA.materialBossDrops.filter((x) => !q || `${x.itemName} ${x.mapName} ${x.petName}`.toLowerCase().includes(q));
      root.innerHTML = `
        <div class="toolbar">
          <div style="font-size:13.5px;color:var(--text-secondary)">自然矿产采集无每日上限；融合精华野怪/BOSS 掉率均为 45%。</div>
          <div class="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input id="mat-search" type="search" value="${esc(state.matQuery)}" placeholder="搜索材料名、矿石、地图或野怪…">
          </div>
        </div>
        <h3 style="margin:18px 0 10px;font-size:16px">融合精华 · 野外与首领刷取</h3>
        <div class="table-wrap" style="margin-bottom:22px">
          <table>
            <thead><tr><th>融合材料</th><th>刷取地图</th><th>目标精灵</th><th>掉率</th></tr></thead>
            <tbody>
              ${drops.map((d) => `<tr><td><strong>${esc(d.itemName)}</strong></td><td>${esc(d.mapName)} (${d.mapId})</td><td>${esc(d.petName)} (#${d.petId})</td><td><span class="badge green">${d.rate}</span></td></tr>`).join('')}
              ${bdrops.map((d) => `<tr><td><strong>${esc(d.itemName)}</strong></td><td>${esc(d.mapName)} (${d.mapId})</td><td><span class="badge gold">BOSS</span> ${esc(d.petName)}</td><td><span class="badge green">${d.rate}</span></td></tr>`).join('')}
            </tbody>
          </table>
        </div>
        <h3 style="margin:18px 0 10px;font-size:16px">星球矿产与自然采集点</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>矿产 / 材料</th><th>地图</th><th>采集方式 / 工具</th><th>单次产量</th></tr></thead>
            <tbody>
              ${mines.map((m) => `<tr><td><strong>${esc(m.itemName)}</strong></td><td>${esc(m.mapName)} (${m.mapId})</td><td>${esc(m.tool)}</td><td>×${m.count}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      `;
      const matInput = $('#mat-search');
      if (matInput) {
        matInput.addEventListener('input', (e) => {
          state.matQuery = e.target.value;
          renderReference();
          const el = $('#mat-search');
          if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
        });
      }
    }
  }

  $('#ref-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-ref-tab]');
    if (!btn) return;
    state.refTab = btn.dataset.refTab;
    renderRefTabs();
    renderReference();
  });
  $('#ref-content').addEventListener('click', (e) => {
    const atk = e.target.closest('[data-matk]');
    const def = e.target.closest('[data-mdef]');
    if (atk) {
      const id = Number(atk.dataset.matk);
      state.matrixAtk = state.matrixAtk === id ? 0 : id;
      renderReference();
    } else if (def) {
      const id = Number(def.dataset.mdef);
      state.matrixDef = state.matrixDef === id ? 0 : id;
      renderReference();
    }
  });

  /* =========================================================================
   * 14. Global Cmd+K Command Palette
   * ========================================================================= */
  const cmdModal = $('#cmd-modal');
  const cmdInput = $('#cmd-input');
  const cmdResults = $('#cmd-results');

  function openCmd() {
    cmdModal.classList.add('open');
    state.cmdOpen = true;
    cmdInput.value = '';
    renderCmdResults('');
    setTimeout(() => cmdInput.focus(), 40);
  }
  function closeCmd() {
    cmdModal.classList.remove('open');
    state.cmdOpen = false;
  }

  function renderCmdResults(raw) {
    const q = raw.trim().toLowerCase();
    const hits = [];
    if (!q) {
      hits.push(
        { type: 'boss', tag: 'BOSS', title: '雷伊 · 蓄雷机制', sub: '赫尔卡星荒地 (32)', action: () => showBossDetail(bossByKey.get('32/0')) },
        { type: 'boss', tag: 'BOSS', title: '谱尼真身 · 六命机制', sub: '勇者之塔/圣殿 (514)', action: () => showBossDetail(bossByKey.get('514/8')) },
        { type: 'mech', tag: '机关', title: '尼尔 · 8% 野外变身遭遇', sub: '14 种常见宿主野怪', action: () => showMechDetail(mechById.get('neil-disguise')) },
        { type: 'mech', tag: '机关', title: '实验室初始精灵补领机制', sub: '实验室 (5) 左上角柜子', action: () => showMechDetail(mechById.get('starter-reclaim')) }
      );
    } else {
      for (const b of DATA.bosses) {
        if (`${b.name} ${b.subtitle} ${b.mapName} ${b.hint}`.toLowerCase().includes(q)) {
          hits.push({ tag: 'BOSS', title: `${b.name} · ${b.subtitle}`, sub: `${b.mapName}(${b.mapId}) · Lv.${b.level}`, action: () => showBossDetail(b) });
          if (hits.length >= 24) break;
        }
      }
      for (const p of DATA.pets) {
        if (`${p.id} ${p.name} ${p.typeName}`.toLowerCase().includes(q)) {
          hits.push({ tag: '精灵', title: `${p.name} (#${p.id})`, sub: `${p.typeName}系 · ${p.sources[0]?.label || ''}`, action: () => showPetDetail(p) });
          if (hits.length >= 36) break;
        }
      }
      for (const m of DATA.mechanisms) {
        if (`${m.title} ${m.mapName} ${m.summary}`.toLowerCase().includes(q)) {
          hits.push({ tag: '机关', title: m.title, sub: m.mapName, action: () => showMechDetail(m) });
        }
      }
      for (const mk of DATA.countermarks.marks) {
        if (`${mk.name} ${mk.description} ${mk.bossPetName}`.toLowerCase().includes(q)) {
          hits.push({
            tag: '刻印',
            title: mk.name,
            sub: `${mk.description} · ${mk.source}`,
            action: () => {
              state.markTab = 'all';
              state.markQuery = mk.name;
              $('#mark-search').value = mk.name;
              renderMarkTabs();
              renderMarks();
              smoothScrollTo($('#countermarks').offsetTop - 84);
            },
          });
          if (hits.length >= 44) break;
        }
      }
    }

    cmdResults.innerHTML = hits.length
      ? hits.map((h, i) => `
        <div class="cmd-item" data-cmd-idx="${i}">
          <div>
            <div style="font-weight:600;font-size:14px">${esc(h.title)}</div>
            <div style="font-size:12px;color:var(--text-secondary)">${esc(h.sub)}</div>
          </div>
          <span class="badge accent">${esc(h.tag)}</span>
        </div>
      `).join('')
      : '<div style="padding:24px;text-align:center;color:var(--text-muted)">无匹配结果</div>';

    cmdResults._hits = hits;
  }

  $('#cmd-trigger').addEventListener('click', openCmd);
  cmdModal.addEventListener('click', (e) => {
    if (e.target === cmdModal) closeCmd();
    const item = e.target.closest('[data-cmd-idx]');
    if (item && cmdResults._hits) {
      const hit = cmdResults._hits[Number(item.dataset.cmdIdx)];
      closeCmd();
      if (hit && hit.action) hit.action();
    }
  });
  cmdInput.addEventListener('input', (e) => renderCmdResults(e.target.value));

  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (state.cmdOpen) closeCmd();
      else openCmd();
    } else if (e.key === 'Escape') {
      if (state.cmdOpen) closeCmd();
      else if (state.drawerOpen) closeDrawer();
    }
  });

  /* =========================================================================
   * 15. Initial Render & Current-Map Smart Locator (?map=<mapId>)
   * ========================================================================= */
  renderBossTabs();
  renderBosses();
  renderPetTabs();
  renderPets();
  renderFusionTabs();
  renderFusion();
  renderMechTabs();
  renderMechs();
  renderMarkTabs();
  renderMarks();
  renderRefTabs();
  renderReference();

  (function initAutoAccountSync() {
    const params = new URLSearchParams(window.location.search);
    const urlUid = Number(params.get('uid') || 0);
    const targetUid = urlUid > 0 ? urlUid : accountSync.uid;
    if (targetUid > 0 && /^https?:$/i.test(window.location.protocol)) {
      syncAccountProgress(targetUid, { silent: urlUid <= 0 });
    }
  })();

  (function initCurrentMapLocator() {
    const params = new URLSearchParams(window.location.search);
    const mapId = Number(params.get('map') || 0);
    if (!mapId) return;

    const mapBosses = DATA.bosses.filter((b) => b.mapId === mapId);
    const mapMechs = DATA.mechanisms.filter((m) => m.mapId === mapId || String(m.mapName || '').includes(String(mapId)));
    const mapWild = (DATA.wildMaps || []).find((w) => w.mapId === mapId);
    const mapBeads = DATA.fusion.hatchBeads.filter((b) => b.steps.some((s) => s.mapId === mapId));
    const mapArenas = (DATA.starArenas || []).filter((a) => a.mapId === mapId || a.entryMapId === mapId);
    const mapName =
      mapBosses[0]?.mapName ||
      mapMechs[0]?.mapName ||
      mapWild?.mapName ||
      mapBeads[0]?.steps.find((s) => s.mapId === mapId)?.mapName ||
      mapArenas[0]?.entryMapName ||
      `地图 ${mapId}`;

    const firstSection = $('#bosses');
    if (firstSection) {
      const banner = document.createElement('section');
      banner.className = 'section';
      banner.style.paddingTop = '12px';
      banner.style.paddingBottom = '8px';
      const rows = [];
      if (mapBosses.length) {
        rows.push(`<div style="margin-top:8px"><strong>⚔️ 本图 BOSS (${mapBosses.length})：</strong> ${mapBosses.map((b) => `<span class="badge indigo" data-open-boss="${esc(b.key)}" style="cursor:pointer;margin:2px">${petAvatar(b.petId, b.name, 'pet-avatar-sm')} ${esc(b.name)} Lv.${b.level}</span>`).join('')}</div>`);
      }
      if (mapMechs.length) {
        rows.push(`<div style="margin-top:8px"><strong>⚙️ 本图机关/特殊遭遇 (${mapMechs.length})：</strong> ${mapMechs.map((m) => `<span class="badge teal" data-open-mech="${esc(m.id)}" style="cursor:pointer;margin:2px">${esc(m.title)}</span>`).join('')}</div>`);
      }
      if (mapWild && mapWild.pets?.length) {
        rows.push(`<div style="margin-top:8px"><strong>🌿 本图野生精灵 (${mapWild.pets.length})：</strong> ${mapWild.pets.map((p) => `<span class="badge" data-open-pet="${p.petId}" style="cursor:pointer;margin:2px">${petAvatar(p.petId, p.petName, 'pet-avatar-sm')} ${esc(p.petName)} (${p.pct}%)</span>`).join('')}</div>`);
      }
      if (mapBeads.length) {
        rows.push(`<div style="margin-top:8px"><strong>🔮 本图可吸收元神珠：</strong> ${mapBeads.map((b) => `<span class="badge gold" style="margin:2px">${esc(b.name)}</span>`).join('')}</div>`);
      }
      if (mapArenas.length) {
        rows.push(`<div style="margin-top:8px"><strong>🏆 本图星系擂台：</strong> ${mapArenas.map((a) => `<span class="badge pink" data-open-pet="${a.rewardPetId}" style="cursor:pointer;margin:2px">${esc(a.name)}（冠军奖励：${esc(a.rewardPetName)}）</span>`).join('')}</div>`);
      }
      if (!rows.length) {
        rows.push(`<div style="margin-top:6px;color:var(--text-secondary)">当前地图暂无特殊 BOSS 或机关，可在下方检索全服 121 位 BOSS、1497 只精灵与 76 组奇迹融合。</div>`);
      }
      banner.innerHTML = `
        <div class="callout" style="border-color:var(--accent);background:var(--accent-soft)">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
            <div><strong>📍 当前游戏所在位置：${esc(mapName)}（地图 #${mapId}）实时攻略看板</strong></div>
            <button class="pill" type="button" id="close-map-locator" style="padding:4px 10px;font-size:12px">收起看板</button>
          </div>
          ${rows.join('')}
        </div>`;
      firstSection.parentNode.insertBefore(banner, firstSection);
      const closeBtn = banner.querySelector('#close-map-locator');
      if (closeBtn) closeBtn.addEventListener('click', () => banner.remove());
      banner.addEventListener('click', (e) => {
        const bossEl = e.target.closest('[data-open-boss]');
        const boss = bossEl && bossByKey.get(bossEl.dataset.openBoss);
        if (boss) return showBossDetail(boss);
        const mechEl = e.target.closest('[data-open-mech]');
        const mech = mechEl && mechById.get(mechEl.dataset.openMech);
        if (mech) showMechDetail(mech);
      });
    }

    if (mapBosses.length === 1 && mapMechs.length === 0) {
      showBossDetail(mapBosses[0]);
    } else if (mapMechs.length === 1 && mapBosses.length === 0) {
      showMechDetail(mapMechs[0]);
    } else if (mapBosses.length > 1) {
      state.bossTab = 'all';
      state.bossQuery = String(mapId);
      const bs = $('#boss-search');
      if (bs) bs.value = String(mapId);
      renderBossTabs();
      renderBosses();
    }
  })();
})();
