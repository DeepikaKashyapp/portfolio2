/* =========================================================
   Interactive terminal. Commands print facts about Deepika,
   switch the theme, start the game, and hide one easter egg.
   ========================================================= */
(() => {
  "use strict";

  const out = document.getElementById("termOut");
  const form = document.getElementById("termForm");
  const input = document.getElementById("termInput");
  if (!out || !form || !input) return;

  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const print = (html, cls = "") => {
    const line = document.createElement("div");
    if (cls) line.className = cls;
    line.innerHTML = html;
    out.appendChild(line);
    out.scrollTop = out.scrollHeight;
  };

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (window.siteScrollTo) window.siteScrollTo(el);
    else el.scrollIntoView({ behavior: "smooth" });
  };

  const commands = {
    help: () =>
      print(
        [
          '<span class="c-kw">available commands</span>',
          '  <span class="c-fn">whoami</span>        who is Deepika?',
          '  <span class="c-fn">projects</span>      things I\'ve built',
          '  <span class="c-fn">experience</span>    where I\'ve shipped',
          '  <span class="c-fn">skills</span>        tools I reach for',
          '  <span class="c-fn">now</span>           what I\'m up to',
          '  <span class="c-fn">fun</span>           fun facts',
          '  <span class="c-fn">contact</span>       how to reach me',
          '  <span class="c-fn">play</span>          start Deploy Dash',
          '  <span class="c-fn">theme</span> [dark|light]',
          '  <span class="c-fn">clear</span>         clear the screen',
          '<span class="c-dim">psst: there\'s one sudo command hidden in here.</span>',
        ].join("\n")
      ),
    whoami: () =>
      print(
        "Deepika Kashyap. B.Tech ECE @ CSJM University, Kanpur ('24–'28).\n" +
          "Backend-focused full-stack & AI/ML developer. I build software that keeps working\n" +
          "when the network, the hardware, or the traffic doesn't."
      ),
    projects: () => {
      print(
        [
          '<span class="c-num">01</span> CodeTrack++        leaderboard ~320ms → &lt;50ms with Redis',
          '<span class="c-num">02</span> CLIP detector      0.76 ROC-AUC on image–title mismatches',
          '<span class="c-num">03</span> Zero-Waste Vision  waste sorting at ~6 FPS on CPU',
          '<span class="c-num">04</span> EchoChat           offline SOS mesh, AODV + e2e encryption (team)',
          '<span class="c-num">05</span> Chaitanya          Hindi-first mental-health support (team)',
          '<span class="c-dim">→ scrolling you to the work section…</span>',
        ].join("\n")
      );
      setTimeout(() => scrollToId("work"), 700);
    },
    experience: () => {
      print(
        "Junior Web Developer Intern · Irafactory Media Agency · Jun–Aug 2026\n" +
          "  Figma → React/WordPress/Webflow sites, REST API integration,\n" +
          "  headless CMS schemas, SEO + Lighthouse work.\n" +
          "Open Source Contributor · GSSoC 2026"
      );
      setTimeout(() => scrollToId("experience"), 700);
    },
    skills: () =>
      print(
        '<span class="c-kw">languages</span>  Python, C++, JavaScript, TypeScript, Java, SQL, Kotlin\n' +
          '<span class="c-kw">frontend</span>   React, HTML/CSS, Tailwind, WordPress, Webflow, Figma\n' +
          '<span class="c-kw">backend</span>    Node.js, Express, Flask, PostgreSQL, Redis, JWT\n' +
          '<span class="c-kw">ai/ml</span>      PyTorch, OpenCV, YOLOv8, CLIP, scikit-learn, Gemini\n' +
          '<span class="c-kw">tools</span>      Git, Docker, Vercel, Netlify, Postman, Linux'
      ),
    now: () =>
      print(
        "• building projects across web dev, AI/ML and DSA\n" +
          "• practising DSA consistently (200+ problems so far)\n" +
          "• exploring LLMs and AI-powered apps\n" +
          "• learning system design and better engineering practices"
      ),
    fun: () =>
      print(
        "💃 dancing · 🎤 singing · 🎧 music, always · 🎨 art & crafts\n" +
          "☕ chai AND coffee. refusing to choose.\n" +
          "🏆 hackathons are my favourite mix of tech + creativity."
      ),
    contact: () =>
      print(
        'email     deepikashyap85@gmail.com\n' +
          'linkedin  <a href="https://www.linkedin.com/in/deepika-kashyap-2270bb36a/" target="_blank" rel="noopener noreferrer">/in/deepika-kashyap</a>\n' +
          'github    <a href="https://github.com/DeepikaKashyapp" target="_blank" rel="noopener noreferrer">@DeepikaKashyapp</a>'
      ),
    play: () => {
      print('<span class="c-dim">launching deploy_dash.exe… jump with Space or tap.</span>');
      window.deployDash?.start();
    },
    theme: (arg) => {
      const isDark = document.documentElement.classList.contains("is-dark");
      const want = arg === "dark" ? true : arg === "light" ? false : !isDark;
      if (want !== isDark) window.setTheme?.(want ? "dark" : "light");
      print(`theme set to <span class="c-kw">${want ? "dark" : "light"}</span>`);
    },
    clear: () => (out.innerHTML = ""),
    ls: () => print("about/  work/  experience/  skills/  playground/  now.md  fun-facts.txt  resume.pdf"),
    cat: (arg) => {
      if (/fun/.test(arg || "")) return commands.fun();
      if (/now/.test(arg || "")) return commands.now();
      if (/resume/.test(arg || "")) return print("it's a PDF, not a txt 🙂 — use the Résumé button in contact.");
      print(`<span class="c-err">cat: ${esc(arg || "")}: no such file</span>`);
    },
    date: () => print(new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST"),
    echo: (arg) => print(esc(arg || "")),
    sudo: (arg) => {
      if (/^hire[- ]?deepika$/i.test((arg || "").trim())) {
        print('<span class="c-kw">[sudo]</span> permission granted. great choice. 🎉\n→ deepikashyap85@gmail.com');
        const r = out.getBoundingClientRect();
        window.confetti?.({ x: r.left + r.width / 2, y: r.top + r.height / 2, count: 180 });
        window.avatar?.cheer();
        return;
      }
      print('<span class="c-err">nice try. this incident will be reported. 😄</span>');
    },
  };
  commands.about = commands.whoami;
  commands["hire-deepika"] = () => commands.sudo("hire-deepika");

  const history = [];
  let hIdx = 0;

  const run = (raw) => {
    const line = raw.trim();
    print(`<span class="c-ps">guest@deepika</span>:<span class="c-fn">~</span>$ <span class="c-cmd">${esc(line)}</span>`);
    if (!line) return;
    history.push(line);
    hIdx = history.length;
    const [cmd, ...rest] = line.split(/\s+/);
    const fn = commands[cmd.toLowerCase()];
    if (fn) fn(rest.join(" "));
    else print(`<span class="c-err">command not found: ${esc(cmd)}</span> <span class="c-dim">— try 'help'</span>`);
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    run(input.value);
    input.value = "";
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" && history.length) {
      e.preventDefault();
      hIdx = Math.max(0, hIdx - 1);
      input.value = history[hIdx];
    } else if (e.key === "ArrowDown" && history.length) {
      e.preventDefault();
      hIdx = Math.min(history.length, hIdx + 1);
      input.value = history[hIdx] || "";
    } else if (e.key === "Tab") {
      const v = input.value.trim().toLowerCase();
      if (!v) return;
      const match = Object.keys(commands).find((c) => c.startsWith(v));
      if (match) {
        e.preventDefault();
        input.value = match + " ";
      }
    }
  });

  out.addEventListener("click", () => input.focus({ preventScroll: true }));

  print('<span class="c-kw">deepika-os</span> v3.0 <span class="c-dim">(kanpur build)</span>');
  print('Type <span class="c-fn">help</span> to see what I can do.');
})();
