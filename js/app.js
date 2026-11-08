const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const won = (n) => n.toLocaleString('ko-KR') + '원';
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const BREAD = ['grain', 'loaf', 'rustic', 'salt', 'savory', 'sweet'];
const TAGS = ['통호밀100%', '무설탕', '통호밀', '견과', '치즈', '크림', '홀케이크'];
const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

// ---------- 스크롤 (Lenis) ----------
const lenis = window.Lenis ? new Lenis({ duration: 1.1, smoothWheel: true }) : null;
if (lenis) {
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  if (window.ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
}
function scrollToEl(el) {
  const y = el.getBoundingClientRect().top + window.scrollY - 80;
  lenis ? lenis.scrollTo(y) : window.scrollTo({ top: y, behavior: 'smooth' });
}
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const t = $(a.getAttribute('href'));
  if (!t) return;
  e.preventDefault();
  document.body.classList.remove('menu-open');
  a.getAttribute('href') === '#top' ? (lenis ? lenis.scrollTo(0) : scrollTo(0, 0)) : scrollToEl(t);
}));

// ---------- 네비 ----------
const nav = $('#nav');
addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 40), { passive: true });
$('#burger').addEventListener('click', () => document.body.classList.toggle('menu-open'));

// ---------- 히어로 슬라이더 (Swiper) ----------
new Swiper('.hero-swiper', {
  loop: true, speed: 900, effect: 'fade', fadeEffect: { crossFade: true },
  autoplay: { delay: 4500, disableOnInteraction: false },
  pagination: { el: '.hero-dots', clickable: true },
});

// ---------- 애니메이션 (GSAP) ----------
if (window.gsap && window.ScrollTrigger && !location.search.includes('static') && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  gsap.registerPlugin(ScrollTrigger);
  gsap.from('.hero-title span', { yPercent: 110, opacity: 0, duration: 1, stagger: .12, ease: 'expo.out', delay: .1 });
  gsap.from(['.hero .kicker', '.hero-sub', '.hero-cta'], { y: 24, opacity: 0, duration: .9, stagger: .1, ease: 'power3.out', delay: .45 });
  gsap.from('.hero-media', { scale: .94, opacity: 0, duration: 1.2, ease: 'expo.out' });
  gsap.from('.sticker', { scale: 0, rotate: -90, duration: 1, ease: 'back.out(1.7)', delay: .8 });
  $$('.reveal').forEach((el) => gsap.from(el, { y: 50, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));
  gsap.from('.feature-img img', { scale: 1.25, ease: 'none', scrollTrigger: { trigger: '.feature', start: 'top bottom', end: 'bottom top', scrub: true } });
  $$('[data-count]').forEach((el) => {
    const o = { v: 0 };
    gsap.to(o, { v: +el.dataset.count, duration: 1.6, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 85%' }, onUpdate: () => { el.textContent = Math.round(o.v); } });
  });
  gsap.from('.wordmark', { yPercent: 40, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
} else {
  $$('[data-count]').forEach((el) => { el.textContent = el.dataset.count; });
}

// ---------- 메뉴 ----------
const state = { cat: 'all', tags: new Set(), q: '', sort: 'default' };
const tone = (p) => 't' + (PRODUCTS.indexOf(p) % 4);
const thumb = (p, badge = false) => `<div class="thumb">${badge && p.tags.includes('베스트') ? '<span class="badge">BEST</span>' : ''}${
  p.img ? `<img src="${p.img}" alt="${p.name}" loading="lazy">` : `<div class="ph ${tone(p)}">${p.name}</div>`}</div>`;

// 카테고리 아이콘 (사진 있는 첫 상품)
$('#catIcons').innerHTML = Object.entries(CATEGORIES).map(([k, c]) => {
  const p = PRODUCTS.find((x) => x.cat === k && x.img);
  return `<button class="cat" data-jump="${k}"><span class="ci">${p ? `<img src="${p.img}" alt="" loading="lazy">` : ''}</span>${c.name.split(' · ')[0]}</button>`;
}).join('');
document.addEventListener('click', (e) => {
  const j = e.target.closest('[data-jump]');
  if (!j) return;
  state.cat = j.dataset.jump; render();
  scrollToEl($('#menu'));
});

function render() {
  const all = [['all', '전체', PRODUCTS.length], ...Object.entries(CATEGORIES).map(([k, c]) => [k, c.name, PRODUCTS.filter((p) => p.cat === k).length])];
  $('#tabs').innerHTML = all.map(([k, n, c]) => `<button data-cat="${k}" class="${state.cat === k ? 'on' : ''}">${n}<small>${c}</small></button>`).join('');
  $('#chips').innerHTML = TAGS.map((t) => `<button data-tag="${t}" class="${state.tags.has(t) ? 'on' : ''}">${t}</button>`).join('');
  const q = state.q.trim().toLowerCase();
  let list = PRODUCTS.filter((p) => (state.cat === 'all' || p.cat === state.cat)
    && [...state.tags].every((t) => p.tags.includes(t))
    && (!q || (p.name + p.desc).toLowerCase().includes(q)));
  const sorter = { best: (a, b) => b.tags.includes('베스트') - a.tags.includes('베스트'), low: (a, b) => a.price - b.price, high: (a, b) => b.price - a.price }[state.sort];
  if (sorter) list = [...list].sort(sorter);
  $('#count').textContent = `${list.length}개의 메뉴`;
  $('#grid').innerHTML = list.length ? list.map((p) => `
    <article class="card" data-id="${p.id}">
      ${thumb(p, true)}
      <div class="card-body">
        <h3>${p.name}</h3>
        <p>${p.desc}</p>
        <div class="card-foot"><b>${won(p.price)}</b><button class="add" data-add="${p.id}" aria-label="${p.name} 담기">+</button></div>
      </div>
    </article>`).join('') : '<p class="empty">조건에 맞는 메뉴가 없어요</p>';
  if (window.gsap && !location.search.includes('static')) gsap.from('#grid .card', { y: 30, opacity: 0, duration: .6, stagger: .03, ease: 'power3.out', clearProps: 'all' });
}
$('#tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-cat]'); if (b) { state.cat = b.dataset.cat; render(); } });
$('#chips').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tag]'); if (!b) return;
  state.tags.has(b.dataset.tag) ? state.tags.delete(b.dataset.tag) : state.tags.add(b.dataset.tag); render();
});
$('#search').addEventListener('input', (e) => { state.q = e.target.value; render(); });
$('#sort').addEventListener('change', (e) => { state.sort = e.target.value; render(); });
$('#grid').addEventListener('click', (e) => {
  const add = e.target.closest('[data-add]');
  if (add) { addCart(add.dataset.add, 1); return; }
  const c = e.target.closest('.card'); if (c) openDetail(c.dataset.id);
});

