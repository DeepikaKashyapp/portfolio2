/* Tiny dependency-free confetti burst. window.confetti({ x, y, count }) */
(() => {
  "use strict";
  const canvas = document.getElementById("confetti");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let pieces = [];
  let running = false;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener("resize", resize);

  const palette = () => {
    const s = getComputedStyle(document.documentElement);
    return ["--pink", "--orange", "--yellow", "--mint", "--blue", "--purple"].map((v) => s.getPropertyValue(v).trim());
  };

  const tick = () => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    pieces = pieces.filter((p) => p.life > 0 && p.y < innerHeight + 40);
    for (const p of pieces) {
      p.vy += 0.25;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= 1;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.min(1, p.life / 40);
      ctx.fillStyle = p.color;
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    }
    if (pieces.length) requestAnimationFrame(tick);
    else {
      running = false;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
    }
  };

  window.confetti = ({ x = innerWidth / 2, y = innerHeight / 2, count = 120 } = {}) => {
    if (reduce) return;
    const colors = palette();
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
      const speed = 6 + Math.random() * 10;
      pieces.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        w: 6 + Math.random() * 8,
        h: 4 + Math.random() * 6,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        color: colors[i % colors.length],
        round: Math.random() < 0.3,
        life: 120 + Math.random() * 60,
      });
    }
    if (!running) {
      running = true;
      requestAnimationFrame(tick);
    }
  };
})();
