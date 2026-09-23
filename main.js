/* ============================================================
   NISHANT DAHIYA — DIGITAL UNIVERSE · shared engine (vanilla JS)
   ============================================================ */
(function () {
  "use strict";
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------------- boot screen ---------------- */
  const boot = $("#boot");
  if (boot) {
    if (store.get("nx_booted", "0") === "1") boot.classList.add("fast");
    const finish = () => {
      if (boot.classList.contains("done")) return;
      boot.classList.add("done");
      store.set("nx_booted", "1");
      setTimeout(() => boot.remove(), 700);
    };
    const delay = boot.classList.contains("fast") ? 750 : 1900;
    const t = setTimeout(finish, delay);
    boot.addEventListener("click", () => { clearTimeout(t); finish(); });
    window.addEventListener("keydown", function once() { clearTimeout(t); finish(); window.removeEventListener("keydown", once); });
  }

  /* ---------------- page transition in ---------------- */
  document.body.classList.add("fx-in");
  setTimeout(() => document.body.classList.remove("fx-in"), 650);

  /* ---------------- nav ---------------- */
  const nav = $("#nav");
  const onScroll = () => nav && nav.classList.toggle("compact", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const burger = $(".nav-burger");
  if (burger) burger.addEventListener("click", () => {
    const open = document.body.classList.toggle("menu-open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  });
  window.addEventListener("resize", () => { if (window.innerWidth > 900) document.body.classList.remove("menu-open"); });

  /* ---------------- page transitions (out) ---------------- */
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const a = e.target.closest("a[data-nav]");
    if (!a) return;
    const href = a.getAttribute("href");
    if (!href || href.startsWith("http") || href.startsWith("#")) return;
    e.preventDefault();
    document.body.classList.remove("menu-open");
    if (reduced) { location.href = href; return; }
    document.body.classList.add("fx-out");
    setTimeout(() => { location.href = href; }, 300);
  });

  /* ---------------- background canvas: stars + particles + trails ---------------- */
  const canvas = $("#bg-canvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let W, H, dpr, stars = [], dust = [], trails = [], running = true, raf = null;
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.width = Math.floor(innerWidth * dpr);
      H = canvas.height = Math.floor(innerHeight * dpr);
      const area = (innerWidth * innerHeight) / 1e6;
      const nStars = Math.min(150, Math.round(70 * area + 40));
      const nDust = Math.min(46, Math.round(24 * area + 10));
      stars = Array.from({ length: nStars }, () => ({
        x: Math.random() * W, y: Math.random() * H, r: (Math.random() * 1.3 + 0.3) * dpr,
        tw: Math.random() * Math.PI * 2, sp: 0.4 + Math.random() * 1.2,
        hue: Math.random() < 0.72 ? "200,215,255" : (Math.random() < 0.5 ? "190,150,255" : "140,235,255")
      }));
      dust = Array.from({ length: nDust }, () => ({
        x: Math.random() * W, y: Math.random() * H, r: (Math.random() * 2.2 + 0.8) * dpr,
        vx: (Math.random() - 0.5) * 0.16 * dpr, vy: (-0.06 - Math.random() * 0.16) * dpr,
        a: 0.05 + Math.random() * 0.16, c: Math.random() < 0.5 ? "139,92,246" : "34,211,238"
      }));
    }
    function spawnTrail() {
      if (trails.length > 2 || Math.random() > 0.006) return;
      const fromLeft = Math.random() < 0.5;
      trails.push({ x: fromLeft ? -100 : W + 100, y: Math.random() * H * 0.7, vx: (fromLeft ? 1 : -1) * (5 + Math.random() * 4) * dpr, life: 1 });
    }
    let tPrev = performance.now();
    function frame(t) {
      raf = requestAnimationFrame(frame);
      if (!running) return;
      const dt = Math.min(48, t - tPrev); tPrev = t;
      ctx.clearRect(0, 0, W, H);
      // stars
      for (const s of stars) {
        s.tw += 0.0016 * dt * s.sp;
        const a = 0.35 + Math.sin(s.tw) * 0.3;
        ctx.fillStyle = "rgba(" + s.hue + "," + a.toFixed(2) + ")";
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill();
      }
      // dust
      for (const d of dust) {
        d.x += d.vx * dt * 0.06; d.y += d.vy * dt * 0.06;
        if (d.y < -10) { d.y = H + 10; d.x = Math.random() * W; }
        if (d.x < -10) d.x = W + 10; else if (d.x > W + 10) d.x = -10;
        ctx.fillStyle = "rgba(" + d.c + "," + d.a + ")";
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.2832); ctx.fill();
      }
      // light trails
      spawnTrail();
      trails = trails.filter(tr => tr.life > 0);
      for (const tr of trails) {
        tr.x += tr.vx * dt * 0.06; tr.life -= 0.004 * dt * 0.06;
        const g = ctx.createLinearGradient(tr.x, tr.y, tr.x - tr.vx * 14, tr.y);
        g.addColorStop(0, "rgba(140,235,255," + (0.5 * tr.life).toFixed(2) + ")");
        g.addColorStop(1, "rgba(139,92,246,0)");
        ctx.strokeStyle = g; ctx.lineWidth = 1.4 * dpr;
        ctx.beginPath(); ctx.moveTo(tr.x, tr.y); ctx.lineTo(tr.x - tr.vx * 14, tr.y); ctx.stroke();
      }
    }
    size();
    window.addEventListener("resize", size);
    document.addEventListener("visibilitychange", () => { running = !document.hidden; });
    if (reduced) {
      // one static render
      running = true; frame(performance.now()); cancelAnimationFrame(raf); running = false;
      ctx.clearRect(0, 0, W, H);
      for (const s of stars) { ctx.fillStyle = "rgba(" + s.hue + ",0.5)"; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill(); }
    } else {
      raf = requestAnimationFrame(frame);
    }
  }

  /* ---------------- mouse light ---------------- */
  if (finePointer && !reduced) {
    const ml = document.createElement("div");
    ml.style.cssText = "position:fixed;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(340px 340px at var(--mx,50%) var(--my,50%),rgba(139,92,246,0.10),transparent 70%);transition:opacity .4s";
    document.body.appendChild(ml);
    let mx = 0, my = 0, tx = 0, ty = 0, ticking = false;
    window.addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; if (!ticking) { ticking = true; requestAnimationFrame(() => { ml.style.setProperty("--mx", tx + "px"); ml.style.setProperty("--my", ty + "px"); ticking = false; }); } }, { passive: true });
  }

  /* ---------------- cursor follower ---------------- */
  if (finePointer && !reduced) {
    const dot = $("#cursor-dot"), glow = $("#cursor-glow");
    if (dot && glow) {
      document.body.classList.add("cursor-on");
      let x = innerWidth / 2, y = innerHeight / 2, gx = x, gy = y;
      window.addEventListener("pointermove", (e) => {
        x = e.clientX; y = e.clientY;
        dot.style.transform = "translate(" + (x - 3) + "px," + (y - 3) + "px)";
        const t = e.target.closest("button, .btn, .gate-btn") ? "cursor-btn"
          : e.target.closest(".work-card, .glass, .g-item, .stat-card, .home-card, .proj, .skill-cat, .channel") ? "cursor-card"
          : e.target.closest("a") ? "cursor-link" : "";
        document.body.classList.toggle("cursor-btn", t === "cursor-btn");
        document.body.classList.toggle("cursor-card", t === "cursor-card");
        document.body.classList.toggle("cursor-link", t === "cursor-link");
      }, { passive: true });
      (function loop() {
        gx += (x - gx) * 0.16; gy += (y - gy) * 0.16;
        glow.style.transform = "translate(" + (gx - glow.offsetWidth / 2) + "px," + (gy - glow.offsetHeight / 2) + "px)";
        requestAnimationFrame(loop);
      })();
    }
  }

  /* ---------------- magnetic buttons ---------------- */
  if (finePointer && !reduced) {
    $$("[data-magnetic]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width / 2) / r.width;
        const dy = (e.clientY - r.top - r.height / 2) / r.height;
        el.style.transform = "translate(" + dx * 10 + "px," + dy * 8 + "px)";
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  /* ---------------- card tilt ---------------- */
  if (finePointer && !reduced) {
    $$("[data-tilt]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = "perspective(900px) rotateX(" + (-py * 5) + "deg) rotateY(" + (px * 6) + "deg) translateY(-4px)";
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  /* ---------------- scroll reveal ---------------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("on"); io.unobserve(en.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal").forEach((el) => io.observe(el));

  /* ---------------- meters (skills / projects) ---------------- */
  const mio = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const fill = en.target;
      fill.style.width = fill.dataset.level + "%";
      mio.unobserve(fill);
    });
  }, { threshold: 0.4 });
  $$(".meter i[data-level]").forEach((el) => mio.observe(el));

  /* ---------------- hero role rotator ---------------- */
  const rot = $(".hero-roles .rot");
  if (rot) {
    const roles = ["AI EXPERT", "WEB DEVELOPER", "UI/UX CREATOR", "DIGITAL BUILDER", "HOSTING ENTHUSIAST", "MINECRAFT DEVELOPER", "FUTURISTIC DESIGNER"];
    let ri = 0, ci = 0, deleting = false;
    if (reduced) { rot.textContent = roles[0]; }
    else (function tick() {
      const word = roles[ri];
      ci += deleting ? -1 : 1;
      rot.textContent = word.slice(0, ci);
      let wait = deleting ? 34 : 68;
      if (!deleting && ci === word.length) { wait = 1500; deleting = true; }
      else if (deleting && ci === 0) { deleting = false; ri = (ri + 1) % roles.length; wait = 260; }
      setTimeout(tick, wait);
    })();
  }

  /* ---------------- terminal typing ---------------- */
  $$("[data-term]").forEach((term) => {
    const lines = $$(".t-line", term);
    const caret = $('.term-caret', term);
    lines.forEach((l) => { l.dataset.txt = l.textContent; l.textContent = ""; });
    const tio = new IntersectionObserver((en) => {
      if (!en[0].isIntersecting) return;
      tio.disconnect();
      if (reduced) { lines.forEach((l) => { l.textContent = l.dataset.txt; }); return; }
      let li = 0;
      (function nextLine() {
        if (li >= lines.length) return;
        const line = lines[li]; const txt = line.dataset.txt; let ci = 0;
        (function type() {
          ci++;
          line.textContent = txt.slice(0, ci);
          if (ci < txt.length) setTimeout(type, 16 + Math.random() * 22);
          else { li++; setTimeout(nextLine, 180); }
        })();
      })();
    }, { threshold: 0.35 });
    tio.observe(term);
  });

  /* ---------------- copy buttons ---------------- */
  $$("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const txt = btn.dataset.copy;
      try { await navigator.clipboard.writeText(txt); }
      catch (e) {
        const ta = document.createElement("textarea");
        ta.value = txt; document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); } catch (e2) {}
        ta.remove();
      }
      const old = btn.textContent;
      btn.textContent = "COPIED ✓";
      setTimeout(() => { btn.textContent = old; }, 1400);
    });
  });

  /* ---------------- digital world ---------------- */
  const world = $("#world");
  if (world) {
    const nodes = $$(".world-node", world);
    const svg = $(".world-svg", world);
    const NS = "http://www.w3.org/2000/svg";
    function drawLines() {
      svg.innerHTML = "";
      const wr = world.getBoundingClientRect();
      const core = { x: wr.width / 2, y: wr.height / 2 };
      const pts = nodes.map((n) => {
        const r = n.getBoundingClientRect();
        return { x: r.left - wr.left + r.width / 2, y: r.top - wr.top + r.height / 2 - 10 };
      });
      pts.forEach((p) => {
        const l = document.createElementNS(NS, "line");
        l.setAttribute("x1", core.x); l.setAttribute("y1", core.y);
        l.setAttribute("x2", p.x); l.setAttribute("y2", p.y);
        svg.appendChild(l);
      });
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        const l = document.createElementNS(NS, "line");
        l.setAttribute("x1", a.x); l.setAttribute("y1", a.y);
        l.setAttribute("x2", b.x); l.setAttribute("y2", b.y);
        l.style.opacity = "0.35";
        svg.appendChild(l);
      }
    }
    drawLines();
    window.addEventListener("resize", drawLines);
    window.addEventListener("load", drawLines);
    if (finePointer && !reduced) {
      world.addEventListener("pointermove", (e) => {
        const r = world.getBoundingClientRect();
        const dx = (e.clientX - r.left) / r.width - 0.5;
        const dy = (e.clientY - r.top) / r.height - 0.5;
        nodes.forEach((n, i) => {
          const depth = 10 + (i % 3) * 8;
          n.style.marginLeft = dx * depth + "px";
          n.style.marginTop = dy * depth + "px";
        });
      });
      world.addEventListener("pointerleave", () => nodes.forEach((n) => { n.style.marginLeft = ""; n.style.marginTop = ""; }));
    }
  }

  /* ---------------- status page clock ---------------- */
  const clockEl = $("#clock-time"), dateEl = $("#clock-date"), upEl = $("#uptime");
  if (clockEl) {
    const fmtT = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    const fmtD = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", weekday: "long", day: "2-digit", month: "long", year: "numeric" });
    const t0 = Date.now();
    const tick = () => {
      const now = new Date();
      clockEl.textContent = fmtT.format(now);
      dateEl.textContent = fmtD.format(now).toUpperCase();
      if (upEl) {
        const s = Math.floor((Date.now() - t0) / 1000);
        upEl.textContent = String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
      }
    };
    tick(); setInterval(tick, 1000);
  }

  /* ---------------- gallery filter + lightbox ---------------- */
  const gItems = $$(".g-item");
  if (gItems.length) {
    $$(".g-filter").forEach((btn) => {
      btn.addEventListener("click", () => {
        $$(".g-filter").forEach((b) => b.classList.remove("on"));
        btn.classList.add("on");
        const f = btn.dataset.filter;
        gItems.forEach((it) => it.classList.toggle("hidden", f !== "all" && it.dataset.cat !== f));
      });
    });
    const lb = $("#lightbox");
    if (lb) {
      const lbImg = $("img", lb), lbCap = $("figcaption", lb);
      let idx = 0;
      const visible = () => gItems.filter((i) => !i.classList.contains("hidden"));
      function open(i) {
        const list = visible();
        idx = (i + list.length) % list.length;
        const img = $("img", list[idx]);
        lbImg.src = img.src; lbImg.alt = img.alt;
        lbCap.textContent = list[idx].dataset.caption || img.alt;
        lb.classList.add("on");
        document.body.style.overflow = "hidden";
      }
      function close() { lb.classList.remove("on"); document.body.style.overflow = ""; }
      gItems.forEach((it) => it.addEventListener("click", () => open(visible().indexOf(it))));
      $(".lb-close", lb).addEventListener("click", close);
      $(".lb-prev", lb).addEventListener("click", () => open(idx - 1));
      $(".lb-next", lb).addEventListener("click", () => open(idx + 1));
      lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
      window.addEventListener("keydown", (e) => {
        if (!lb.classList.contains("on")) return;
        if (e.key === "Escape") close();
        if (e.key === "ArrowLeft") open(idx - 1);
        if (e.key === "ArrowRight") open(idx + 1);
      });
    }
  }

  /* ---------------- contact form (static, backend-ready) ---------------- */
  const form = $("#contact-form");
  if (form) {
    const status = $("#form-status");
    /* BACKEND INTEGRATION POINT:
       set form.dataset.endpoint to your API URL (e.g. /api/contact) and this
       handler will POST JSON {name,email,message} instead of queueing locally. */
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      if (!data.name || !data.email || !data.message) {
        status.textContent = "⚠ ALL FIELDS REQUIRED FOR TRANSMISSION";
        status.style.color = "#fbbf24";
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        status.textContent = "⚠ EMAIL SIGNAL INVALID";
        status.style.color = "#fbbf24";
        return;
      }
      const endpoint = form.dataset.endpoint;
      if (endpoint) {
        try {
          status.style.color = "";
          status.textContent = "TRANSMITTING…";
          const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
          status.textContent = res.ok ? "✓ TRANSMISSION DELIVERED" : "⚠ TRANSMISSION FAILED — RETRY LATER";
          if (res.ok) form.reset();
        } catch (err) {
          status.textContent = "⚠ ENDPOINT UNREACHABLE";
        }
        return;
      }
      // static mode: queue locally, be honest about it
      const q = JSON.parse(store.get("nx_outbox", "[]"));
      q.push(Object.assign({ at: new Date().toISOString() }, data));
      store.set("nx_outbox", JSON.stringify(q));
      status.style.color = "";
      status.textContent = "◈ STORED LOCALLY (" + q.length + " in outbox) — STATIC MODE: NO BACKEND CONNECTED YET";
      form.reset();
    });
  }

  /* ============================================================
     AUDIO ENGINE — global mini player + music-room player
     ============================================================ */
  const audio = new Audio("phonk.mp3");
  audio.loop = true;
  audio.preload = "none";
  audio.volume = parseFloat(store.get("nx_vol", "0.7"));

  const mini = document.createElement("div");
  mini.className = "mini-player";
  mini.setAttribute("role", "region");
  mini.setAttribute("aria-label", "Background music player");
  mini.innerHTML =
    '<button class="mini-btn" aria-label="Play or pause background music">' +
    '<svg viewBox="0 0 24 24" class="ic-play"><path d="M8 5v14l11-7z"/></svg>' +
    '<svg viewBox="0 0 24 24" class="ic-pause" style="display:none"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg></button>' +
    '<div class="mini-meta"><b>PHONK FM</b><span class="mini-state">STANDBY</span></div>' +
    '<div class="mini-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></div>';
  document.body.appendChild(mini);

  const mBtn = $(".mini-btn", mini);
  const mState = $(".mini-state", mini);
  const icPlay = $(".ic-play", mini), icPause = $(".ic-pause", mini);

  function syncAudioUI() {
    const playing = !audio.paused;
    mini.classList.toggle("playing", playing);
    icPlay.style.display = playing ? "none" : "";
    icPause.style.display = playing ? "" : "none";
    mState.textContent = playing ? "AUDIO LINK ACTIVE" : "STANDBY";
    document.dispatchEvent(new CustomEvent("nx-audio", { detail: { playing } }));
  }
  audio.addEventListener("play", syncAudioUI);
  audio.addEventListener("pause", syncAudioUI);

  function toggleAudio() {
    if (audio.paused) {
      audio.play().catch(() => { mState.textContent = "TAP TO ENABLE"; });
    } else {
      audio.pause();
    }
  }
  mBtn.addEventListener("click", toggleAudio);

  // persistence across pages (best effort, no annoying autoplay fights)
  audio.addEventListener("timeupdate", () => store.set("nx_time", String(audio.currentTime)));
  window.addEventListener("pagehide", () => {
    store.set("nx_playing", audio.paused ? "0" : "1");
    store.set("nx_time", String(audio.currentTime));
  });
  /* AUTOPLAY armed (owner's wish). Browsers may still block sound until one
     user gesture — that is browser policy, so we fall back to first-tap. */
  const savedState = store.get("nx_playing", null);
  const wantAuto = savedState === null ? true : savedState === "1";
  function unlockOnce() {
    const resume = () => {
      audio.play().catch(() => {});
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
      window.removeEventListener("touchend", resume);
    };
    window.addEventListener("pointerdown", resume, { once: true });
    window.addEventListener("keydown", resume, { once: true });
    window.addEventListener("touchend", resume, { once: true });
    mState.textContent = "TAP ANYWHERE TO ENABLE AUDIO";
  }
  if (wantAuto) {
    const t = parseFloat(store.get("nx_time", "0"));
    if (savedState === "1" && !isNaN(t)) audio.currentTime = Math.min(t, 55);
    audio.play().catch(unlockOnce);
  }
  syncAudioUI();

  /* ---------------- music room (music.html) ---------------- */
  const gate = $("#music-gate");
  if (gate) {
    const playBtn = $("#mp-play");
    const viz = $("#mp-viz");
    const bar = $("#mp-bar");
    const barFill = $("#mp-bar i");
    const tCur = $("#mp-cur"), tDur = $("#mp-dur");
    const vol = $("#mp-vol");
    let actx = null, analyser = null, srcNode = null, dataArr = null, vizRaf = null;

    function initAnalyser() {
      if (actx) return;
      try {
        actx = new (window.AudioContext || window.webkitAudioContext)();
        srcNode = actx.createMediaElementSource(audio);
        analyser = actx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.82;
        srcNode.connect(analyser);
        analyser.connect(actx.destination);
        dataArr = new Uint8Array(analyser.frequencyBinCount);
      } catch (e) { analyser = null; }
    }
    function drawViz() {
      vizRaf = requestAnimationFrame(drawViz);
      if (!viz || document.hidden) return;
      const c = viz.getContext("2d");
      const w = viz.width = viz.clientWidth * Math.min(devicePixelRatio, 2);
      const h = viz.height = viz.clientHeight * Math.min(devicePixelRatio, 2);
      c.clearRect(0, 0, w, h);
      const bars = 48;
      if (analyser) analyser.getByteFrequencyData(dataArr);
      for (let i = 0; i < bars; i++) {
        let v;
        if (analyser && !audio.paused) v = dataArr[Math.floor(i * (dataArr.length / bars))] / 255;
        else v = audio.paused ? 0.04 + 0.02 * Math.sin(i * 0.6 + performance.now() / 900) : 0.2;
        const bh = Math.max(3, v * h * 0.92);
        const x = (i / bars) * w + 2;
        const bw = w / bars - 4;
        const g = c.createLinearGradient(0, h, 0, h - bh);
        g.addColorStop(0, "rgba(109,40,217,0.95)");
        g.addColorStop(1, "rgba(34,211,238,0.95)");
        c.fillStyle = g;
        c.shadowColor = "rgba(34,211,238,0.55)"; c.shadowBlur = 8;
        c.fillRect(x, h - bh, bw, bh);
      }
    }
    function fmt(s) { s = Math.floor(s || 0); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); }
    audio.addEventListener("timeupdate", () => {
      if (!bar) return;
      barFill.style.width = (audio.currentTime / (audio.duration || 61.7)) * 100 + "%";
      tCur.textContent = fmt(audio.currentTime);
    });
    audio.addEventListener("loadedmetadata", () => { tDur.textContent = fmt(audio.duration); });
    tDur.textContent = fmt(61.7);

    if (playBtn) playBtn.addEventListener("click", toggleAudio);
    document.addEventListener("nx-audio", (e) => {
      if (playBtn) {
        $(".ic-play", playBtn).style.display = e.detail.playing ? "none" : "";
        $(".ic-pause", playBtn).style.display = e.detail.playing ? "" : "none";
        playBtn.setAttribute("aria-label", e.detail.playing ? "Pause music" : "Play music");
      }
      const live = $("#mp-live");
      if (live) live.innerHTML = e.detail.playing ? '<span class="dot"></span> AUDIO LINK ACTIVE' : '<span class="dot" style="background:#6f6890;box-shadow:none;animation:none"></span> AUDIO LINK IDLE';
      // autoplay succeeded (or first-tap unlocked) → the gate opens by itself
      if (e.detail.playing && gate.isConnected) {
        gate.classList.add("off");
        setTimeout(() => gate.remove(), 800);
        initAnalyser();
        if (actx && actx.state === "suspended") actx.resume();
        if (!reduced && !vizRaf) drawViz();
      }
    });

    if (bar) {
      bar.addEventListener("click", (e) => {
        const r = bar.getBoundingClientRect();
        audio.currentTime = ((e.clientX - r.left) / r.width) * (audio.duration || 61.7);
      });
      bar.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") { audio.currentTime = Math.min((audio.duration || 61.7), audio.currentTime + 5); e.preventDefault(); }
        if (e.key === "ArrowLeft") { audio.currentTime = Math.max(0, audio.currentTime - 5); e.preventDefault(); }
      });
    }
    if (vol) {
      vol.value = audio.volume * 100;
      vol.style.setProperty("--val", vol.value + "%");
      vol.addEventListener("input", () => {
        audio.volume = vol.value / 100;
        vol.style.setProperty("--val", vol.value + "%");
        store.set("nx_vol", String(audio.volume));
      });
    }

    const enter = $("#gate-enter");
    enter.addEventListener("click", () => {
      gate.classList.add("off");
      setTimeout(() => gate.remove(), 800);
      initAnalyser();
      if (actx && actx.state === "suspended") actx.resume();
      audio.play().catch(() => {});
      if (!reduced && !vizRaf) drawViz();
    });
  }

  /* ---------------- console signature ---------------- */
  syncAudioUI();
  console.log("%c NISHANT DAHIYA %c DIGITAL UNIVERSE ONLINE ", "background:#6d28d9;color:#fff;font-weight:bold;padding:4px 8px;border-radius:4px 0 0 4px", "background:#0b0618;color:#22d3ee;padding:4px 8px;border-radius:0 4px 4px 0");
})();