// ---------- 시트 공통 ----------
function toggle(el, on) {
  el.classList.toggle('open', on);
  el.setAttribute('aria-hidden', String(!on));
  const any = $('.sheet.open');
  document.body.classList.toggle('lock', !!any);
  if (lenis) any ? lenis.stop() : lenis.start();
}
$$('.sheet').forEach((s) => s.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) toggle(s, false); }));
addEventListener('keydown', (e) => { if (e.key === 'Escape') $$('.sheet.open').forEach((s) => toggle(s, false)); });

// ---------- 상세 ----------
function openDetail(id) {
  const p = byId[id], c = CATEGORIES[p.cat];
  let qty = 1;
  const feats = p.tags.filter((t) => t !== '베스트');
  $('#sheetBody').innerHTML = `<div class="detail">
    ${thumb(p)}
    <p class="cat-name">${c.en}</p>
    <h2>${p.name}</h2>
    <p class="price">${won(p.price)}</p>
    <p class="desc">${p.desc}</p>
    <dl class="facts">
      ${BREAD.includes(p.cat) ? '<div><dt>숙성</dt><dd>16시간 저온숙성</dd></div>' : ''}
      <div><dt>굽는 시간</dt><dd>하루 한 번</dd></div>
      ${feats.length ? `<div><dt>특징</dt><dd>${feats.join(' · ')}</dd></div>` : ''}
      <div><dt>알레르기</dt><dd>매장 문의</dd></div>
    </dl>
    <p class="why">${c.note}</p>
    <div class="buy">
      <div class="qty"><button data-q="-1" aria-label="빼기">−</button><span id="dq">1</span><button data-q="1" aria-label="더하기">+</button></div>
      <button class="btn btn-red btn-lg" id="dAdd">${won(p.price)} 담기</button>
    </div>
  </div>`;
  $('.buy').addEventListener('click', (e) => {
    const q = e.target.closest('[data-q]');
    if (q) { qty = Math.max(1, qty + +q.dataset.q); $('#dq').textContent = qty; $('#dAdd').textContent = `${won(p.price * qty)} 담기`; }
    if (e.target.closest('#dAdd')) { addCart(p.id, qty); toggle($('#sheet'), false); }
  });
  $('#sheet .sheet-panel').scrollTop = 0;
  toggle($('#sheet'), true);
}

// ---------- 장바구니 ----------
let cart = store.get('gg-cart', {});
for (const id in cart) if (!byId[id]) delete cart[id];
function saveCart() { store.set('gg-cart', cart); renderCart(); }
function addCart(id, n) {
  cart[id] = (cart[id] || 0) + n; saveCart();
  const b = $('#cartCount'); b.classList.add('bump'); setTimeout(() => b.classList.remove('bump'), 250);
  toast(`${byId[id].name} 담았어요`);
}
function renderCart() {
  const ids = Object.keys(cart);
  $('#cartCount').textContent = ids.reduce((s, id) => s + cart[id], 0);
  $('#cartTotal').textContent = won(ids.reduce((s, id) => s + byId[id].price * cart[id], 0));
  $('#cartList').innerHTML = ids.length ? ids.map((id) => {
    const p = byId[id];
    return `<div class="line" data-id="${id}">${thumb(p)}
      <div><h4>${p.name}</h4><small>${won(p.price * cart[id])}</small></div>
      <div class="qty"><button data-q="-1" aria-label="빼기">−</button><span>${cart[id]}</span><button data-q="1" aria-label="더하기">+</button></div>
    </div>`;
  }).join('') : '<p class="empty">장바구니가 비어 있어요</p>';
}
$('#cartList').addEventListener('click', (e) => {
  const row = e.target.closest('.line'), q = e.target.closest('[data-q]');
  if (!row || !q) return;
  const id = row.dataset.id;
  cart[id] += +q.dataset.q;
  if (cart[id] < 1) delete cart[id];
  saveCart();
});
$('#cartOpen').addEventListener('click', () => toggle($('#cart'), true));
$('#checkout').addEventListener('click', () => { toggle($('#cart'), false); toggle($('#soon'), true); });
$('#notifyForm').addEventListener('submit', (e) => { e.preventDefault(); e.target.reset(); toast('오픈 알림 신청 완료!'); });

let tt;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2000);
}

// SNS QR 코드 (qrcode-generator)
if (window.qrcode) $$('[data-qr]').forEach((el) => {
  const q = qrcode(0, 'M'); q.addData(el.dataset.qr); q.make();
  $('.qr-code', el).innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
});

render(); renderCart();
