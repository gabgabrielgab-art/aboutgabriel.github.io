// Gabriel Carlos — portfolio site behaviour.
// Vanilla JS: mobile nav, scroll progress, cursor reticle, hero parallax,
// card tilt, scroll reveals, the ballpit hero background, and the two
// contact forms. The project-enquiry form delivers straight to
// gabgabrielgab@gmail.com via FormSubmit.co. The crash-course PDF gate
// auto-delivers the file to the visitor by email via EmailJS the moment
// they submit — see EMAIL_SETUP.md for the one-time account setup this
// needs. If EmailJS isn't configured yet, or the requested course has no
// file wired up in email-config.js, it falls back to just notifying
// Gabriel via FormSubmit so the request still isn't lost.
//
// Deliberately NOT `import`-ing ./ballpit.js here: it's loaded by its own
// <script type="module"> tag in index.html instead. ballpit.js pulls
// three.js from a CDN, and a static import binds the importing module's
// success to that import resolving — if the CDN is ever unreachable
// (outage, ad-blocker, offline), this entire script would fail to
// evaluate and take the nav, forms and every other feature below down
// with it, for a background animation. Loading it as an independent
// script means a CDN failure stays contained to ballpit.js; the
// initBallpit() below already checks for window.createBallpit at call
// time and degrades gracefully if it never showed up. email-config.js
// has no such external dependency, so importing it directly here is safe.

import { EMAILJS_PUBLIC_KEY, EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_DELIVER, COURSE_FILES } from './email-config.js';

const FORM_EMAIL = 'gabgabrielgab@gmail.com';
const FORM_ENDPOINT = `https://formsubmit.co/ajax/${FORM_EMAIL}`;

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarsePointer = matchMedia('(pointer: coarse)').matches;

/* ---------- Mobile nav ---------- */
(function initNav() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const panel = document.querySelector('[data-nav-panel]');
  if (!toggle || !panel) return;

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
  }

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  panel.querySelectorAll('[data-nav-link]').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  addEventListener('resize', () => {
    if (innerWidth > 860 && toggle.getAttribute('aria-expanded') === 'true') setOpen(false);
  });
})();

/* ---------- London clock ---------- */
(function initClock() {
  const clock = document.querySelector('[data-clock]');
  if (!clock) return;
  const tick = () => {
    const t = new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' });
    clock.textContent = 'LDN ' + t;
  };
  tick();
  setInterval(tick, 20000);
})();

/* ---------- Cursor reticle (fine pointer, motion-safe only) ---------- */
/* Never toggled via static CSS — if this script fails to run, the
   ordinary system cursor stays visible instead of vanishing forever. */
(function initReticle() {
  if (coarsePointer) return;
  const ring = document.querySelector('[data-reticle-ring]');
  const dot = document.querySelector('[data-reticle-dot]');
  if (!ring || !dot) return;

  document.body.style.cursor = 'none';
  ring.style.opacity = '1';
  dot.style.opacity = '1';

  const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  const pos = { x: mouse.x, y: mouse.y };

  addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });

  let raf = 0;
  const frame = () => {
    pos.x += (mouse.x - pos.x) * 0.16;
    pos.y += (mouse.y - pos.y) * 0.16;
    dot.style.transform = `translate(${mouse.x}px, ${mouse.y}px)`;
    ring.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  addEventListener('beforeunload', () => cancelAnimationFrame(raf));
})();

/* ---------- Scroll progress bar + hero kinetic parallax ---------- */
(function initScrollEffects() {
  const bar = document.querySelector('[data-progress]');
  const kinetic = reduceMotion ? [] : [...document.querySelectorAll('[data-kin]')];
  if (!bar && kinetic.length === 0) return;

  let raf = 0;
  let lastY = -1;
  const frame = () => {
    const y = scrollY;
    if (y !== lastY) {
      lastY = y;
      if (bar) {
        const max = document.documentElement.scrollHeight - innerHeight;
        bar.style.width = (max > 0 ? Math.min(100, (y / max) * 100) : 0) + '%';
      }
      kinetic.forEach((el) => {
        const speed = parseFloat(el.dataset.speed || '0');
        el.style.transform = `translateY(${y * speed}px)`;
      });
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  addEventListener('beforeunload', () => cancelAnimationFrame(raf));
})();

/* ---------- Card tilt on hover (work section) ---------- */
(function initTilt() {
  if (coarsePointer || reduceMotion) return;
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      card.style.transform = `rotateY(${dx * 5}deg) rotateX(${-dy * 5}deg) translateZ(24px)`;
      card.style.borderColor = 'rgba(168,207,69,.55)';
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = 'rotateY(0deg) rotateX(0deg) translateZ(0)';
      card.style.borderColor = '';
    });
  });
})();

