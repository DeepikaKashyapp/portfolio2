/* =========================================================
   Deepika Kashyap — portfolio v3
   GSAP + ScrollTrigger + Lenis from a CDN. Every effect
   degrades gracefully: without them (or with reduced motion)
   the page stays fully readable and usable.
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

  /* ---------- toast ---------- */
  const toastEl = $("#toast");
  let toastTimer;
  const toast = (msg) => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-on"), 2600);
  };

  /* ---------- theme ---------- */
  const themeBtn = $("#themeToggle");
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  const storedTheme = () => {
    try { return localStorage.getItem("theme"); } catch (e) { return null; }
  };
  const syncDark = () => {
    const attr = root.getAttribute("data-theme");
    const dark = attr ? attr === "dark" : systemDark.matches;
    root.classList.toggle("is-dark", dark);
    themeBtn?.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    return dark;
  };
  syncDark();

  const announceTheme = () => document.dispatchEvent(new CustomEvent("themechange"));

  const setTheme = (mode, origin) => {
    try { localStorage.setItem("theme", mode); } catch (e) {}
    const apply = () => {
      root.setAttribute("data-theme", mode);
      syncDark();
      announceTheme();
    };
    if (!document.startViewTransition || reduceMotion) {
      apply();
      return;
    }
    const x = origin?.x ?? window.innerWidth - 60;
    const y = origin?.y ?? 36;
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const vt = document.startViewTransition(apply);
    vt.ready
      .then(() =>
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration: 700, easing: "cubic-bezier(0.77, 0, 0.175, 1)", pseudoElement: "::view-transition-new(root)" }
        )
      )
      .catch(() => {});
  };
  window.setTheme = (mode) => setTheme(mode);

  themeBtn?.addEventListener("click", () => {
    const r = themeBtn.getBoundingClientRect();
    setTheme(root.classList.contains("is-dark") ? "light" : "dark", { x: r.left + r.width / 2, y: r.top + r.height / 2 });
  });

  systemDark.addEventListener("change", () => {
    if (storedTheme()) return;
    syncDark();
    announceTheme();
  });

  /* ---------- year + local clock ---------- */
  $$(".js-year").forEach((el) => (el.textContent = new Date().getFullYear()));
  const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
  const tickClock = () => $$(".js-time").forEach((el) => (el.textContent = timeFormat.format(new Date())));
  tickClock();
  setInterval(tickClock, 15000);

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (animate && typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const scrollToTarget = (target) => {
    const top = target === "top";
    if (lenis) lenis.scrollTo(top ? 0 : target, { duration: 1.4, offset: top ? 0 : -16 });
    else if (top) window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    else target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  };
  window.siteScrollTo = scrollToTarget;

  /* ---------- mobile menu ---------- */
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
  window.matchMedia("(min-width: 961px)").addEventListener("change", (e) => e.matches && setMenu(false));

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
    setTimeout(() => {
      scrollToTarget(target);
      const focusEl = target === "top" ? $("#main") : target;
      if (!focusEl.hasAttribute("tabindex")) focusEl.setAttribute("tabindex", "-1");
      focusEl.focus({ preventScroll: true });
    }, wasOpen ? 280 : 0);
  });

  /* ---------- nav state, progress, active link ---------- */
  const nav = $("#nav");
  const progressBar = $("#progressBar");
  let lastY = window.scrollY;
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar) progressBar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    nav?.classList.toggle("is-scrolled", y > 30);
    if (y > lastY + 4 && y > window.innerHeight * 0.7 && !menuOpen) nav?.classList.add("is-hidden");
    else if (y < lastY - 4 || y < 80) nav?.classList.remove("is-hidden");
    lastY = y;
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();
  nav?.addEventListener("focusin", () => nav.classList.remove("is-hidden"));

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

  /* ---------- figures animate when seen ---------- */
  const inview = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("is-inview");
        inview.unobserve(e.target);
      }
    }),
    { threshold: 0.3 }
  );
  $$("[data-inview]").forEach((el) => inview.observe(el));
  if (reduceMotion) $$(".viz").forEach((svg) => svg.pauseAnimations?.());

  /* ---------- hero letters: bouncy + colourful on hover ---------- */
  const letterColours = ["--pink", "--orange", "--yellow", "--mint", "--blue", "--purple"];
  const heroChars = [];
  $$("[data-letters]").forEach((el) => {
    const text = el.textContent;
    el.textContent = "";
    Array.from(text).forEach((ch) => {
      if (ch === " ") {
        el.appendChild(document.createTextNode(" "));
        return;
      }
      const span = document.createElement("span");
      span.className = "ch";
      span.textContent = ch;
      span.style.setProperty("--ch", `var(${letterColours[heroChars.length % letterColours.length]})`);
      span.addEventListener("mouseenter", () => {
        if (reduceMotion) return;
        span.classList.remove("is-boing");
        void span.offsetWidth;
        span.classList.add("is-boing");
      });
      span.addEventListener("animationend", () => span.classList.remove("is-boing"));
      el.appendChild(span);
      heroChars.push(span);
    });
  });

  /* ---------- avatar: speech bubble + reactions ---------- */
  const avatarEl = $("#avatar");
  const bubble = $("#bubble");
  const lines = [
    "Namaste! 👋 I'm Deepika.",
    "Chai or coffee? Both. ☕☕",
    "Try the game below ↓",
    "git push --force? Never on main.",
    "Drag the stickers around ✨",
    "Fun fact: I dance and sing too 💃🎤",
    "Psst, try the terminal: sudo hire-deepika",
  ];
  let lineIdx = 0;
  let bubbleTimer;
  const say = (text, ms = 2600) => {
    if (!bubble) return;
    bubble.textContent = text;
    bubble.classList.add("is-on");
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.remove("is-on"), ms);
  };
  const wave = () => {
    if (window.avatar) window.avatar.wave();
    else if (avatarEl && !reduceMotion) {
      avatarEl.animate([{ transform: "rotate(0)" }, { transform: "rotate(-4deg)" }, { transform: "rotate(4deg)" }, { transform: "rotate(0)" }], { duration: 700, easing: "ease-in-out" });
    }
  };
  avatarEl?.addEventListener("click", () => {
    wave();
    say(lines[lineIdx++ % lines.length]);
  });
  $$("[data-wave]").forEach((el) => el.addEventListener("mouseenter", wave));

  document.addEventListener("deploydash:highscore", () => {
    window.avatar?.cheer();
    const c = $("#game")?.getBoundingClientRect();
    if (c) window.confetti?.({ x: c.left + c.width / 2, y: c.top + c.height / 3, count: 150 });
  });

  /* ---------- draggable stickers ---------- */
  $$(".sticker").forEach((sticker) => {
    let startX = 0, startY = 0, baseX = 0, baseY = 0, dragging = false;
    sticker.addEventListener("pointerdown", (e) => {
      dragging = true;
      sticker.setPointerCapture(e.pointerId);
      sticker.classList.add("is-dragging");
      startX = e.clientX;
      startY = e.clientY;
      baseX = parseFloat(sticker.dataset.x || "0");
      baseY = parseFloat(sticker.dataset.y || "0");
    });
    sticker.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const x = baseX + e.clientX - startX;
      const y = baseY + e.clientY - startY;
      sticker.dataset.x = x;
      sticker.dataset.y = y;
      sticker.style.translate = `${x}px ${y}px`;
    });
    const end = () => {
      dragging = false;
      sticker.classList.remove("is-dragging");
    };
    sticker.addEventListener("pointerup", end);
    sticker.addEventListener("pointercancel", end);
  });

  /* ---------- custom cursor ---------- */
  const initCursor = () => {
    const cursor = $("#cursor");
    if (!cursor || !finePointer || reduceMotion) return;
    root.classList.add("has-cursor");
    const dot = $(".cursor__dot", cursor);
    const ring = $(".cursor__ring", cursor);
    const label = $("#cursorLabel");
    let mx = -100, my = -100, rx = -100, ry = -100, visible = false;

    window.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
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
    document.addEventListener("mouseleave", () => {
      visible = false;
      cursor.classList.remove("is-visible");
    });
    window.addEventListener("pointerdown", () => cursor.classList.add("is-down"));
    window.addEventListener("pointerup", () => cursor.classList.remove("is-down"));

    let lastSection = null;
    document.addEventListener("mouseover", (e) => {
      const t = e.target;
      const labelled = t.closest("[data-cursor]");
      const interactive = t.closest("a, button, [role='tab'], .sticker, .s, .avatar, canvas");
      cursor.classList.toggle("is-label", !!labelled);
      cursor.classList.toggle("is-hover", !labelled && !!interactive);
      if (labelled) label.textContent = labelled.dataset.cursor;
      const section = t.closest("[data-accent]");
      if (section !== lastSection) {
        lastSection = section;
        const c = !section ? "" : section.classList.contains("contact") ? "#1B1B3A" : getComputedStyle(section).getPropertyValue("--sec").trim();
        cursor.style.setProperty("--cur", c || "var(--pink)");
      }
    });

    const loop = () => {
      rx += (mx - rx) * 0.2;
      ry += (my - ry) * 0.2;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };

  /* ---------- magnetic buttons ---------- */
  const initMagnetic = () => {
    if (!animate || !finePointer) return;
    $$("[data-magnetic]").forEach((el) => {
      const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
      });
      el.addEventListener("mouseleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.35)", overwrite: true }));
    });
  };

  /* ---------- skills editor ---------- */
  const initEditor = () => {
    const tabs = $$('.editor__tabs [role="tab"]');
    const status = $("#usedIn");
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        $("#" + t.getAttribute("aria-controls")).hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(tab));
      tab.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") select(tabs[(i + 1) % tabs.length], true);
        if (e.key === "ArrowLeft") select(tabs[(i - 1 + tabs.length) % tabs.length], true);
      });
    });
    const show = (el) => {
      if (!status) return;
      const name = el.textContent.replace(/"/g, "");
      status.innerHTML = el.dataset.used
        ? `<span>●</span> ${name} → used in ${el.dataset.used}`
        : `<span>●</span> ${name} → in my toolkit`;
      status.classList.add("is-on");
    };
    $$(".editor .s").forEach((el) => {
      el.addEventListener("mouseenter", () => show(el));
      el.addEventListener("focus", () => show(el));
    });
  };

  /* ---------- copy email + résumé ---------- */
  const copyBtn = $("#copyEmail");
  copyBtn?.addEventListener("click", () => {
    const email = $("#emailAddr").textContent.trim();
    const celebrate = () => {
      toast("Email copied! Talk soon 💌");
      const r = copyBtn.getBoundingClientRect();
      window.confetti?.({ x: r.left + r.width / 2, y: r.top, count: 110 });
      copyBtn.textContent = "Copied ✓";
      setTimeout(() => (copyBtn.textContent = "Copy email"), 2200);
    };
    const fallback = () => {
      const range = document.createRange();
      range.selectNodeContents($("#emailAddr"));
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      toast("Email selected. Press Ctrl/⌘ + C to copy.");
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(email).then(celebrate, fallback);
    else fallback();
  });

  const resumeBtn = $("#resumeBtn");
  if (resumeBtn && location.protocol.startsWith("http")) {
    fetch("resume.pdf", { method: "HEAD" })
      .then((r) => { if (r.ok && /pdf/.test(r.headers.get("content-type") || "")) resumeBtn.hidden = false; })
      .catch(() => {});
  }

  /* ---------- split helper ---------- */
  const splitWords = (el) => {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) return frag.appendChild(document.createTextNode(" "));
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

  /* ---------- hero intro ---------- */
  const introEls = $$(".hero [data-intro]");
  const stage = $("#stage");
  if (animate) {
    gsap.set(heroChars, { yPercent: -130, opacity: 0, rotate: () => gsap.utils.random(-25, 25) });
    gsap.set(introEls, { autoAlpha: 0, y: 24 });
    gsap.set(stage, { scale: 0.85, autoAlpha: 0 });
  }

  const playIntro = () => {
    if (!animate) return;
    const tl = gsap.timeline();
    tl.to(stage, { scale: 1, autoAlpha: 1, duration: 1, ease: "back.out(1.6)" }, 0)
      .to(heroChars, { yPercent: 0, opacity: 1, rotate: 0, duration: 0.9, ease: "bounce.out", stagger: 0.045 }, 0.1)
      .to(introEls, { autoAlpha: 1, y: 0, duration: 0.8, ease: "expo.out", stagger: 0.08 }, 0.4)
      .from(".sticker", { scale: 0, duration: 0.6, ease: "back.out(2.5)", stagger: 0.08 }, 0.7)
      .add(() => {
        wave();
        say(lines[0], 3000);
        lineIdx = 1;
      }, 1.2);
  };

  /* ---------- boot sequence ---------- */
  const boot = $("#boot");
  const bootLog = $("#bootLog");
  const finishBoot = () => {
    boot?.remove();
    lenis?.start();
    if (animate) ScrollTrigger.refresh();
  };

  const runBoot = () => {
    let seen = false;
    try { seen = sessionStorage.getItem("booted") === "1"; } catch (e) {}
    if (!animate || !boot || seen || root.classList.contains("is-failsafe")) {
      boot?.remove();
      playIntro();
      return;
    }
    try { sessionStorage.setItem("booted", "1"); } catch (e) {}

    lenis?.stop();
    window.scrollTo(0, 0);
    const steps = [
      '<span class="kw">$</span> ssh guest@deepika.dev',
      'loading creativity.module ......... <span class="ok">ok</span>',
      'compiling projects (5) ............ <span class="ok">ok</span>',
      'brewing chai + coffee ............. <span class="ok">ok</span>',
      'warming up the 3D avatar .......... <span class="ok">ok</span>',
      '<span class="hi">ready. welcome! ✨</span>',
    ];
    let i = 0;
    let done = false;
    let timer;

    const exit = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      window.removeEventListener("keydown", exit);
      boot.removeEventListener("click", exit);
      gsap.timeline({ onComplete: finishBoot })
        .to(".boot__term, .boot__skip", { scale: 0.92, autoAlpha: 0, duration: 0.35, ease: "power2.in" })
        .to(".boot__stripes i", { yPercent: -100, duration: 0.7, ease: "expo.inOut", stagger: 0.07 }, 0.15)
        .add(playIntro, 0.45);
    };

    const next = () => {
      bootLog.innerHTML += (i ? "\n" : "") + steps[i];
      i++;
      timer = setTimeout(i < steps.length ? next : exit, i < steps.length ? 190 : 420);
    };
    window.addEventListener("keydown", exit);
    boot.addEventListener("click", exit);
    timer = setTimeout(next, 150);
  };

  /* ---------- scroll animations ---------- */
  const initScroll = () => {
    if (!animate) return;

    $$("[data-split]").forEach((el) => {
      const words = splitWords(el);
      gsap.from(words, {
        yPercent: 110,
        duration: 1,
        ease: "expo.out",
        stagger: 0.05,
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });

    // reveal via the CSS `translate` property so hover transforms keep working
    gsap.set("[data-reveal]", { autoAlpha: 0, translate: "0px 44px" });
    ScrollTrigger.batch("[data-reveal]", {
      start: "top 90%",
      once: true,
      onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, translate: "0px 0px", duration: 0.9, ease: "expo.out", stagger: 0.08 }),
    });

    $$("[data-count]").forEach((el) => {
      const end = parseFloat(el.dataset.count);
      const obj = { v: 0 };
      el.textContent = "0";
      gsap.to(obj, {
        v: end,
        duration: 1.8,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 92%", once: true },
        onUpdate: () => (el.textContent = Math.round(obj.v)),
      });
    });

    // git log line draws as you scroll
    const gitlog = $("#gitlog");
    if (gitlog) {
      gitlog.style.setProperty("--line-p", 0);
      ScrollTrigger.create({
        trigger: gitlog,
        start: "top 75%",
        end: "bottom 60%",
        scrub: true,
        onUpdate: (self) => gitlog.style.setProperty("--line-p", self.progress.toFixed(3)),
      });
    }

    // hero drifts away on scroll
    gsap.to(".hero__text", { yPercent: -10, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

    // footer letters pop up
    gsap.fromTo(
      ".footer__mega span",
      { yPercent: 70, rotate: () => gsap.utils.random(-20, 20) },
      {
        yPercent: 0,
        rotate: 0,
        ease: "back.out(2)",
        duration: 1,
        stagger: 0.06,
        clearProps: "transform",
        scrollTrigger: { trigger: ".footer__mega", start: "top bottom" },
      }
    );
  };

  /* ---------- stacked project cards ---------- */
  const initStack = () => {
    const wrap = $("#stackCards");
    if (!wrap) return;
    const cards = $$(".pcard", wrap);
    const fits = () => {
      const tallest = Math.max(...cards.map((c) => c.offsetHeight));
      wrap.classList.toggle("no-stack", tallest > window.innerHeight - 110);
    };
    fits();
    window.addEventListener("resize", () => {
      fits();
      if (animate) ScrollTrigger.refresh();
    });
    document.fonts?.ready.then(fits);
    if (!animate) return;

    const mm = gsap.matchMedia();
    mm.add("(min-width: 961px)", () => {
      cards.slice(0, -1).forEach((card, i) => {
        gsap.to(card, {
          scale: 0.93,
          ease: "none",
          scrollTrigger: {
            trigger: cards[i + 1],
            start: "top bottom",
            end: "top 30%",
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
      });
    });
  };

  /* ---------- velocity-aware marquee ---------- */
  const initMarquee = () => {
    if (!animate) return;
    $$("[data-marquee]").forEach((marquee) => {
      const track = $(".marquee__track", marquee);
      const group = $(".marquee__group", marquee);
      let width = group.offsetWidth;
      let x = 0, dir = -1, boost = 0;
      window.addEventListener("resize", () => (width = group.offsetWidth));
      document.fonts?.ready.then(() => (width = group.offsetWidth));
      ScrollTrigger.create({
        trigger: marquee,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          dir = self.direction === 1 ? -1 : 1;
          boost = Math.min(Math.abs(self.getVelocity()) / 140, 12);
        },
      });
      gsap.ticker.add((_, delta) => {
        boost *= 0.92;
        x += dir * (0.7 + boost) * (delta / 16.67);
        if (x <= -width) x += width;
        if (x > 0) x -= width;
        track.style.transform = `translate3d(${x}px,0,0)`;
      });
    });
  };

  /* ---------- boot ---------- */
  initCursor();
  initMagnetic();
  initEditor();
  initScroll();
  initStack();
  initMarquee();
  runBoot();

  if (animate) {
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener("load", () => ScrollTrigger.refresh());
  }
})();
