/* =========================================================
   Deepika Kashyap — portfolio interactions
   GSAP + ScrollTrigger + Lenis are loaded from a CDN. Every effect
   degrades gracefully: without them (or with reduced motion) the
   page is fully readable and navigable.
   ========================================================= */
(() => {
  "use strict";

  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  const animate = hasGSAP && !reduceMotion;

  if (animate) {
    gsap.registerPlugin(ScrollTrigger);
    root.classList.add("has-gsap");
  }

  /* ---------- year + local clock ---------- */
  $$(".js-year").forEach((el) => (el.textContent = new Date().getFullYear()));

  const timeFormat = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
  const timeEls = $$(".js-time");
  const tickClock = () => {
    const now = timeFormat.format(new Date());
    timeEls.forEach((el) => (el.textContent = now));
  };
  tickClock();
  setInterval(tickClock, 15000);

  /* ---------- text roll hover (duplicate label for the slide-up) ---------- */
  $$(".roll").forEach((el) => {
    const text = el.textContent.trim();
    el.innerHTML = "";
    const inner = document.createElement("span");
    inner.className = "roll__in";
    inner.dataset.text = text;
    inner.textContent = text;
    el.appendChild(inner);
  });

  /* ---------- smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (animate && typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const scrollToTarget = (target) => {
    if (lenis) {
      lenis.scrollTo(target === "top" ? 0 : target, { duration: 1.6 });
    } else if (target === "top") {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    } else {
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    }
  };

  /* ---------- fullscreen menu ---------- */
  const menu = $("#menu");
  const menuBtn = $("#menuBtn");
  let menuOpen = false;

  const setMenu = (open) => {
    if (!menu || !menuBtn || open === menuOpen) return;
    menuOpen = open;
    root.classList.toggle("is-menu-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    $(".nav__menu-label", menuBtn).textContent = open ? "close" : "menu";
    menu.inert = !open;
    if (open) {
      lenis?.stop();
      setTimeout(() => $("a", menu)?.focus({ preventScroll: true }), 300);
    } else {
      lenis?.start();
    }
  };

  menuBtn?.addEventListener("click", () => setMenu(!menuOpen));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuOpen) {
      setMenu(false);
      menuBtn.focus();
    }
  });
  window.matchMedia("(min-width: 901px)").addEventListener("change", (e) => e.matches && setMenu(false));

  /* ---------- in-page anchors ---------- */
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const hash = link.getAttribute("href");
    const target = hash === "#top" ? "top" : document.querySelector(hash);
    if (!target) return;
    e.preventDefault();
    const wasOpen = menuOpen;
    setMenu(false);
    // let the menu start closing before we travel
    setTimeout(() => {
      scrollToTarget(target);
      const focusEl = target === "top" ? $("#main") : target;
      if (focusEl) {
        if (!focusEl.hasAttribute("tabindex")) focusEl.setAttribute("tabindex", "-1");
        focusEl.focus({ preventScroll: true });
      }
    }, wasOpen ? 250 : 0);
  });

  /* ---------- nav state + scroll progress ---------- */
  const nav = $("#nav");
  const progressBar = $("#progressBar");
  let lastY = window.scrollY;
  let scrollTicking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar) progressBar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (nav) {
      nav.classList.toggle("is-scrolled", y > 40);
      const goingDown = y > lastY + 2;
      const goingUp = y < lastY - 2;
      if (goingDown && y > window.innerHeight * 0.6 && !menuOpen) nav.classList.add("is-hidden");
      else if (goingUp || y < 80) nav.classList.remove("is-hidden");
    }
    lastY = y;
    scrollTicking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!scrollTicking) {
        scrollTicking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true }
  );
  onScroll();

  // keyboard users should always see the nav
  nav?.addEventListener("focusin", () => nav.classList.remove("is-hidden"));

  /* ---------- active nav link ---------- */
  const navLinks = $$(".nav__links a");
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = `#${entry.target.id}`;
        navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === id));
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  $$("main section[id]").forEach((s) => sectionObserver.observe(s));

  /* ---------- in-view flags for CSS-driven figures ---------- */
  const inviewObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-inview");
          inviewObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.35 }
  );
  $$("[data-inview]").forEach((el) => inviewObserver.observe(el));

  // SMIL packet animation ignores CSS media queries — pause it manually
  if (reduceMotion) $$(".viz").forEach((svg) => svg.pauseAnimations?.());

  /* ---------- role scramble ---------- */
  const roles = [
    "Full-Stack Developer",
    "AI / ML Engineer",
    "ECE Undergrad @ CSJMU",
    "Open-Source Contributor",
  ];
  const roleEl = $("#role");
  const glyphs = "!<>-_\\/[]{}=+*^?#01";

  const scrambleTo = (el, text) =>
    new Promise((resolve) => {
      const from = el.textContent;
      const length = Math.max(from.length, text.length);
      const queue = [];
      for (let i = 0; i < length; i++) {
        const start = Math.floor(Math.random() * 16);
        queue.push({ from: from[i] || "", to: text[i] || "", start, end: start + 8 + Math.floor(Math.random() * 16) });
      }
      let frame = 0;
      const update = () => {
        let out = "";
        let done = 0;
        for (const q of queue) {
          if (frame >= q.end) {
            done++;
            out += q.to;
          } else if (frame >= q.start) {
            out += glyphs[Math.floor(Math.random() * glyphs.length)];
          } else {
            out += q.from;
          }
        }
        el.textContent = out;
        if (done === queue.length) resolve();
        else {
          frame++;
          requestAnimationFrame(update);
        }
      };
      update();
    });

  const startRoleCycle = () => {
    if (!roleEl || reduceMotion) return;
    let i = 0;
    const next = () => {
      i = (i + 1) % roles.length;
      scrambleTo(roleEl, roles[i]).then(() => setTimeout(next, 2400));
    };
    setTimeout(next, 2400);
  };

  /* ---------- custom cursor ---------- */
  const initCursor = () => {
    const cursor = $("#cursor");
    if (!cursor || !finePointer || reduceMotion) return;
    root.classList.add("has-cursor");

    const dot = $(".cursor__dot", cursor);
    const ring = $(".cursor__ring", cursor);
    const label = $("#cursorLabel");
    let mx = -100, my = -100, rx = -100, ry = -100;
    let visible = false;

    window.addEventListener("mousemove", (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      if (!visible) {
        visible = true;
        rx = mx;
        ry = my;
        cursor.classList.add("is-visible");
      }
    }, { passive: true });

    document.addEventListener("mouseleave", () => { visible = false; cursor.classList.remove("is-visible"); });
    window.addEventListener("mousedown", () => cursor.classList.add("is-down"));
    window.addEventListener("mouseup", () => cursor.classList.remove("is-down"));

    document.addEventListener("mouseover", (e) => {
      const t = e.target;
      const labelled = t.closest("[data-cursor]");
      const interactive = t.closest("a, button, .stack__items li, .award");
      cursor.classList.toggle("is-label", !!labelled);
      cursor.classList.toggle("is-hover", !labelled && !!interactive);
      cursor.classList.toggle("is-light", !!t.closest('[data-theme="light"]'));
      if (labelled) label.textContent = labelled.dataset.cursor;
    });

    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };

  /* ---------- magnetic elements ---------- */
  const initMagnetic = () => {
    if (!animate || !finePointer) return;
    $$("[data-magnetic]").forEach((el) => {
      const strength = parseFloat(el.dataset.magnetic) || 0.35;
      const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * strength);
        yTo((e.clientY - (r.top + r.height / 2)) * strength);
      });
      el.addEventListener("mouseleave", () => {
        gsap.to(el, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.35)", overwrite: true });
      });
    });
  };

  /* ---------- hero "signal field" canvas ----------
     Stacked waveform lines (think pulsar plot / oscilloscope) that
     bulge around the cursor. Lower lines occlude the ones behind. */
  const initSignalField = () => {
    const canvas = $("#signalField");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const hero = canvas.parentElement;
    const bg = getComputedStyle(root).getPropertyValue("--bg").trim() || "#07090a";

    let w = 0, h = 0, lineCount = 0, step = 8;
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, power: 0, targetPower: 0 };
    let running = false;
    let rafId = 0;
    let fade = reduceMotion ? 1 : 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lineCount = w < 700 ? 20 : 30;
      step = w < 700 ? 10 : 7;
    };

    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      const top = h * 0.26;
      const bottom = h * 1.02;
      const gap = (bottom - top) / lineCount;
      const narrow = w < 700;
      const centre = narrow ? 0.5 : 0.58;
      const spread = narrow ? 0.32 : 0.2;
      const amp = narrow ? 1.9 : 3.6;
      const freq = narrow ? 0.45 : 1;

      mouse.x += (mouse.tx - mouse.x) * 0.12;
      mouse.y += (mouse.ty - mouse.y) * 0.12;
      mouse.power += (mouse.targetPower - mouse.power) * 0.06;

      const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 280);
      grad.addColorStop(0, `rgba(61,255,160,${0.95 * fade})`);
      grad.addColorStop(1, `rgba(236,242,238,${0.2 * fade})`);

      ctx.lineWidth = 1.2;
      ctx.lineJoin = "round";
      ctx.fillStyle = bg;
      ctx.strokeStyle = mouse.power > 0.01 ? grad : `rgba(236,242,238,${0.2 * fade})`;

      for (let i = 0; i < lineCount; i++) {
        const baseY = top + i * gap;
        const seed = i * 1.618;
        const line = new Path2D();
        for (let x = -step; x <= w + step; x += step) {
          const nx = x / w;
          const env = Math.exp(-Math.pow((nx - centre) / spread, 2));
          const wave =
            Math.sin(nx * 21 * freq + t * 0.0011 + seed) * 0.45 +
            Math.sin(nx * 47 * freq - t * 0.0019 + seed * 2.3) * 0.25 +
            Math.sin(nx * 9 * freq + t * 0.0006 + seed * 0.7) * 0.6;
          let y = baseY - Math.abs(wave) * env * gap * amp - env * gap * 0.6;
          const dx = x - mouse.x;
          const dy = baseY - mouse.y;
          const m = Math.exp(-(dx * dx + dy * dy) / (2 * 120 * 120));
          y -= m * mouse.power * gap * (2.4 + Math.sin(t * 0.008 + x * 0.06) * 0.9);
          if (x === -step) line.moveTo(x, y);
          else line.lineTo(x, y);
        }
        const fill = new Path2D(line);
        fill.lineTo(w + step, h + 10);
        fill.lineTo(-step, h + 10);
        fill.closePath();
        ctx.fill(fill);
        ctx.stroke(line);
      }
    };

    const frame = (t) => {
      if (fade < 1) fade = Math.min(1, fade + 0.015);
      draw(t);
      rafId = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || reduceMotion) return;
      running = true;
      rafId = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(rafId);
    };

    resize();
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        if (reduceMotion) draw(2000);
      }, 120);
    });

    if (reduceMotion) {
      draw(2000);
      return;
    }

    if (finePointer) {
      hero.addEventListener("mousemove", (e) => {
        const r = canvas.getBoundingClientRect();
        mouse.tx = e.clientX - r.left;
        mouse.ty = e.clientY - r.top;
        if (mouse.x < -1000) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
        mouse.targetPower = 1;
      });
      hero.addEventListener("mouseleave", () => (mouse.targetPower = 0));
    }

    new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop())).observe(hero);
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  };

  /* ---------- split helpers ---------- */
  const splitWords = (el) => {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(" "));
              return;
            }
            const w = document.createElement("span");
            w.className = "w";
            const inner = document.createElement("span");
            inner.className = "w__i";
            inner.textContent = part;
            w.appendChild(inner);
            frag.appendChild(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== "BR") {
          walk(child);
        }
      });
    };
    walk(el);
    return $$(".w__i", el);
  };

  const splitChars = (el) => {
    const text = el.textContent.trim();
    el.textContent = "";
    return Array.from(text).map((ch) => {
      const c = document.createElement("span");
      c.className = "c";
      const inner = document.createElement("span");
      inner.className = "c__i";
      inner.textContent = ch;
      c.appendChild(inner);
      el.appendChild(c);
      return inner;
    });
  };

  /* ---------- hero intro ---------- */
  const heroChars = animate ? $$("[data-split-chars]").flatMap(splitChars) : [];
  const heroIntroEls = $$(".hero [data-intro]");
  if (animate) {
    gsap.set(heroChars, { yPercent: 110 });
    gsap.set(heroIntroEls, { autoAlpha: 0, y: 24 });
  }

  const playIntro = () => {
    startRoleCycle();
    if (!animate) return;
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.to(heroChars, { yPercent: 0, duration: 1.4, stagger: 0.045 })
      .to(heroIntroEls, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.08 }, 0.35);
  };

  /* ---------- preloader ---------- */
  const preloader = $("#preloader");
  const finishPreloader = () => {
    preloader?.classList.add("is-done");
    preloader?.remove();
    lenis?.start();
    if (animate) ScrollTrigger.refresh();
  };

  const runPreloader = () => {
    const skip = !animate || !preloader || root.classList.contains("is-failsafe");
    if (skip) {
      preloader?.remove();
      playIntro();
      return;
    }

    lenis?.stop();
    window.scrollTo(0, 0);
    const countEl = $("#loaderCount");
    const counter = { v: 0 };
    const count = gsap.timeline();
    count
      .to(counter, {
        v: 100,
        duration: 1.7,
        ease: "power2.inOut",
        onUpdate: () => (countEl.textContent = String(Math.round(counter.v)).padStart(3, "0")),
      })
      .to("#loaderWave", { strokeDashoffset: 0, duration: 1.7, ease: "power2.inOut" }, 0);

    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    Promise.all([count.then(), fontsReady]).then(() => {
      const exit = gsap.timeline({ onComplete: finishPreloader });
      exit
        .to(".preloader__row, .preloader__count, .preloader__wave", { autoAlpha: 0, y: -30, duration: 0.5, ease: "power2.in", stagger: 0.04 })
        .to(preloader, { clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "expo.inOut" }, 0.25)
        .add(playIntro, 0.75);
    });
  };

  /* ---------- scroll-driven animation ---------- */
  const initScrollAnimations = () => {
    if (!animate) return;

    // hero parallax on the way out
    gsap.to(".hero__title", {
      yPercent: 18,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
    gsap.to(".hero__canvas", {
      autoAlpha: 0.15,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "center top", end: "bottom top", scrub: true },
    });

    // headings: word mask reveal
    $$("[data-split]").forEach((el) => {
      const words = splitWords(el);
      gsap.from(words, {
        yPercent: 110,
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.06,
        scrollTrigger: { trigger: el, start: "top 85%" },
      });
    });

    // about statement: words light up as you read
    $$("[data-scrub-words]").forEach((el) => {
      const words = splitWords(el);
      gsap.fromTo(
        words,
        { opacity: 0.14 },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.1,
          scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: 0.6 },
        }
      );
    });

    // generic fade-up reveals, batched so siblings stagger together
    gsap.set("[data-reveal]", { autoAlpha: 0, y: 48 });
    ScrollTrigger.batch("[data-reveal]", {
      start: "top 88%",
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.1, ease: "expo.out", stagger: 0.08, overwrite: true }),
    });

    // stat counters
    $$("[data-count]").forEach((el) => {
      const end = parseFloat(el.dataset.count);
      const decimals = parseInt(el.dataset.decimals || "0", 10);
      const obj = { v: 0 };
      el.textContent = (0).toFixed(decimals);
      gsap.to(obj, {
        v: end,
        duration: 2,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
        onUpdate: () => (el.textContent = obj.v.toFixed(decimals)),
      });
    });

    // contact: the green panel rises in
    gsap.from(".contact__inner", {
      y: 120,
      ease: "none",
      scrollTrigger: { trigger: ".contact", start: "top bottom", end: "top 30%", scrub: true },
    });

    // footer mega name slides up
    gsap.from(".footer__mega span", {
      yPercent: 60,
      ease: "none",
      scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true },
    });
  };

  /* ---------- velocity-aware marquee ---------- */
  const initMarquee = () => {
    if (!animate) return;
    $$("[data-marquee]").forEach((marquee) => {
      const track = $(".marquee__track", marquee);
      const group = $(".marquee__group", marquee);
      let width = group.offsetWidth;
      let x = 0;
      let dir = -1;
      let boost = 0;

      window.addEventListener("resize", () => (width = group.offsetWidth));
      ScrollTrigger.create({
        trigger: marquee,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          dir = self.direction === 1 ? -1 : 1;
          boost = Math.min(Math.abs(self.getVelocity()) / 120, 14);
        },
      });

      gsap.ticker.add((_, delta) => {
        boost *= 0.92;
        x += dir * (0.6 + boost) * (delta / 16.67);
        if (x <= -width) x += width;
        if (x > 0) x -= width;
        track.style.transform = `translate3d(${x}px,0,0) skewX(${(-dir * boost * 0.6).toFixed(2)}deg)`;
      });
    });
  };

  /* ---------- pinned horizontal work gallery (desktop) ---------- */
  const initWork = () => {
    if (!animate) return;
    const pin = $(".work__pin");
    const track = $(".work__track");
    const idxEl = $("#workIdx");
    const bar = $("#workBar");
    const total = $$(".project", track).length;
    if (!pin || !track) return;

    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px) and (min-height: 560px)", () => {
      root.classList.add("work-horizontal");
      const distance = () => track.scrollWidth - window.innerWidth;

      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (bar) bar.style.transform = `scaleX(${self.progress})`;
            if (idxEl) idxEl.textContent = String(Math.min(total, Math.floor(self.progress * total) + 1)).padStart(2, "0");
          },
        },
      });

      // subtle inner parallax on each figure while it travels across
      $$(".screen .viz", track).forEach((viz) => {
        gsap.fromTo(
          viz,
          { xPercent: 6 },
          {
            xPercent: -6,
            ease: "none",
            scrollTrigger: { trigger: viz.closest(".project"), containerAnimation: tween, start: "left right", end: "right left", scrub: true },
          }
        );
      });

      return () => root.classList.remove("work-horizontal");
    });
  };

  /* ---------- boot ---------- */
  initCursor();
  initMagnetic();
  initSignalField();
  initScrollAnimations();
  initMarquee();
  initWork();
  runPreloader();

  if (animate) {
    // fonts change line lengths — re-measure once they land
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener("load", () => ScrollTrigger.refresh());
  }
})();
