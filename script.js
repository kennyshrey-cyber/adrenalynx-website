/* ─── SAFE STORAGE (file:// and private mode can throw) ── */
const safeStore = {
  get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
};

/* ─── CURSOR ─────────────────────────────────── */
const cursor = document.getElementById('cursor');
const cursorRing = document.getElementById('cursorRing');
let mx = 0, my = 0;
if (cursor && cursorRing) {
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top = my + 'px';
    cursorRing.style.left = mx + 'px';
    cursorRing.style.top = my + 'px';
  });
}

/* ─── FIRST-VISIT LOADER / RETURN-VISIT REVEAL ── */
const loader = document.getElementById('loader');
const pl = document.getElementById('page-loader');
const isReturnVisit = !!safeStore.get('axSeen');

function revealPage() {
  try {
    if (!isReturnVisit) {
      safeStore.set('axSeen', '1');
      if (loader) {
        loader.classList.add('loader-exit');
        setTimeout(() => { loader.style.display = 'none'; initScrollReveal(); }, 2900);
      } else {
        initScrollReveal();
      }
    } else {
      if (loader) loader.style.display = 'none';
      if (pl) {
        pl.classList.add('leaving');
        setTimeout(() => pl.classList.remove('leaving'), 750);
      }
      initScrollReveal();
    }
  } catch (e) {
    if (loader) loader.style.display = 'none';
    if (pl) pl.classList.remove('entering', 'leaving');
    initScrollReveal();
  }
}
if (document.readyState === 'complete') revealPage();
else window.addEventListener('load', revealPage);

/* FAILSAFE: never leave the page covered */
setTimeout(() => {
  if (loader && isReturnVisit) loader.style.display = 'none';
  if (pl) pl.classList.remove('leaving');
}, 3500);

/* Restore on browser back/forward (bfcache) */
window.addEventListener('pageshow', e => {
  if (e.persisted && pl) pl.classList.remove('entering', 'leaving');
});

/* ─── PAGE TRANSITIONS (real links) ───────────── */
function isInternalPage(href) {
  return href && /^[a-z-]+\.html(#.*)?$/.test(href);
}
document.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (!a) return;
  const href = a.getAttribute('href');
  if (!isInternalPage(href)) return;
  const current = location.pathname.split('/').pop() || 'index.html';
  if (href === current) { e.preventDefault(); return; }
  e.preventDefault();
  if (pl) {
    pl.classList.add('entering');
    setTimeout(() => { window.location.assign(href); }, 520);
    setTimeout(() => { pl.classList.remove('entering'); }, 2500); // fallback
  } else {
    window.location.assign(href);
  }
});

/* ─── ACTIVE NAV STATE ────────────────────────── */
(function () {
  const file = location.pathname.split('/').pop() || 'index.html';
  const map = { 'index.html': 'home', 'about.html': 'about', 'partnerships.html': 'partnerships', 'contact.html': 'contact' };
  const page = map[file] || 'home';
  const link = document.querySelector('.nav-links a[data-page="' + page + '"]');
  if (link) link.classList.add('active');
})();

/* ─── NAV SCROLL ──────────────────────────────── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 40);
});

/* ─── MOBILE NAV ──────────────────────────────── */
function toggleMobile() {
  const hb = document.getElementById('hamburger');
  const nm = document.getElementById('navMobile');
  hb.classList.toggle('open');
  nm.classList.toggle('open');
}
function closeMobile() {
  document.getElementById('hamburger').classList.remove('open');
  document.getElementById('navMobile').classList.remove('open');
}

/* ─── SCROLL REVEAL ───────────────────────────── */
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal:not(.visible)');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  elements.forEach(el => observer.observe(el));
}

/* ─── FORM SUBMIT (Formspree) ─────────────────── */
function handleFormSubmit(e) {
  e.preventDefault();
  const form = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  const errorBox = document.getElementById('formError');
  const submitBtn = form.querySelector('.form-submit');
  const originalLabel = submitBtn.textContent;

  submitBtn.textContent = 'Sending...';
  submitBtn.disabled = true;

  fetch(form.action, {
    method: 'POST',
    body: new FormData(form),
    headers: { 'Accept': 'application/json' }
  })
  .then(response => {
    if (response.ok) {
      form.style.display = 'none';
      if (errorBox) errorBox.style.display = 'none';
      success.style.display = 'block';
      form.reset();
    } else {
      throw new Error('Submission failed');
    }
  })
  .catch(() => {
    submitBtn.textContent = originalLabel;
    submitBtn.disabled = false;
    if (errorBox) errorBox.style.display = 'block';
  });
}

/* ─── COUNTER ANIMATION ───────────────────────── */
function animateCounters() {
  document.querySelectorAll('.stat-num').forEach(el => {
    if (el.querySelector('svg')) return;
    const text = el.textContent.trim();
    if (text === '2026' || text.includes('+')) return;
    const num = parseInt(text);
    if (!isNaN(num) && num > 1) {
      let start = 0;
      const duration = 1500;
      const step = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        el.textContent = Math.floor(progress * num);
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = text;
      };
      requestAnimationFrame(step);
    }
  });
}
