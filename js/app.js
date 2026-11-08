const $ = (s, el = document) => el.querySelector(s);
const won = (n) => n.toLocaleString('ko-KR') + '원';
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// 로더
window.addEventListener('load', () => setTimeout(() => $('#loader').classList.add('done'), 600));

// 부드러운 스크롤 (Lenis)
const lenis = window.Lenis ? new Lenis({ duration: 1.2, smoothWheel: true }) : null;
if (lenis) {
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const t = $(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    document.body.classList.remove('menu-open');
    lenis.scrollTo(t, { offset: a.getAttribute('href') === '#top' ? 0 : -60 });
  }));
}

// 네비게이션
const nav = $('#nav');
const onScroll = () => nav.classList.toggle('solid', window.scrollY > window.innerHeight * 0.8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();
$('#burger').addEventListener('click', () => document.body.classList.toggle('menu-open'));
$('#menu').addEventListener('click', () => document.body.classList.remove('menu-open'));

// 매장 사진: 파일이 있으면 그라데이션 위에 덮어씀
document.querySelectorAll('.swiper-slide[data-bg]').forEach((s) => {
  const img = new Image();
  img.onload = () => { $('.slide-bg', s).style.backgroundImage = `url(${s.dataset.bg})`; };
  img.src = s.dataset.bg;
});

// 히어로 슬라이더 (Swiper)
new Swiper('.hero-swiper', {
  effect: 'fade', fadeEffect: { crossFade: true }, speed: 1600, loop: true,
  autoplay: { delay: 6000, disableOnInteraction: false },
  pagination: { el: '.swiper-pagination', clickable: true },
  navigation: { prevEl: '.hero-prev', nextEl: '.hero-next' },
  keyboard: true,
  on: { slideChange(sw) { $('#heroCur').textContent = String(sw.realIndex + 1).padStart(2, '0'); } },
});

// 스크롤 등장 애니메이션
const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// ---------- 샵 ----------
const TAGS = ['통호밀100%', '밀가루0%', '무설탕', '통호밀', '견과', '치즈', '크림', '홀케이크'];
const BREAD = ['grain', 'loaf', 'rustic', 'salt', 'savory', 'sweet'];
const state = { cat: 'all', tags: new Set(), q: '', sort: 'default' };

const thumb = (p) => `
  <div class="thumb">
    <div class="ph ph-${p.cat}"><b>${CATEGORIES[p.cat].en}</b><i>GGBAKERY</i></div>
    ${p.img ? `<img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.remove()">` : ''}
  </div>`;

function renderTabs() {
  const items = [['all', '전체', PRODUCTS.length], ...Object.entries(CATEGORIES).map(([k, c]) => [k, c.name, PRODUCTS.filter((p) => p.cat === k).length])];
  $('#catTabs').innerHTML = items.map(([k, n, c]) => `<button data-cat="${k}" class="${state.cat === k ? 'on' : ''}">${n}<small>${c}</small></button>`).join('');
  $('#tagFilter').innerHTML = TAGS.map((t) => `<button data-tag="${t}" class="${state.tags.has(t) ? 'on' : ''}">${t}</button>`).join('');
}

function filtered() {
  const q = state.q.trim().toLowerCase();
  let list = PRODUCTS.filter((p) =>
    (state.cat === 'all' || p.cat === state.cat) &&
    [...state.tags].every((t) => p.tags.includes(t)) &&
    (!q || (p.name + p.desc).toLowerCase().includes(q)));
  const by = {
    best: (a, b) => b.tags.includes('베스트') - a.tags.includes('베스트'),
    low: (a, b) => a.price - b.price,
    high: (a, b) => b.price - a.price,
  }[state.sort];
  return by ? [...list].sort(by) : list;
}

function renderGrid() {
  const list = filtered();
  $('#resultCount').textContent = `${list.length}개의 빵`;
  $('#grid').innerHTML = list.length ? list.map((p, i) => `
    <article class="card" data-id="${p.id}" style="animation-delay:${Math.min(i, 12) * 40}ms">
      ${thumb(p).replace('<div class="thumb">', `<div class="thumb"><div class="badges">${p.tags.includes('베스트') ? '<span class="best">BEST</span>' : ''}</div><div class="quick">자세히 보기</div>`)}
      <div class="card-info">
        <h3>${p.name}</h3>
        <p>${p.desc}</p>
        <span class="price">${won(p.price)}</span>
        <div class="chips">${p.tags.filter((t) => TAGS.includes(t)).slice(0, 3).map((t) => `<span>${t}</span>`).join('')}</div>
      </div>
    </article>`).join('') : '<p class="empty">조건에 맞는 빵이 없어요. 필터를 바꿔보세요.</p>';
}

$('#catTabs').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  state.cat = b.dataset.cat; renderTabs(); renderGrid();
});
$('#tagFilter').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  const t = b.dataset.tag;
  state.tags.has(t) ? state.tags.delete(t) : state.tags.add(t);
  renderTabs(); renderGrid();
});
$('#search').addEventListener('input', (e) => { state.q = e.target.value; renderGrid(); });
$('#sort').addEventListener('change', (e) => { state.sort = e.target.value; renderGrid(); });
$('#grid').addEventListener('click', (e) => { const c = e.target.closest('.card'); if (c) openDetail(c.dataset.id); });

// ---------- 모달 공통 ----------
function toggle(el, on) {
  el.classList.toggle('open', on);
  el.setAttribute('aria-hidden', !on);
  const any = document.querySelector('.modal.open, .drawer.open');
  document.body.classList.toggle('lock', !!any);
  lenis && (any ? lenis.stop() : lenis.start());
}
const modal = $('#modal'), drawer = $('#drawer'), soon = $('#soon');
modal.addEventListener('click', (e) => e.target.closest('[data-close]') && toggle(modal, false));
drawer.addEventListener('click', (e) => e.target.closest('[data-dclose]') && toggle(drawer, false));
soon.addEventListener('click', (e) => e.target.closest('[data-sclose]') && toggle(soon, false));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') [soon, modal, drawer].forEach((m) => toggle(m, false)); });

// ---------- 상세 ----------
function openDetail(id) {
  const p = PRODUCTS.find((x) => x.id === id);
  const c = CATEGORIES[p.cat];
  let qty = 1;
  $('#modalBody').innerHTML = `
    ${thumb(p)}
    <div class="detail">
      <p class="cat">${c.en} · ${c.name}</p>
      <h2>${p.name}</h2>
      <p class="price">${won(p.price)}</p>
      <p class="desc">${p.desc}</p>
      <dl class="spec">
        ${BREAD.includes(p.cat) ? '<div><dt>숙성</dt><dd>16시간 저온숙성</dd></div>' : ''}
        <div><dt>굽는 시간</dt><dd>하루에 한 번, 그날 구운 빵만</dd></div>
        ${p.tags.some((t) => t !== '베스트') ? `<div><dt>특징</dt><dd>${p.tags.filter((t) => t !== '베스트').join(' · ')}</dd></div>` : ''}
        <div><dt>알레르기</dt><dd>원재료·알레르기 정보는 매장에 문의해 주세요</dd></div>
      </dl>
      <div class="gut"><b>Why it's gentle</b>${c.note}</div>
      <div class="buy">
        <div class="qty"><button data-q="-1">−</button><span id="mq">1</span><button data-q="1">+</button></div>
        <button class="btn-solid" id="addCart">장바구니 담기</button>
      </div>
    </div>`;
  $('.buy', modal).addEventListener('click', (e) => {
    const q = e.target.closest('[data-q]');
    if (q) { qty = Math.max(1, qty + +q.dataset.q); $('#mq').textContent = qty; }
    if (e.target.id === 'addCart') { addCart(p.id, qty); toggle(modal, false); }
  });
  $('.modal-panel', modal).scrollTop = 0;
  toggle(modal, true);
}

// ---------- 장바구니 ----------
let cart = store.get('gg-cart', {});
function saveCart() { store.set('gg-cart', cart); renderCart(); }
function addCart(id, n) { cart[id] = (cart[id] || 0) + n; saveCart(); toast('장바구니에 담았어요'); }
function renderCart() {
  const ids = Object.keys(cart).filter((id) => PRODUCTS.some((p) => p.id === id));
  const count = ids.reduce((s, id) => s + cart[id], 0);
  $('#cartCount').textContent = count;
  $('#cartTotal').textContent = won(ids.reduce((s, id) => s + PRODUCTS.find((p) => p.id === id).price * cart[id], 0));
  $('#cartList').innerHTML = ids.length ? ids.map((id) => {
    const p = PRODUCTS.find((x) => x.id === id);
    return `<div class="ci" data-id="${id}">
      <div class="ph ph-${p.cat}">${p.img ? `<img src="${p.img}" alt="">` : ''}</div>
      <div><h4>${p.name}</h4><small>${won(p.price)}</small><br><button class="rm">삭제</button></div>
      <div class="qty"><button data-q="-1">−</button><span>${cart[id]}</span><button data-q="1">+</button></div>
    </div>`;
  }).join('') : '<p class="empty">장바구니가 비어 있어요</p>';
}
$('#cartList').addEventListener('click', (e) => {
  const row = e.target.closest('.ci'); if (!row) return;
  const id = row.dataset.id, q = e.target.closest('[data-q]');
  if (q) cart[id] += +q.dataset.q;
  if (e.target.closest('.rm') || cart[id] < 1) delete cart[id];
  saveCart();
});
$('#cartOpen').addEventListener('click', () => toggle(drawer, true));
$('#checkout').addEventListener('click', () => toggle(soon, true));
$('#notifyForm').addEventListener('submit', (e) => { e.preventDefault(); e.target.reset(); toast('오픈 알림 신청이 완료됐어요'); });

let tt;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2200);
}

renderTabs(); renderGrid(); renderCart();
