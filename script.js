// ===== Custom cursor: reticle + shimmer trail =====
(function initCustomCursor() {
  const supportsCustomCursor =
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!supportsCustomCursor) return;

  document.documentElement.classList.add("has-custom-cursor");

  const reticle = document.getElementById("cursorReticle");
  const canvas = document.getElementById("cursorTrail");
  const ctx = canvas.getContext("2d");

  const styles = getComputedStyle(document.documentElement);
  const colorA = styles.getPropertyValue("--accent").trim() || "#3dffa0";
  const colorB = styles.getPropertyValue("--accent-2").trim() || "#00c2ff";

  function resizeCanvas() {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  let mouseX = -100, mouseY = -100;
  let reticleX = -100, reticleY = -100;
  let lastSpawnX = -100, lastSpawnY = -100;
  let hasMoved = false;

  const particles = [];
  const MAX_PARTICLES = 90;

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!hasMoved) {
      hasMoved = true;
      reticleX = mouseX;
      reticleY = mouseY;
      reticle.classList.add("is-visible");
    }
  });

  window.addEventListener("mouseleave", () => reticle.classList.remove("is-visible"));
  window.addEventListener("mouseenter", () => reticle.classList.add("is-visible"));
  window.addEventListener("mousedown", () => reticle.classList.add("is-down"));
  window.addEventListener("mouseup", () => reticle.classList.remove("is-down"));

  // Highlight the reticle when hovering interactive elements
  const interactiveSelector = "a, button, .tag, .project, input, textarea";
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest(interactiveSelector)) reticle.classList.add("is-active");
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest(interactiveSelector)) reticle.classList.remove("is-active");
  });

  function spawnParticle(x, y) {
    if (particles.length >= MAX_PARTICLES) particles.shift();
    particles.push({
      x: x + (Math.random() - 0.5) * 6,
      y: y + (Math.random() - 0.5) * 6,
      r: Math.random() * 2.2 + 1.4,
      alpha: 0.55,
      color: Math.random() > 0.45 ? colorA : colorB,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    });
  }

  function loop() {
    // smooth trailing follow for the reticle
    reticleX += (mouseX - reticleX) * 0.22;
    reticleY += (mouseY - reticleY) * 0.22;
    reticle.style.transform = `translate(${reticleX - 20}px, ${reticleY - 20}px)`;

    // spawn shimmer particles as the (smoothed) cursor moves
    const dx = reticleX - lastSpawnX;
    const dy = reticleY - lastSpawnY;
    if (Math.hypot(dx, dy) > 4 && hasMoved) {
      spawnParticle(reticleX, reticleY);
      lastSpawnX = reticleX;
      lastSpawnY = reticleY;
    }

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.globalCompositeOperation = "lighter";

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.018;
      p.r *= 0.985;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();

// ===== Custom cursor: dot + trailing frame + shimmer trail =====
(function initCustomCursor() {
  const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!isFinePointer || prefersReducedMotion) return;

  document.body.classList.add("has-custom-cursor");

  const dot = document.getElementById("cursorDot");
  const frame = document.getElementById("cursorFrame");
  const canvas = document.getElementById("cursorTrail");
  const ctx = canvas.getContext("2d");

  function resizeCanvas() {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let frameX = mouseX;
  let frameY = mouseY;
  let hasMoved = false;

  const particles = [];
  const accentColors = ["61,255,160", "0,194,255"];

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    hasMoved = true;

    dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;

    // spawn a couple of shimmer particles per move
    for (let i = 0; i < 2; i++) {
      particles.push({
        x: mouseX + (Math.random() - 0.5) * 6,
        y: mouseY + (Math.random() - 0.5) * 6,
        size: Math.random() * 2.5 + 1,
        life: 1,
        decay: Math.random() * 0.02 + 0.02,
        drift: (Math.random() - 0.5) * 0.4,
        color: accentColors[Math.random() > 0.5 ? 0 : 1],
      });
    }
    if (particles.length > 160) particles.splice(0, particles.length - 160);
  });

  // detect hover over interactive elements to grow the frame
  const interactiveSelector = "a, button, .btn, .project, .tag";
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest(interactiveSelector)) {
      document.body.classList.add("cursor-hover");
    }
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest(interactiveSelector)) {
      document.body.classList.remove("cursor-hover");
    }
  });

  function animate() {
    // lerp the frame toward the mouse for a trailing feel
    frameX += (mouseX - frameX) * 0.18;
    frameY += (mouseY - frameY) * 0.18;
    if (hasMoved) {
      frame.style.transform = `translate(${frameX}px, ${frameY}px)`;
    }

    // draw + fade shimmer particles
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= p.decay;
      p.y -= 0.3;
      p.x += p.drift;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, ${p.life * 0.6})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = `rgba(${p.color}, ${p.life})`;
      ctx.fill();
    }

    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  // hide native cursor fallback state on touch-triggered mouse events
  document.addEventListener("mouseleave", () => {
    dot.style.opacity = "0";
    frame.style.opacity = "0";
  });
  document.addEventListener("mouseenter", () => {
    dot.style.opacity = "1";
    frame.style.opacity = "1";
  });
})();

// ===== Footer year =====
document.getElementById("year").textContent = new Date().getFullYear();

// ===== Mobile nav toggle =====
const burger = document.getElementById("burger");
const mobileNav = document.getElementById("mobileNav");

if (burger && mobileNav) {
  burger.addEventListener("click", () => {
    const isOpen = mobileNav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(isOpen));
  });

  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileNav.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
    });
  });
}

// ===== Typed role rotator =====
const roles = [
  "Full-Stack Developer",
  "AI / ML Engineer",
  "ECE Undergrad @ CSJMU",
  "Open-Source Contributor",
];

const typedEl = document.getElementById("typedRole");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (typedEl && !prefersReducedMotion) {
  let roleIndex = 0;
  let charIndex = roles[0].length;
  let isDeleting = false;

  function tick() {
    const current = roles[roleIndex];

    if (isDeleting) {
      charIndex--;
    } else {
      charIndex++;
    }

    typedEl.textContent = current.slice(0, charIndex);

    let delay = isDeleting ? 40 : 70;

    if (!isDeleting && charIndex === current.length) {
      delay = 1800;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      delay = 300;
    }

    setTimeout(tick, delay);
  }

  setTimeout(tick, 2200); // wait for hero load-in animation first
}

// ===== Scroll reveal =====
const revealTargets = document.querySelectorAll(
  ".section__title, .about__text, .about__facts, .skill-block, .timeline__item, .project, .achievement, .contact__links"
);

revealTargets.forEach((el) => el.classList.add("reveal"));

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);

revealTargets.forEach((el) => observer.observe(el));

// ===== Active nav link on scroll =====
const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".nav__links a");

const navObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute("id");
        navLinks.forEach((link) => {
          link.style.color = link.getAttribute("href") === `#${id}` ? "var(--accent)" : "";
        });
      }
    });
  },
  { rootMargin: "-40% 0px -50% 0px" }
);

sections.forEach((section) => navObserver.observe(section));