/* ---------- Reveal on scroll ---------- */
(function initReveal() {
  const reveals = [...document.querySelectorAll('[data-reveal]')];
  if (!reveals.length) return;
  if (reduceMotion) {
    reveals.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  reveals.forEach((el) => io.observe(el));
})();

/* ---------- Ballpit hero background ---------- */
(function initBallpit() {
  const canvas = document.getElementById('ballpit-canvas');
  const sentinel = document.querySelector('[data-hero-sentinel]');
  if (!canvas) return;

  const wide = Math.max(innerWidth, 320);
  const vp = wide < 560 ? 0.45 : wide < 900 ? 0.7 : 1;

  let instance = null;
  try {
    if (typeof window.createBallpit !== 'function') throw new Error('createBallpit unavailable');
    instance = window.createBallpit(canvas, {
      count: Math.round(190 * vp),
      gravity: 0.2,
      friction: 0.9975,
      wallBounce: 0.95,
      maxVelocity: 0.15,
      followCursor: !coarsePointer,
      minSize: 0.4,
      maxSize: 1.1,
      colors: [0xa8cf45, 0x5e8c1f, 0xf4f4f1],
      ambientColor: 0xffffff,
      ambientIntensity: 0.9,
      lightIntensity: 220,
    });
  } catch (err) {
    // WebGL unavailable, context creation failed, or the module didn't
    // load (e.g. offline / CDN blocked). Fail quietly to a plain dark
    // hero background rather than breaking the page.
    console.warn('Ballpit background unavailable, falling back to a static hero.', err);
    return;
  }

  if (reduceMotion) instance.setPaused(true);

  // The hero is sticky, so its own canvas never leaves the viewport —
  // the ballpit's internal IntersectionObserver never sees it hidden.
  // Watch a non-sticky sentinel at the hero's end instead, and pause
  // rendering once later content has scrolled over it.
  if (sentinel && !reduceMotion) {
    const heroIo = new IntersectionObserver((entries) => {
      const hidden = !entries[0].isIntersecting && entries[0].boundingClientRect.top < 0;
      instance.setPaused(hidden);
    }, { threshold: 0 });
    heroIo.observe(sentinel);
  }
})();

/* ---------- Form submission helper (FormSubmit.co AJAX) ---------- */
async function submitForm(fields) {
  if (fields._honey) {
    // Honeypot tripped — pretend success without sending anywhere.
    return { ok: true };
  }
  const payload = { ...fields };
  delete payload._honey;

  try {
    const res = await fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false };
    const data = await res.json().catch(() => null);
    if (data && (data.success === 'true' || data.success === true)) return { ok: true };
    // FormSubmit returns 200 with success:false the very first time a new
    // destination email is used, while it waits on a one-click activation
    // link sent to that inbox. Treat that as accepted-but-pending rather
    // than a hard failure.
    return { ok: true, pending: true };
  } catch (err) {
    return { ok: false, err };
  }
}

/* ---------- Contact form ---------- */
(function initContactForm() {
  const form = document.querySelector('[data-contact-form]');
  const success = document.querySelector('[data-contact-success]');
  const errorEl = document.querySelector('[data-contact-error]');
  const btn = document.querySelector('[data-submit-btn]');
  if (!form || !success || !btn) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    errorEl.hidden = true;
    btn.disabled = true;
    btn.textContent = 'Sending…';

    const data = new FormData(form);
    const result = await submitForm({
      name: data.get('name'),
      email: data.get('email'),
      company: data.get('company'),
      message: data.get('message'),
      _honey: data.get('_honey'),
      _subject: `New project enquiry — ${data.get('name') || 'portfolio site'}`,
    });

    btn.disabled = false;
    btn.textContent = 'Send it';

    if (result.ok) {
      form.hidden = true;
      success.hidden = false;
    } else {
      errorEl.hidden = false;
      errorEl.textContent = `Something went wrong sending that. Please try again, or email me directly at ${FORM_EMAIL}.`;
    }
  });
})();

