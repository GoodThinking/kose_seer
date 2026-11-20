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
    mechTab: 'all',
    markTab: 'all',
    markQuery: '',
    refTab: 'arena',
    matQuery: '',
    matrixAtk: 0,
    matrixDef: 0,
    drawerOpen: false,
    cmdOpen: false,
  };

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
  ];

  function renderPetTabs() {
    $('#pet-tabs').innerHTML = PET_TABS.map(([id, label]) => `<button class="pill ${state.petTab === id ? 'active' : ''}" data-pet-tab="${id}">${label}</button>`).join('');
  }

  function renderPets() {
    const q = state.petQuery.trim().toLowerCase();
    const list = DATA.pets.filter((p) => {
      if (state.petTab !== 'all') {
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
          return `
            <article class="card" data-pet-id="${p.id}">
              <div class="card-top">
                <div class="card-head-row">
                  ${petAvatar(p.id, p.name)}
                  <div style="min-width:0">
                    <h3 class="card-title">${esc(p.name)}</h3>
                    <div class="card-sub">#${p.id} · ${esc(p.typeName)}系 · 种族 ${p.total}</div>
                  </div>
                </div>
                <span class="badge accent">${p.sources.length} 途径</span>
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
    const btn = e.target.closest('[data-pet-tab]');
    if (!btn) return;
    state.petTab = btn.dataset.petTab;
    state.petPage = 1;
    renderPetTabs();
    renderPets();
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
      root.innerHTML = `<div class="card-grid">${list.map((r) => `
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
      const list = DATA.fusion.miracles.filter((m) => !q || `${m.mainName} ${m.subTypeName} ${m.essenceName} ${m.pool.map((p) => p.petName).join(' ')}`.toLowerCase().includes(q));
      root.innerHTML = `
        <div class="callout"><strong>奇迹融合规则：</strong>主宠必须为指定最终形态，副宠为对应属性任意精灵（或万能副宠<strong>尼尔/菲斯利/艾斯菲亚</strong>）+ 对应精华，按权重随机产出池内精灵。</div>
        <div class="card-grid">${list.map((m) => `
          <article class="card">
            <div class="card-top">
              <div class="card-head-row">
                ${petAvatar(m.mainId, m.mainName)}
                <div style="min-width:0">
                  <h3 class="card-title">${esc(m.mainName)} + ${esc(m.subTypeName)}系 / 尼尔</h3>
                  <div class="card-sub">${esc(m.soulName)} · 消耗 ${esc(m.essenceName)}</div>
                </div>
              </div>
              <span class="badge pink">奇迹 #${m.index}</span>
            </div>
            <div class="card-footer" style="margin-top:10px">
              ${m.pool.map((p) => `<span class="badge" data-open-pet="${p.petId}" style="cursor:pointer">${petAvatar(p.petId, p.petName, 'pet-avatar-sm')} ${esc(p.petName)} <strong>${p.rate}%</strong></span>`).join('')}
            </div>
          </article>
        `).join('')}</div>`;
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

    if (state.refTab === 'arena') {
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
   * 15. Initial Render
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
})();
