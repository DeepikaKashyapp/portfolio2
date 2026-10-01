/* =========================================================
   Stylized 3D avatar of Deepika, built from primitives with
   Three.js (no model file). Toon shading + ink outlines.
   Exposes window.avatar = { wave, cheer, surprise, ready }.
   Falls back to the inline SVG when WebGL isn't available.
   ========================================================= */
(() => {
  "use strict";

  const host = document.getElementById("avatar");
  if (!host || typeof window.THREE === "undefined") return;

  const THREE = window.THREE;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  } catch (e) {
    return; // keep the SVG fallback
  }
  if (!renderer.getContext()) return;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);
  host.classList.add("is-3d");

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(27, 1, 0.1, 50);
  camera.position.set(0, 1.3, 5.6);
  camera.lookAt(0, 1.02, 0);

  /* ---------- palette (taken from the reference photo) ---------- */
  const C = {
    skin: 0xc98b66,
    skinShade: 0xb5744f,
    hair: 0x1f1517,
    blazer: 0x22222e,
    shirt: 0xf4f4f6,
    lips: 0xa9445e,
    eye: 0x2b1b14,
    brow: 0x1a1214,
    cheek: 0xe8828f,
    outline: 0x1b1b3a,
    laptop: 0xd7d9e8,
    lid: 0xff5fa2,
  };

  /* ---------- materials ---------- */
  const ramp = new THREE.DataTexture(new Uint8Array([95, 170, 255]), 3, 1, THREE.RedFormat);
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter;
  ramp.needsUpdate = true;

  const toon = (color, opts = {}) => new THREE.MeshToonMaterial({ color, gradientMap: ramp, ...opts });
  const flat = (color, opts = {}) => new THREE.MeshBasicMaterial({ color, ...opts });
  const outlineMat = flat(C.outline, { side: THREE.BackSide });

  const mat = {
    skin: toon(C.skin),
    nose: toon(C.skinShade),
    hair: toon(C.hair, { side: THREE.DoubleSide }),
    blazer: toon(C.blazer),
    shirt: toon(C.shirt, { side: THREE.DoubleSide }),
    lips: flat(C.lips),
    eye: flat(C.eye),
    shine: flat(0xffffff),
    brow: flat(C.brow),
    cheek: flat(C.cheek, { transparent: true, opacity: 0.4, depthWrite: false }),
    laptop: toon(C.laptop),
    lid: toon(C.lid),
    part: toon(C.skinShade),
  };

  const outline = (mesh, thickness = 0.022) => {
    mesh.geometry.computeBoundingSphere();
    const o = new THREE.Mesh(mesh.geometry, outlineMat);
    o.scale.setScalar(1 + thickness / mesh.geometry.boundingSphere.radius);
    mesh.add(o);
    return mesh;
  };

  const mesh = (geo, material, pos, rot, scale) => {
    const m = new THREE.Mesh(geo, material);
    if (pos) m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    if (scale) m.scale.set(...scale);
    return m;
  };

  /* ---------- rig ---------- */
  const root = new THREE.Group();
  scene.add(root);

  const body = new THREE.Group();
  root.add(body);

  // torso (blazer)
  const torso = outline(mesh(new THREE.CylinderGeometry(0.36, 0.47, 0.98, 36), mat.blazer, [0, 0.49, 0], null, [1, 1, 0.62]));
  body.add(torso);
  const shoulders = outline(mesh(new THREE.CapsuleGeometry(0.17, 0.6, 8, 20), mat.blazer, [0, 0.92, 0], [0, 0, Math.PI / 2], [1, 1, 0.82]));
  body.add(shoulders);

  // white shirt V + collar
  const vShape = new THREE.Shape();
  vShape.moveTo(-0.15, 0);
  vShape.lineTo(0.15, 0);
  vShape.lineTo(0, -0.44);
  vShape.closePath();
  const shirt = mesh(new THREE.ShapeGeometry(vShape), mat.shirt, [0, 1.0, 0.232], [-0.12, 0, 0]);
  body.add(shirt);

  const collarShape = (side) => {
    const s = new THREE.Shape();
    s.moveTo(side * 0.015, 0.02);
    s.lineTo(side * 0.17, 0.05);
    s.lineTo(side * 0.11, -0.13);
    s.closePath();
    return new THREE.ShapeGeometry(s);
  };
  [-1, 1].forEach((side) => {
    const collar = mesh(collarShape(side), mat.shirt, [0, 1.0, 0.25], [-0.25, side * 0.25, 0]);
    body.add(collar);
    // lapel edge line
    const lapel = mesh(new THREE.BoxGeometry(0.018, 0.5, 0.01), flat(0x3a3a4c), [side * 0.085, 0.79, 0.262], [-0.12, 0, -side * 0.33]);
    body.add(lapel);
  });

  // neck
  body.add(mesh(new THREE.CylinderGeometry(0.105, 0.12, 0.36, 20), mat.skin, [0, 1.14, 0]));

  // arms
  const makeArm = (side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.46, 0.92, 0);
    const sleeve = outline(mesh(new THREE.CapsuleGeometry(0.11, 0.5, 6, 14), mat.blazer, [0, -0.35, 0]));
    const hand = mesh(new THREE.SphereGeometry(0.09, 16, 12), mat.skin, [0, -0.72, 0]);
    pivot.add(sleeve, hand);
    pivot.rotation.z = side * 0.14;
    body.add(pivot);
    return pivot;
  };
  const armR = makeArm(-1); // her right (viewer's left) — the waving arm
  const armL = makeArm(1);

  /* ---------- head ---------- */
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 1.28, 0);
  body.add(headPivot);

  const HC = new THREE.Vector3(0, 0.32, 0); // head centre in pivot space
  const head = outline(mesh(new THREE.SphereGeometry(0.46, 40, 32), mat.skin, [HC.x, HC.y, HC.z], null, [0.94, 1.03, 0.92]), 0.02);
  headPivot.add(head);

  const face = new THREE.Group();
  face.position.copy(HC);
  headPivot.add(face);

  // eyes
  const eyes = [-1, 1].map((side) => {
    const g = new THREE.Group();
    g.position.set(side * 0.16, 0.0, 0.385);
    const iris = mesh(new THREE.SphereGeometry(0.058, 20, 16), mat.eye, null, null, [1, 1.22, 0.55]);
    const shine = mesh(new THREE.SphereGeometry(0.017, 10, 8), mat.shine, [side * -0.015 + 0.012, 0.028, 0.03]);
    const shine2 = mesh(new THREE.SphereGeometry(0.008, 8, 6), mat.shine, [-0.016, -0.02, 0.031]);
    g.add(iris, shine, shine2);
    face.add(g);
    return g;
  });

  // brows: soft friendly arches
  const brows = [-1, 1].map((side) => {
    const arc = 1.05;
    const b = mesh(new THREE.TorusGeometry(0.075, 0.012, 6, 16, arc), mat.brow, [side * 0.165, 0.075, 0.392], [0, 0, Math.PI / 2 - arc / 2 + side * 0.08]);
    face.add(b);
    return b;
  });
  // lash flicks at the outer corners
  [-1, 1].forEach((side) => {
    face.add(mesh(new THREE.BoxGeometry(0.045, 0.012, 0.01), mat.brow, [side * 0.215, 0.05, 0.37], [0, side * 0.5, side * 0.55]));
  });

  // nose, smile, cheeks
  face.add(mesh(new THREE.SphereGeometry(0.034, 14, 10), mat.nose, [0, -0.075, 0.425], null, [0.85, 1, 0.7]));
  const smile = mesh(new THREE.TorusGeometry(0.072, 0.016, 8, 28, Math.PI), mat.lips, [0, -0.15, 0.392], [0.15, 0, Math.PI]);
  face.add(smile);
  [-1, 1].forEach((side) => {
    face.add(mesh(new THREE.CircleGeometry(0.06, 20), mat.cheek, [side * 0.255, -0.085, 0.345], [0, side * 0.55, 0]));
  });

  /* ---------- hair ---------- */
  const hair = new THREE.Group();
  hair.position.copy(HC);
  headPivot.add(hair);

  // crown cap + sides/back shell
  hair.add(outline(mesh(new THREE.SphereGeometry(0.495, 40, 24, 0, Math.PI * 2, 0, 0.98), mat.hair, null, null, [0.97, 1.04, 0.96]), 0.018));
  const shellFront = 1.15; // radians kept open around the face
  hair.add(mesh(new THREE.SphereGeometry(0.505, 40, 24, Math.PI / 2 + shellFront, Math.PI * 2 - shellFront * 2, 0.5, 1.85), mat.hair, null, null, [0.98, 1.04, 0.98]));

  // centre parting
  const partCurve = new THREE.CatmullRomCurve3(
    [0.5, 0.7, 0.88, 1.0].map((th) => new THREE.Vector3(0, Math.cos(th) * 0.52, Math.sin(th) * 0.5 + 0.0))
      .map((v) => new THREE.Vector3(0, v.y, v.z))
  );
  hair.add(mesh(new THREE.TubeGeometry(partCurve, 16, 0.0055, 6, false), mat.part));

  // wavy strands: a few front curtains swoop from the parting,
  // fuller side/back strands fall from ear level past the shoulders
  const smooth = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  const lerp = (a, b, t) => a + (b - a) * t;
  const strands = [];
  const addStrand = (pts, radius, phase, s) => {
    const v = pts.map(([x, y, z], i) => {
      const w = i >= 2 ? Math.sin(y * 7 + phase) * 0.04 : 0;
      return new THREE.Vector3(x + s * w, y, z + (i >= 2 ? Math.cos(y * 5.5 + phase) * 0.018 : 0));
    });
    const curve = new THREE.CatmullRomCurve3(v, false, "catmullrom", 0.5);
    const strand = mesh(new THREE.TubeGeometry(curve, 56, radius, 8, false), mat.hair);
    hair.add(strand);
    strands.push(strand);
  };

  [-1, 1].forEach((s) => {
    // front curtains from the centre parting
    [0.4, 0.3, 0.2].forEach((z0, k) => {
      const y0 = Math.sqrt(0.26 - z0 * z0);
      addStrand(
        [
          [s * 0.02, y0, z0],
          [s * 0.3, y0 * 0.62 + 0.08, z0 * 0.95],
          [s * 0.46, -0.02, z0 * 0.72 + 0.04],
          [s * 0.5, -0.32, 0.3],
          [s * 0.47, -0.62, 0.3],
          [s * 0.43, -0.92, 0.35],
          [s * 0.42, -1.16 - k * 0.04, 0.35],
        ],
        0.07,
        k * 1.3 + (s > 0 ? 0.6 : 0),
        s
      );
    });

    // side and back strands
    const N = 14;
    for (let k = 0; k < N; k++) {
      const t = k / (N - 1);
      const z0 = lerp(0.18, -0.46, t);
      const front = smooth(-0.02, 0.16, z0);
      const xs = 0.47 + Math.cos(t * Math.PI) * -0.02 + (1 - Math.abs(z0) * 1.6) * 0.03;
      const drop = -1.08 - ((k * 37) % 7) * 0.03;
      addStrand(
        [
          [s * xs * 0.82, 0.24, z0 * 0.9],
          [s * xs, 0.0, z0],
          [s * (xs + 0.04), -0.3, z0 * 0.9 + front * 0.06],
          [s * lerp(0.6, 0.52, front), -0.58, lerp(z0 * 0.7 - 0.14, 0.24, front)],
          [s * lerp(0.6, 0.49, front), -0.86, lerp(-0.3, 0.3, front)],
          [s * lerp(0.56, 0.47, front), drop, lerp(-0.32, 0.31, front)],
        ],
        0.078 + ((k * 13) % 5) * 0.004,
        k * 0.85 + (s > 0 ? 0.4 : 0),
        s
      );
    }
  });

  // back mass fills the gaps behind the shoulders
  hair.add(outline(mesh(new THREE.CapsuleGeometry(0.42, 0.75, 8, 20), mat.hair, [0, -0.62, -0.26], null, [1.32, 1, 0.42]), 0.015));

  /* ---------- laptop with stickers ---------- */
  const laptop = new THREE.Group();
  laptop.position.set(0, 0.16, 0.8);
  laptop.scale.setScalar(0.8);
  root.add(laptop);
  laptop.add(outline(mesh(new THREE.BoxGeometry(1.06, 0.045, 0.62), mat.laptop), 0.02));
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, 0.02, 0.3);
  lidPivot.rotation.x = 0.2;
  laptop.add(lidPivot);
  const lid = outline(mesh(new THREE.BoxGeometry(1.06, 0.66, 0.04), mat.lid, [0, 0.33, 0]), 0.02);
  lidPivot.add(lid);
  const stickerMats = [0xffc93c, 0x2bd9a0, 0x6b8cff, 0xffffff, 0xff8a3d].map((c) => flat(c));
  [
    [-0.28, 0.42, 0.11, 0],
    [0.24, 0.48, 0.08, 1],
    [0.06, 0.24, 0.1, 2],
    [-0.12, 0.16, 0.055, 3],
    [0.33, 0.18, 0.07, 4],
  ].forEach(([x, y, r, i]) => {
    lidPivot.add(mesh(new THREE.CircleGeometry(r, 28), stickerMats[i], [x, y, 0.022]));
  });
  /* ---------- lights ---------- */
  const hemi = new THREE.HemisphereLight(0xffffff, 0x8890c0, 1.6);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(2.5, 3.5, 5);
  scene.add(key);
  const screenGlow = new THREE.PointLight(0x7fa0ff, 0, 3.2, 1);
  screenGlow.position.set(0, 0.75, 0.55);
  scene.add(screenGlow);

  const glowTint = [
    [mat.skin, new THREE.Color(0x24306e)],
    [mat.shirt, new THREE.Color(0x3a4fb0)],
    [mat.nose, new THREE.Color(0x24306e)],
  ];
  let dark = false;
  const applyTheme = () => {
    dark = document.documentElement.classList.contains("is-dark");
  };
  applyTheme();

  /* ---------- sizing ---------- */
  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the bust framed on narrow/tall stages
    camera.position.z = w / h < 0.85 ? 6.2 : 5.6;
    camera.updateProjectionMatrix();
    if (!running) renderer.render(scene, camera);
  };

  /* ---------- behaviour ---------- */
  const pointer = { x: 0, y: 0 };
  const look = { x: 0, y: 0 };
  let waveUntil = 0;
  let cheerUntil = 0;
  let surpriseUntil = 0;
  let nextBlink = performance.now() + 1800;
  let blinkStart = -1;
  let glow = 0;

  window.addEventListener(
    "pointermove",
    (e) => {
      const r = host.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height * 0.35;
      pointer.x = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth * 0.5)));
      pointer.y = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight * 0.6)));
    },
    { passive: true }
  );

  const clock = new THREE.Clock();
  let running = false;
  let rafId = 0;

  const frame = () => {
    const t = clock.getElapsedTime();
    const now = performance.now();

    // look at the cursor
    look.x += (pointer.x - look.x) * 0.08;
    look.y += (pointer.y - look.y) * 0.08;
    headPivot.rotation.y = look.x * 0.5;
    headPivot.rotation.x = look.y * 0.22;
    headPivot.rotation.z = -look.x * 0.06 + Math.sin(t * 0.8) * 0.015;
    body.rotation.y = look.x * 0.16;
    eyes.forEach((e) => {
      e.position.x = Math.sign(e.position.x) * 0.16 + look.x * 0.012;
      e.position.y = -look.y * 0.01;
    });

    // breathing + hair sway
    torso.scale.y = 1 + Math.sin(t * 1.7) * 0.012;
    shoulders.position.y = 0.92 + Math.sin(t * 1.7) * 0.006;
    hair.rotation.z = Math.sin(t * 0.9) * 0.012;
    strands.forEach((s, i) => (s.rotation.x = Math.sin(t * 1.1 + i * 0.4) * 0.008));

    // blink
    if (now > nextBlink && blinkStart < 0) blinkStart = now;
    let lid = 1;
    if (blinkStart >= 0) {
      const p = (now - blinkStart) / 160;
      lid = p < 0.5 ? 1 - p * 1.8 : 0.1 + (p - 0.5) * 1.8;
      if (p >= 1) {
        blinkStart = -1;
        lid = 1;
        nextBlink = now + 2200 + Math.random() * 3200;
      }
    }
    const surprised = now < surpriseUntil;
    eyes.forEach((e) => (e.scale.y = Math.max(0.08, lid) * (surprised ? 1.25 : 1)));
    brows.forEach((b) => (b.position.y += ((surprised ? 0.115 : 0.075) - b.position.y) * 0.2));
    smile.scale.set(surprised ? 0.7 : 1, surprised ? 1.4 : 1, 1);

    // arms: rest, wave, cheer
    const cheering = now < cheerUntil;
    const waving = now < waveUntil;
    const targetR = cheering ? -2.75 + Math.sin(t * 14) * 0.15 : waving ? -2.55 + Math.sin(t * 13) * 0.32 : -0.14;
    const targetL = cheering ? 2.75 + Math.sin(t * 14 + 1) * 0.15 : 0.14;
    armR.rotation.z += (targetR - armR.rotation.z) * 0.16;
    armL.rotation.z += (targetL - armL.rotation.z) * 0.16;
    root.position.y = cheering ? Math.abs(Math.sin(t * 9)) * 0.09 : root.position.y * 0.85;

    // theme: laptop glow on the face in dark mode
    glow += ((dark ? 1 : 0) - glow) * 0.08;
    screenGlow.intensity = glow * 5;
    glowTint.forEach(([m, c]) => m.emissive.copy(c).multiplyScalar(glow));
    hemi.intensity = 1.6 - glow * 0.55;
    key.intensity = 2.4 - glow * 0.9;

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(frame);
  };

  const start = () => {
    if (running || reduce) return;
    running = true;
    clock.start();
    rafId = requestAnimationFrame(frame);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(rafId);
  };

  new ResizeObserver(resize).observe(host);
  resize();

  if (reduce) {
    renderer.render(scene, camera);
  } else {
    new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop())).observe(host);
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  }

  const once = () => {
    if (!running) {
      // reduced motion: show the pose change as a single still
      frame();
      cancelAnimationFrame(rafId);
    }
  };

  window.avatar = {
    ready: true,
    wave(ms = 1800) {
      waveUntil = performance.now() + ms;
      once();
    },
    cheer(ms = 2200) {
      cheerUntil = performance.now() + ms;
      once();
    },
    surprise(ms = 700) {
      surpriseUntil = performance.now() + ms;
      once();
    },
  };

  document.addEventListener("themechange", () => {
    applyTheme();
    window.avatar.surprise();
    if (reduce) renderer.render(scene, camera);
  });
})();
