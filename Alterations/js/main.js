/* =========================================================================
   EXCLUSIVE ALTERATIONS — scroll choreography
   One master timeline, scrubbed by one ScrollTrigger, drives:
     • the film (canvas frame sequence)   • chapter copy in / hold / out
     • the progress bar + chapter rail    (one continuous film: no holds, no snapping)
   ScrollSmoother smooths the scroll itself, so the film never steps.
   ========================================================================= */
(() => {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, ScrollToPlugin);
  // Always open on the hero (a restored mid-film scroll position would skip the intro)
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touch = window.matchMedia("(pointer: coarse)").matches;
  // Portrait phones get a native-resolution centre crop (assets/frames-sm, 648×1080);
  // everything else gets the full 1920×1080 frames. Both hold every frame of the film.
  // (re-evaluated on rotate/resize: a tablet or phone turned sideways switches sets live)
  const isPortrait = () => window.innerWidth < window.innerHeight && window.innerWidth <= 900;
  let PORTRAIT = isPortrait();
  let FRAMES_DIR = PORTRAIT ? "assets/frames-sm/" : "assets/frames/";

  /* Chapter → frame ranges, authored against the 313-frame build of the film
     (scene cuts from tools/detect_scenes.py; scene 2 is split into the craft
     and bridal beats). Ranges rescale if the frame count changes.            */
  const AUTHORED_COUNT = 313;
  const CHAPTERS = [
    { from: 0,   to: 24  },   // 0 hero        — shears on walnut
    { from: 25,  to: 80  },   // 1 the craft   — thread spool, dress form
    { from: 81,  to: 176 },   // 2 bridal      — silk spirals into the gown
    { from: 177, to: 200 },   // 3 details     — pearl buttons
    { from: 201, to: 226 },   // 4 hems        — skirt & train
    { from: 227, to: 272 },   // 5 tailoring   — basted lapel, sleeve
    { from: 273, to: 312 },   // 6 fittings    — both forms, cutting table
  ];

  /* Scroll budget: pixels of scroll per film frame, and per chapter hold */
  const PX_PER_FRAME = () => Math.max(9, window.innerHeight / 72);
  const MIN_SPAN = 64, MIN_SPAN_HERO = 48;   // minimum scroll span per chapter (timeline units)
  const COPY_IN = 14, COPY_OUT = 12;         // copy fade-in / fade-out lengths

  /* ---------------------------------------------------------------------
     Smooth scrolling
     --------------------------------------------------------------------- */
  const QA = new URLSearchParams(location.search).has("qa");   // contrast-audit mode (see tools/contrast_audit.py)
  const smoother = reduce || QA ? null : ScrollSmoother.create({
    wrapper: "#smooth-wrapper", content: "#smooth-content",
    smooth: 1.2, smoothTouch: 0.1, effects: false, normalizeScroll: touch,
  });

  /* ---------------------------------------------------------------------
     Film: canvas frame sequence with progressive loading
     --------------------------------------------------------------------- */
  const canvas = document.getElementById("film");
  const ctx = canvas.getContext("2d", { alpha: false });
  // frame = where the scroll timeline wants the film (set by GSAP)
  // shown = what is on screen; it eases toward `frame` every tick. With every source
  //         frame available we always paint ONE sharp frame (no cross-fade ghosting).
  const film = { frame: 0, shown: 0, count: AUTHORED_COUNT, imgs: [], loaded: [], dirty: true, last: -1,
                 w: 1920, h: 1080, cuts: [] };
  window.__film = film;                          // handy for debugging in the console
  const FOLLOW = reduce ? 1 : 0.3;               // per-tick easing of the film toward the scroll target
  const DIP = 7;                                 // frames either side of a hard cut that dip to dark
  const INK = "rgb(13,10,8)";

  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    film.dirty = true;
  }

  function nearestLoaded(i) {
    if (film.loaded[i]) return i;
    for (let d = 1; d < film.count; d++) {
      if (film.loaded[i - d]) return i - d;
      if (film.loaded[i + d]) return i + d;
    }
    return -1;
  }

  // 0..1 darkness for a smooth dip-to-dark across each hard cut in the film
  function dipAt(f) {
    let a = 0;
    for (const c of film.cuts) a = Math.max(a, 1 - Math.abs(f - (c - 0.5)) / DIP);
    return Math.max(0, a) ** 1.4 * 0.92;
  }

  function render() {
    const target = Math.max(0, Math.min(film.count - 1, film.frame));
    const delta = target - film.shown;
    film.shown = Math.abs(delta) > 0.02 ? film.shown + delta * FOLLOW : target;
    const i = Math.round(film.shown);
    const dip = dipAt(film.shown);
    const key = i * 1000 + Math.round(dip * 100);
    if (!film.dirty && key === film.last) return;               // nothing changed: skip the draw
    const j = nearestLoaded(i);
    if (j < 0) return;
    const cw = canvas.width, ch = canvas.height;
    const s = Math.max(cw / film.w, ch / film.h);                // cover
    const dw = Math.round(film.w * s), dh = Math.round(film.h * s);
    ctx.drawImage(film.imgs[j], Math.round((cw - dw) / 2), Math.round((ch - dh) / 2), dw, dh);
    if (dip > 0.001) { ctx.globalAlpha = dip; ctx.fillStyle = INK; ctx.fillRect(0, 0, cw, ch); ctx.globalAlpha = 1; }
    film.last = key; film.dirty = false;
  }
  gsap.ticker.add(render);

  let generation = 0;                            // bumps when the frame set switches; stale loads are dropped
  function loadFrames(meta, dir = FRAMES_DIR) {
    const gen = ++generation;
    film.count = meta.count; film.w = meta.width; film.h = meta.height;
    film.cuts = (meta.scenes || []).slice(1).map((sc) => sc.start);
    film.imgs = []; film.loaded = []; film.dirty = true;
    const src = (i) => `${dir}f_${String(i + 1).padStart(meta.pad || 4, "0")}.webp`;
    // priority: the frame on screen first, then every 16th, 8th, 4th, 2nd, then the rest
    const here = Math.round(film.frame);
    const order = [here];
    const seen = new Set(order);
    for (const step of [16, 8, 4, 2, 1]) {
      for (let i = 0; i < film.count; i += step) if (!seen.has(i)) { seen.add(i); order.push(i); }
    }
    let inFlight = 0, cursor = 0;
    const MAX = 6;
    const pump = () => {
      while (inFlight < MAX && cursor < order.length) {
        const i = order[cursor++];
        const img = new Image();
        img.decoding = "async";
        inFlight++;
        // onload/onerror always settle (img.decode() can stall for off-screen images)
        const done = (ok) => {
          if (gen !== generation) return;                    // a newer frame set took over
          if (ok) { film.imgs[i] = img; film.loaded[i] = true; }
          inFlight--;
          if (ok && Math.abs(i - film.frame) < 24) film.dirty = true;
          pump();
        };
        // warm the decoder so drawing the frame later never stalls a scroll tick
        img.onload = () => { if (img.decode) img.decode().catch(() => {}); done(true); };
        img.onerror = () => done(false);
        img.src = src(i);
      }
    };
    pump();
  }

  /* ---------------------------------------------------------------------
     Master timeline
     --------------------------------------------------------------------- */
  const chapters = gsap.utils.toArray(".chapter");
  const rail = document.getElementById("rail");
  const bar = document.getElementById("progress");
  const cue = document.getElementById("cue");

  function buildStory() {
    const k = film.count / AUTHORED_COUNT;          // real frames per authored unit (≈2 with all 625 frames)
    const ranges = CHAPTERS.map((c) => ({ from: Math.round(c.from * k), to: Math.round(c.to * k) }));

    // opacity only (never visibility:hidden): every chapter stays in the accessibility tree
    gsap.set(chapters.slice(1), { opacity: 0 });
    gsap.set(chapters[0], { opacity: 1 });

    // CONTINUOUS FILM — no holds, no pauses, no snapping.
    // Each chapter gets a scroll span (timeline units ≈ authored frames). Short scenes get a
    // minimum span so their copy stays readable: the film simply plays a little slower there,
    // it never stops. Copy fades in as a chapter begins and out just before it ends.
    const tl = gsap.timeline({ defaults: { ease: "none" } });
    const starts = [];
    let t0 = 0;
    ranges.forEach((r, i) => {
      const el = chapters[i];
      const parts = el.querySelectorAll(":scope > *");
      const last = i === ranges.length - 1;
      const filmSpan = (r.to - r.from + 1) / k;
      const d = Math.max(filmSpan, i === 0 ? MIN_SPAN_HERO : MIN_SPAN);
      const toFrame = last ? film.count - 1 : ranges[i + 1].from;
      starts.push(t0);

      tl.to(film, { frame: toFrame, duration: d }, t0);          // the film never pauses
      tl.addLabel(`ch${i}`, t0 + d * 0.5);                       // middle of the chapter (rail target)

      const inDur = Math.min(COPY_IN, d * 0.22), outDur = Math.min(COPY_OUT, d * 0.18);
      if (i > 0) {
        tl.set(el, { opacity: 1 }, t0 + d * 0.04);
        tl.fromTo(parts, { y: 40, opacity: 0 },
          { y: 0, opacity: 1, ease: "power2.out", duration: inDur, stagger: inDur * 0.12 }, t0 + d * 0.04);
      }
      if (!last) {
        const outAt = t0 + d - outDur - d * 0.03;
        if (i === 0) {
          tl.to(el.querySelector(".hero-title"), { yPercent: -16, opacity: 0, ease: "power1.in", duration: outDur }, outAt);
          tl.to(cue, { autoAlpha: 0, duration: outDur * 0.6 }, outAt);
        }
        tl.to(parts, { y: -32, opacity: 0, ease: "power1.in", duration: outDur, stagger: outDur * 0.08 }, outAt);
        tl.set(el, { opacity: 0 }, t0 + d);
      }
      t0 += d;
    });

    const st = ScrollTrigger.create({
      animation: tl,
      trigger: "#story",
      pin: "#stage",
      start: "top top",
      end: () => "+=" + Math.round(tl.duration() * PX_PER_FRAME()),
      scrub: true,                     // ScrollSmoother + the film's own easing already smooth it
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        gsap.set(bar, { scaleX: self.progress });
        setActive(activeChapter(tl, starts));
      },
    });

    // chapter rail
    chapters.forEach((el, i) => {
      const li = document.createElement("li");
      li.innerHTML = `<button type="button" aria-label="Go to ${el.dataset.label}"><span class="label">${el.dataset.label}</span><span class="tick"></span></button>`;
      li.querySelector("button").addEventListener("click", () => goToChapter(i));
      rail.appendChild(li);
    });
    // keyboard users: tabbing into a chapter's link brings that chapter on screen
    chapters.forEach((el, i) => el.addEventListener("focusin", () => { if (lastActive !== i) goToChapter(i, true); }));
    function goToChapter(i, instant) {
      const y = st.start + (tl.labels[`ch${i}`] / tl.duration()) * (st.end - st.start);   // middle of the chapter
      if (smoother) smoother.scrollTo(y, !instant && !reduce);
      else gsap.to(window, { scrollTo: y, duration: instant || reduce ? 0 : 1.2, ease: "power2.inOut" });
    }
    setActive(0);
    return { tl, st };
  }

  function activeChapter(tl, starts) {
    const t = tl.time();
    let a = 0;
    starts.forEach((s0, i) => { if (t >= s0) a = i; });
    return a;
  }
  let lastActive = -1;
  function setActive(i) {
    if (i === lastActive) return;
    lastActive = i;
    [...rail.children].forEach((li, k) => {
      li.classList.toggle("is-active", k === i);
      const b = li.querySelector("button");
      k === i ? b.setAttribute("aria-current", "step") : b.removeAttribute("aria-current");
    });
    chapters.forEach((el, k) => el.classList.toggle("is-live", k === i));
  }

  /* ---------------------------------------------------------------------
     Hero intro (on load, not scroll): masked line reveal
     --------------------------------------------------------------------- */
  function heroIntro() {
    if (reduce) return;
    const lines = document.querySelectorAll(".hero-title .line > span");
    const rest = document.querySelectorAll(".chapter--hero > :not(.hero-title)");
    gsap.timeline({ defaults: { ease: "expo.out" } })
      .from(canvas, { autoAlpha: 0, duration: 1.4, ease: "power2.out" })
      .from(lines, { yPercent: 110, duration: 1.3, stagger: 0.12 }, 0.25)
      .from(rest, { y: 24, autoAlpha: 0, duration: 1, stagger: 0.1 }, 0.75)
      .from(".site-header > *", { y: -16, autoAlpha: 0, duration: 0.9, stagger: 0.08 }, 0.6)
      .from(cue, { autoAlpha: 0, duration: 0.8 }, 1.4);
  }

  /* ---------------------------------------------------------------------
     After the film: curtain, reveals, header state
     --------------------------------------------------------------------- */
  function afterFilm() {
    // the ivory curtain rises over the final frame: film sinks and dims
    // transform + an overlay's opacity (cheap) instead of a CSS filter on the canvas
    gsap.timeline({ scrollTrigger: { trigger: "#services", start: "top bottom", end: "top top", scrub: true } })
      .to("#stage canvas", { yPercent: 10, ease: "none" }, 0)
      .to("#dim", { opacity: 0.5, ease: "none" }, 0);

    gsap.set("[data-reveal]", { autoAlpha: 0, y: 28 });
    ScrollTrigger.batch("[data-reveal]", {
      start: "top 88%",
      onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: reduce ? 0 : 1, ease: "expo.out", stagger: 0.08, overwrite: true }),
    });

    // header: hide on scroll down, reveal on scroll up — calmly.
    //  • only the visitor's own scrolling counts (wheel / touch / keys). Snap settling,
    //    ScrollSmoother's inertia and rail jumps move the page too, and used to make the
    //    bar flicker when you stopped; those movements are ignored now.
    //  • hysteresis: 40px of travel down to hide, 24px up to show (no jitter at the threshold)
    //  • one GSAP tween owns the transform (no CSS transition fighting it), overwrite: true
    const header = document.getElementById("header");
    let hidden = false, lastY = 0, travel = 0, lastInput = 0;
    const markInput = () => { lastInput = performance.now(); };
    ["wheel", "touchmove", "keydown", "pointerdown"].forEach((ev) => window.addEventListener(ev, markInput, { passive: true }));
    const showHeader = (show) => {
      if (hidden === !show) return;
      hidden = !show;
      gsap.to(header, { yPercent: show ? 0 : -105, duration: show ? 0.55 : 0.45, ease: show ? "power3.out" : "power2.in", overwrite: true });
    };
    header.addEventListener("focusin", () => showHeader(true));            // keyboard users always see it
    ScrollTrigger.create({
      start: 0, end: "max",
      onUpdate: (self) => {
        const y = self.scroll(), dy = y - lastY;
        lastY = y;
        header.classList.toggle("is-solid", y > 40);
        if (y < 120) { travel = 0; return showHeader(true); }               // always visible near the top
        if (performance.now() - lastInput > 220) return;                    // not the visitor: inertia / rail jump
        travel = Math.sign(dy) === Math.sign(travel) ? travel + dy : dy;    // reset on direction change
        if (travel > 40) showHeader(false);
        else if (travel < -24) showHeader(true);
      },
    });
    gsap.utils.toArray(".on-light, .on-parchment").forEach((sec) => {
      ScrollTrigger.create({
        trigger: sec, start: "top 64px", end: "bottom 64px",
        toggleClass: { targets: header, className: "is-light" },
      });
    });

    // in-page links go through the smoother
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length < 2) return;
        e.preventDefault();
        smoother ? smoother.scrollTo(id, true, "top top") : gsap.to(window, { scrollTo: id, duration: 1, ease: "power2.inOut" });
      });
    });
  }

  /* ---------------------------------------------------------------------
     Boot
     --------------------------------------------------------------------- */
  fetch(FRAMES_DIR + "manifest.json")
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .catch(() => ({ count: 625, width: PORTRAIT ? 648 : 1920, height: 1080, pad: 4, scenes: [] }))
    .then((meta) => {
      // show the poster immediately, then stream the rest
      const poster = new Image();
      poster.onload = () => {
        if (!film.loaded[0]) { film.imgs[0] = poster; film.loaded[0] = true; }
        film.dirty = true;
      };
      poster.src = FRAMES_DIR + "poster.webp";
      loadFrames(meta);
      sizeCanvas();
      const story = buildStory();
      afterFilm();
      heroIntro();
      window.addEventListener("resize", sizeCanvas);
      // rotate / resize across the portrait threshold: swap to the matching frame set
      let swapTimer;
      window.addEventListener("resize", () => {
        clearTimeout(swapTimer);
        swapTimer = setTimeout(() => {
          const p = isPortrait();
          if (p === PORTRAIT) return;
          PORTRAIT = p;
          FRAMES_DIR = p ? "assets/frames-sm/" : "assets/frames/";
          fetch(FRAMES_DIR + "manifest.json").then((r) => r.json()).then((m) => loadFrames(m, FRAMES_DIR)).catch(() => {});
        }, 250);
      });
      new ResizeObserver(sizeCanvas).observe(canvas);
      // QA hook for the contrast audit (tools/contrast_audit.sh): ?qa=3 parks the film on
      // chapter 3's hold; &bg=1 hides the copy so the background behind it can be measured.
      const qa = new URLSearchParams(location.search);
      if (qa.has("qa")) {
        const i = +qa.get("qa"), st = story.st, tl = story.tl;
        st.kill(true);                                   // no scrolling: seek the timeline directly
        tl.seek(tl.labels[`ch${i}`]);
        film.shown = film.frame; film.dirty = true;
        gsap.globalTimeline.getChildren(false, true, true).forEach((t) => { if (t !== tl && t.progress() < 1) t.progress(1); });
        const want = Math.floor(film.frame);
        const finish = () => {
          if (!film.loaded[want]) return setTimeout(finish, 100);   // wait for the exact frame
          film.dirty = true; render();
          const boxes = [...chapters[i].querySelectorAll(".display, p, li, .num, .eyebrow")].map((el) => {
            const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
            return { sel: el.className || el.tagName, x: r.x, y: r.y, w: r.width, h: r.height, color: cs.color, size: parseFloat(cs.fontSize), weight: cs.fontWeight };
          });
          if (qa.has("bg")) document.documentElement.classList.add("qa-bg");
          document.body.dataset.qa = JSON.stringify(boxes);
        };
        finish();
        return;
      }
      // browsers restore the old scroll position after load; start on the hero unless a #section was linked
      const toTop = () => { if (!location.hash) { smoother ? smoother.scrollTop(0) : window.scrollTo(0, 0); ScrollTrigger.update(); } };
      document.readyState === "complete" ? toTop() : window.addEventListener("load", () => setTimeout(toTop, 0), { once: true });
      document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
    });
})();