/* ---------- Crash-course email gate ---------- */
(function initGate() {
  const modal = document.querySelector('[data-gate-modal]');
  const askPane = document.querySelector('[data-gate-ask]');
  const donePane = document.querySelector('[data-gate-done]');
  const gateForm = document.querySelector('[data-gate-form]');
  const gateErrorEl = document.querySelector('[data-gate-error]');
  const gateSubmitBtn = document.querySelector('[data-gate-submit]');
  const titleEls = document.querySelectorAll('[data-gate-title], [data-gate-title-2]');
  if (!modal || !askPane || !donePane || !gateForm) return;

  let lastFocused = null;

  function openGate(title) {
    titleEls.forEach((el) => { el.textContent = title; });
    askPane.hidden = false;
    donePane.hidden = true;
    gateForm.hidden = false;
    gateErrorEl.hidden = true;
    gateForm.reset();
    lastFocused = document.activeElement;
    modal.hidden = false;
    const firstInput = gateForm.querySelector('input');
    if (firstInput) firstInput.focus();
  }

  function closeGate() {
    modal.hidden = true;
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  document.querySelectorAll('[data-open-gate]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      openGate(trigger.getAttribute('data-course-title') || 'Crash course');
    });
  });

  document.querySelectorAll('[data-close-gate]').forEach((btn) => {
    btn.addEventListener('click', closeGate);
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeGate();
  });

  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeGate();
  });

  const doneTag = document.querySelector('[data-gate-done-tag]');
  const doneTitle = document.querySelector('[data-gate-done-title]');
  const doneBody = document.querySelector('[data-gate-done-body]');
  const doneDownload = document.querySelector('[data-gate-download]');

  gateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!gateForm.reportValidity()) return;

    const data = new FormData(gateForm);
    if (data.get('_honey')) {
      // Honeypot tripped — pretend success without sending anything.
      askPane.hidden = true;
      donePane.hidden = false;
      return;
    }

    const email = data.get('email');
    const courseTitle = document.querySelector('[data-gate-title]').textContent;

    gateErrorEl.hidden = true;
    gateSubmitBtn.disabled = true;
    gateSubmitBtn.textContent = 'Sending…';

    const downloadPath = COURSE_FILES[courseTitle] || '';
    const downloadLink = downloadPath ? new URL(downloadPath, location.href).toString() : '';
    const emailjsReady = typeof emailjs !== 'undefined' && !EMAILJS_PUBLIC_KEY.startsWith('YOUR_');

    let delivered = false;
    if (emailjsReady && downloadLink) {
      try {
        emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_DELIVER, {
          to_email: email,
          course: courseTitle,
          download_link: downloadLink,
        });
        delivered = true;
      } catch (err) {
        console.warn('EmailJS auto-delivery failed', err);
      }
    }

    let ok = delivered;
    if (!delivered) {
      // Either EmailJS isn't set up yet, this course has no file wired
      // up, or the send itself failed — fall back to just notifying
      // Gabriel so the request isn't lost.
      const result = await submitForm({
        email,
        course: courseTitle,
        _honey: data.get('_honey'),
        _subject: `Crash course request: ${courseTitle}`,
      });
      ok = result.ok;
    }

    gateSubmitBtn.disabled = false;
    gateSubmitBtn.textContent = 'Send me the link';

    if (ok) {
      if (delivered) {
        doneTag.textContent = 'Sent';
        doneTitle.textContent = "It's in your inbox.";
        doneBody.textContent = `I've emailed ${courseTitle} to ${email} — and you can grab it right here too, no need to wait.`;
      } else {
        doneTag.textContent = 'On its way';
        doneTitle.textContent = 'Check your inbox.';
        doneBody.textContent = `Your request for ${courseTitle} is with me — I read every request myself and I'll send it over shortly. If you don't hear back in a couple of days, it's worth checking spam.`;
      }
      if (downloadLink) {
        doneDownload.href = downloadLink;
        doneDownload.hidden = false;
      } else {
        doneDownload.hidden = true;
      }
      askPane.hidden = true;
      donePane.hidden = false;
    } else {
      gateErrorEl.hidden = false;
      gateErrorEl.textContent = `Something went wrong sending that. Please try again, or email me directly at ${FORM_EMAIL}.`;
    }
  });
})();
