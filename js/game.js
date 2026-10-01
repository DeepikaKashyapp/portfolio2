/* =========================================================
   Deploy Dash — a one-button runner. Pixel-Deepika jumps bugs,
   merge conflicts and 404s, collects skills and coffee.
   Fires "deploydash:highscore" on a new best score.
   ========================================================= */
(() => {
  "use strict";

  const canvas = document.getElementById("game");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const factEl = document.getElementById("gameFact");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- theme colours ---------- */
  let col = {};
  const readColours = () => {
    const s = getComputedStyle(document.documentElement);
    const v = (n) => s.getPropertyValue(n).trim();
    col = {
      bg: v("--surface"),
      ink: v("--ink"),
      dim: v("--dim"),
      faint: v("--faint"),
      line: v("--line"),
      pink: v("--pink"),
      blue: v("--blue"),
      yellow: v("--yellow"),
      mint: v("--mint"),
      orange: v("--orange"),
      purple: v("--purple"),
      red: v("--red"),
      mono: v("--font-mono") || "monospace",
    };
  };
  readColours();
  document.addEventListener("themechange", () => {
    readColours();
    if (state !== "running") draw();
  });

  /* ---------- sprites (pixel maps) ---------- */
  const PX = 3;
  const PLAYER_PAL = { H: "#1F1517", S: "#C98B66", E: "#2B1B14", W: "#F4F4F6", B: "#22222E", M: "#A9445E", L: "#3A3A4C", K: "#111118" };
  const playerTop = [
    "...HHHHHH...",
    "..HHHHHHHH..",
    ".HHHHHHHHHH.",
    ".HHSSSSSSHH.",
    ".HHSESSESHH.",
    ".HHSSSSSSHH.",
    ".HHSSMMSSHH.",
    ".HHHSSSSHHH.",
    ".HHBBWWBBHH.",
    ".HBBBWWBBBH.",
    ".HBBBWWBBBH.",
    "..SBBBBBBS..",
    "...BBBBBB...",
    "...BBBBBB...",
  ];
  const legsA = ["...LL..LL...", "...LL..LL...", "..KK...KK..."];
  const legsB = ["....LLLL....", "....LLLL....", "...KK..KK..."];
  const legsJump = ["...LL..LL...", "..LL....LL..", ".KK......KK."];

  const BUG = ["..X....X..", "...X..X...", "..GGGGGG..", ".GGEGGEGG.", "XGGGGGGGGX", ".GGGGGGGG.", "XGGGGGGGGX", "..X....X.."];
  const CUP = [".S.S.S..", "..S.S...", "WWWWWW..", "WCCCCWWW", "WCCCCW.W", "WCCCCWWW", "WCCCCW..", ".WWWW..."];

  const drawMap = (map, x, y, pal, px = PX) => {
    for (let r = 0; r < map.length; r++) {
      const row = map[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch === ".") continue;
        ctx.fillStyle = pal[ch];
        ctx.fillRect(Math.round(x + c * px), Math.round(y + r * px), px, px);
      }
    }
  };

  /* ---------- skill tokens ---------- */
  const SKILLS = [
    ["Python", "Python powers my CLIP mismatch detector and Zero-Waste Vision."],
    ["React", "React: CodeTrack++, Zero-Waste Vision, Chaitanya and client sites at Irafactory."],
    ["Redis", "Redis Sorted Sets made CodeTrack++'s leaderboard ~85% faster."],
    ["C++", "C++ is my DSA language: 200+ problems on LeetCode and Codeforces."],
    ["Node.js", "Node.js runs CodeTrack++'s sandboxed code-execution engine."],
    ["YOLOv8", "YOLOv8n + MobileNet V2 sort waste at ~6 FPS on a plain CPU."],
    ["CLIP", "CLIP embeddings catch image–title mismatches with 0.76 ROC-AUC."],
    ["libsodium", "I built EchoChat's AODV routing and libsodium end-to-end encryption."],
    ["Figma", "At Irafactory I turned Figma designs into live client websites."],
    ["Lighthouse", "I tuned client sites for better Lighthouse and SEO scores."],
    ["Gemini", "Chaitanya uses the Gemini API for supportive conversations."],
  ];

  /* ---------- state ---------- */
  let W = 0, H = 0, ground = 0;
  let state = "idle"; // idle | running | paused | over
  let player, obstacles, items, bgText, score, speed, spawnIn, itemIn, shieldUntil, flash, lastT, frameT, version, skillIdx;
  let best = 0;
  try { best = parseInt(localStorage.getItem("deploydash-best") || "0", 10) || 0; } catch (e) {}

  const reset = () => {
    player = { x: 56, y: 0, vy: 0, w: 12 * PX, h: 17 * PX, onGround: true };
    player.y = ground - player.h;
    obstacles = [];
    items = [];
    bgText = [];
    score = 0;
    speed = 0.32;
    spawnIn = 900;
    itemIn = 1600;
    shieldUntil = 0;
    flash = null;
    frameT = 0;
    version = 0;
    skillIdx = Math.floor(Math.random() * SKILLS.length);
    for (let i = 0; i < 4; i++) bgText.push(makeBgText(Math.random() * W));
  };

  const BG_LINES = ["const ship = true;", "git commit -m 'fix'", "npm run build", "while (!done) learn();", "// TODO: sleep", "SELECT * FROM chai;", "deploy --prod", "if (bug) squash();"];
  const makeBgText = (x) => ({ x, y: 30 + Math.random() * (ground - 110), text: BG_LINES[Math.floor(Math.random() * BG_LINES.length)] });

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width;
    H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ground = H - 46;
    if (!player) reset();
    else if (player.onGround) player.y = ground - player.h;
    if (state !== "running") draw();
  };

  /* ---------- spawning ---------- */
  const spawnObstacle = () => {
    const roll = Math.random();
    if (roll < 0.4) obstacles.push({ type: "bug", x: W + 20, y: ground - 8 * PX, w: 10 * PX, h: 8 * PX });
    else if (roll < 0.65) obstacles.push({ type: "conflict", x: W + 20, y: ground - 44, w: 38, h: 44 });
    else if (roll < 0.85) obstacles.push({ type: "404", x: W + 20, y: ground - 32, w: 48, h: 32 });
    else obstacles.push({ type: "signal", x: W + 20, y: ground - 92 - Math.random() * 18, w: 44, h: 26 });
  };

  const spawnItem = () => {
    if (Math.random() < 0.28) items.push({ type: "coffee", x: W + 20, y: ground - 100 - Math.random() * 30, w: 8 * PX, h: 8 * PX });
    else {
      const [name, fact] = SKILLS[skillIdx % SKILLS.length];
      skillIdx++;
      ctx.font = `600 13px ${col.mono}`;
      const w = ctx.measureText(name).width + 22;
      items.push({ type: "skill", name, fact, x: W + 20, y: ground - 110 - Math.random() * 30, w, h: 26 });
    }
  };

  const hit = (a, b, pad = 6) =>
    a.x + pad < b.x + b.w && a.x + a.w - pad > b.x && a.y + pad < b.y + b.h && a.y + a.h - pad > b.y;

  /* ---------- update ---------- */
  const update = (dt) => {
    frameT += dt;
    speed = Math.min(0.78, speed + dt * 0.0000075);
    const dx = speed * dt;

    // player physics
    player.vy += 0.0024 * dt;
    player.y += player.vy * dt;
    if (player.y >= ground - player.h) {
      player.y = ground - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // spawn
    spawnIn -= dt;
    if (spawnIn <= 0) {
      spawnObstacle();
      spawnIn = (700 + Math.random() * 900) * (0.42 / speed) + 260;
    }
    itemIn -= dt;
    if (itemIn <= 0) {
      spawnItem();
      itemIn = 1800 + Math.random() * 2200;
    }

    // move world
    obstacles.forEach((o) => (o.x -= dx));
    items.forEach((i) => (i.x -= dx));
    obstacles = obstacles.filter((o) => o.x + o.w > -10);
    items = items.filter((i) => i.x + i.w > -10 && !i.taken);
    bgText.forEach((b) => (b.x -= dx * 0.3));
    bgText = bgText.filter((b) => b.x > -220);
    if (bgText.length < 4) bgText.push(makeBgText(W + Math.random() * 120));

    // score
    const before = score;
    score += dt * speed * 0.05;
    if (Math.floor(score / 500) > Math.floor(before / 500)) {
      version++;
      flash = { text: `🚀 deployed v1.${version}`, until: performance.now() + 1400 };
    }

    // collisions
    const shielded = performance.now() < shieldUntil;
    for (const o of obstacles) {
      if (hit(player, o, 8)) {
        if (shielded) {
          o.x = -999;
          score += 25;
        } else {
          return gameOver();
        }
      }
    }
    for (const it of items) {
      if (!it.taken && hit(player, it, 2)) {
        it.taken = true;
        if (it.type === "coffee") {
          shieldUntil = performance.now() + 3200;
          flash = { text: "☕ caffeinated: invincible!", until: performance.now() + 1400 };
        } else {
          score += 50;
          showFact(`★ ${it.name}: ${it.fact}`);
        }
      }
    }
  };

  /* ---------- draw ---------- */
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = col.bg;
    ctx.fillRect(0, 0, W, H);

    // background code
    ctx.font = `13px ${col.mono}`;
    ctx.fillStyle = col.line;
    (bgText || []).forEach((b) => ctx.fillText(b.text, b.x, b.y));

    // ground
    ctx.strokeStyle = col.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, ground + 1);
    ctx.lineTo(W, ground + 1);
    ctx.stroke();
    ctx.fillStyle = col.faint;
    ctx.font = `11px ${col.mono}`;
    const off = (frameT * speed) % 64;
    for (let x = -off; x < W; x += 64) ctx.fillText("--", x, ground + 18);

    // items
    (items || []).forEach((it) => {
      if (it.type === "coffee") {
        drawMap(CUP, it.x, it.y + Math.sin(frameT / 200 + it.x) * 3, { S: col.faint, W: col.ink, C: col.orange });
      } else {
        const y = it.y + Math.sin(frameT / 250 + it.x / 40) * 3;
        ctx.fillStyle = col.yellow;
        ctx.strokeStyle = col.ink;
        ctx.lineWidth = 2;
        roundRect(it.x, y, it.w, it.h, 13);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#1B1B3A";
        ctx.font = `600 13px ${col.mono}`;
        ctx.fillText(it.name, it.x + 11, y + 17);
      }
    });

    // obstacles
    (obstacles || []).forEach((o) => {
      if (o.type === "bug") {
        drawMap(BUG, o.x, o.y, { X: col.ink, G: col.mint, E: col.ink });
      } else {
        const fill = o.type === "conflict" ? col.orange : o.type === "404" ? col.pink : col.red;
        ctx.fillStyle = fill;
        ctx.strokeStyle = col.ink;
        ctx.lineWidth = 2;
        roundRect(o.x, o.y, o.w, o.h, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#1B1B3A";
        ctx.font = `700 13px ${col.mono}`;
        const label = o.type === "conflict" ? "<<<" : o.type === "404" ? "404" : "✕ 0▮";
        const tw = ctx.measureText(label).width;
        ctx.fillText(label, o.x + (o.w - tw) / 2, o.y + o.h / 2 + 5);
      }
    });

    // player
    if (player) {
      const shielded = performance.now() < shieldUntil;
      if (shielded) {
        ctx.strokeStyle = col.yellow;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x + player.w / 2, player.y + player.h / 2, player.h * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      }
      drawMap(playerTop, player.x, player.y, PLAYER_PAL);
      const legs = !player.onGround ? legsJump : Math.floor(frameT / 110) % 2 ? legsA : legsB;
      drawMap(legs, player.x, player.y + playerTop.length * PX, PLAYER_PAL);
    }

    // HUD
    ctx.font = `500 13px ${col.mono}`;
    ctx.fillStyle = col.dim;
    const hud = `HI ${pad(best)}   SCORE ${pad(Math.floor(score || 0))}`;
    ctx.fillText(hud, W - ctx.measureText(hud).width - 14, 24);
    if (version) {
      ctx.fillStyle = col.mint;
      ctx.fillText(`v1.${version} live`, 14, 24);
    }

    if (flash && performance.now() < flash.until) {
      banner(flash.text, col.yellow, 0.36);
    }

    if (state === "idle") overlay("DEPLOY DASH", reduce ? "Press Space or tap to start" : "Press Space or tap to start", col.purple);
    if (state === "paused") overlay("PAUSED", "Press Space or tap to resume", col.blue);
    if (state === "over") overlay(`BUILD FAILED AT ${Math.floor(score)} PTS`, "npm run retry → Space or tap", col.pink);
  };

  const pad = (n) => String(n).padStart(5, "0");

  const roundRect = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  const banner = (text, fill, yFrac) => {
    ctx.font = `700 15px ${col.mono}`;
    const tw = ctx.measureText(text).width;
    const bw = tw + 28;
    const x = (W - bw) / 2;
    const y = H * yFrac;
    ctx.fillStyle = fill;
    ctx.strokeStyle = col.ink;
    ctx.lineWidth = 2;
    roundRect(x, y, bw, 34, 17);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#1B1B3A";
    ctx.fillText(text, x + 14, y + 22);
  };

  const overlay = (title, sub, fill) => {
    ctx.font = `800 ${W < 420 ? 20 : 26}px ${getComputedStyle(document.documentElement).getPropertyValue("--font-display")}`;
    const tw = ctx.measureText(title).width;
    const bw = Math.min(W - 24, tw + 48);
    const x = (W - bw) / 2;
    const y = H * 0.24;
    ctx.fillStyle = fill;
    ctx.strokeStyle = col.ink;
    ctx.lineWidth = 2.5;
    roundRect(x, y, bw, 52, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#1B1B3A";
    ctx.fillText(title, x + (bw - tw) / 2, y + 35);
    ctx.font = `500 13px ${col.mono}`;
    ctx.fillStyle = col.ink;
    const sw = ctx.measureText(sub).width;
    ctx.fillText(sub, (W - sw) / 2, y + 80);
  };

  /* ---------- facts ---------- */
  let factTimer;
  const showFact = (text) => {
    if (!factEl) return;
    factEl.textContent = text;
    factEl.classList.add("is-on");
    clearTimeout(factTimer);
    factTimer = setTimeout(() => factEl.classList.remove("is-on"), 5000);
  };

  /* ---------- loop + control ---------- */
  let rafId = 0;
  const loop = (t) => {
    const dt = Math.min(34, t - (lastT || t));
    lastT = t;
    if (state === "running") update(dt);
    draw();
    if (state === "running") rafId = requestAnimationFrame(loop);
  };

  const run = () => {
    state = "running";
    lastT = 0;
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  };

  const gameOver = () => {
    state = "over";
    const final = Math.floor(score);
    if (final > best) {
      const hadBest = best > 0;
      best = final;
      try { localStorage.setItem("deploydash-best", String(best)); } catch (e) {}
      showFact(hadBest ? `New high score: ${best}! Pixel-me approves. 🎉` : `First score on the board: ${best}. Can you beat it?`);
      document.dispatchEvent(new CustomEvent("deploydash:highscore", { detail: { score: best } }));
    }
    draw();
  };

  const jump = () => {
    if (state === "idle" || state === "over") {
      reset();
      run();
      return;
    }
    if (state === "paused") {
      run();
      return;
    }
    if (player.onGround) {
      player.vy = -0.82;
      player.onGround = false;
    }
  };

  const release = () => {
    if (state === "running" && player.vy < -0.38) player.vy = -0.38;
  };

  let inView = false;
  const keyActive = () => document.activeElement === canvas || (inView && state === "running");

  window.addEventListener("keydown", (e) => {
    if (!["Space", "ArrowUp", "KeyW"].includes(e.code)) return;
    const typing = /input|textarea/i.test(document.activeElement?.tagName || "");
    if (typing || !keyActive()) return;
    e.preventDefault();
    if (!e.repeat) jump();
  });
  window.addEventListener("keyup", (e) => {
    if (["Space", "ArrowUp", "KeyW"].includes(e.code)) release();
  });
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    canvas.focus({ preventScroll: true });
    jump();
  });
  canvas.addEventListener("pointerup", release);

  const pause = () => {
    if (state === "running") {
      state = "paused";
      cancelAnimationFrame(rafId);
      draw();
    }
  };
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (!inView) pause();
  }, { threshold: 0.3 }).observe(canvas);
  document.addEventListener("visibilitychange", () => document.hidden && pause());

  new ResizeObserver(resize).observe(canvas);
  resize();

  // let the terminal start a round
  window.deployDash = {
    start() {
      canvas.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      canvas.focus({ preventScroll: true });
      if (state !== "running") {
        reset();
        setTimeout(run, 500);
      }
    },
    get best() { return best; },
  };
})();
