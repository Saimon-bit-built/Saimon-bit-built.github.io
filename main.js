/* ============================================================
   Shraendraight — scroll-driven 3D experience
   Fixed Three.js scene behind a normally-scrolling page.
   ============================================================ */

const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.getElementById("year").textContent = new Date().getFullYear();

/* ---------- Intro loader: logo draws itself, fills, tagline, fade out ---------- */
(function initIntro() {
  const intro = document.getElementById("intro");
  if (!intro) return;
  if (REDUCE_MOTION) { intro.remove(); return; }

  // line-drawing animation using the path's real length
  const path = intro.querySelector(".intro-draw path");
  const len = path.getTotalLength();
  path.style.strokeDasharray = len;
  path.style.strokeDashoffset = len;
  path.style.transition = "stroke-dashoffset 1.5s cubic-bezier(0.65, 0, 0.35, 1)";
  requestAnimationFrame(() =>
    requestAnimationFrame(() => (path.style.strokeDashoffset = "0"))
  );

  const fillTimer = setTimeout(() => intro.classList.add("intro-filled"), 1450);

  let done = false;
  const end = () => {
    if (done) return;
    done = true;
    clearTimeout(fillTimer);
    intro.classList.add("intro-done");
    setTimeout(() => intro.remove(), 900);
  };
  intro.addEventListener("click", end);
  setTimeout(end, 3300);
})();

/* ---------- Discord username: click to copy ---------- */
const discordBtn = document.getElementById("discord-copy");
if (discordBtn) {
  const original = discordBtn.textContent;
  discordBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(discordBtn.dataset.username);
      discordBtn.textContent = "Copied! Add me on Discord ✓";
    } catch {
      discordBtn.textContent = "Username: " + discordBtn.dataset.username;
    }
    setTimeout(() => (discordBtn.textContent = original), 2500);
  });
}

/* ---------- Custom crosshair cursor ---------- */
(function initCursor() {
  if (!window.matchMedia("(pointer: fine)").matches) return;
  const cursor = document.getElementById("cursor");
  if (!cursor) return;
  document.body.classList.add("has-cursor");

  let tx = -100, ty = -100, x = -100, y = -100;
  window.addEventListener("pointermove", (e) => {
    tx = e.clientX;
    ty = e.clientY;
    const hit = e.target.closest && e.target.closest("a, button, summary, .work-circle");
    cursor.classList.toggle("active", !!hit);
  });

  (function follow() {
    x += (tx - x) * 0.35;
    y += (ty - y) * 0.35;
    cursor.style.transform = `translate(${x}px, ${y}px)`;
    requestAnimationFrame(follow);
  })();
})();

/* ---------- Scroll reveals + text decode ---------- */
(function initReveals() {
  if (REDUCE_MOTION) return;

  const DECODE_CHARS = "!<>-_/[]{}=+*^?#01";
  function decode(el) {
    if (el.dataset.decoded) return;
    el.dataset.decoded = "1";
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) if (n.nodeValue.trim()) nodes.push({ node: n, orig: n.nodeValue });
    const duration = 650;
    const start = performance.now();
    (function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      for (const { node, orig } of nodes) {
        const reveal = Math.floor(p * orig.length);
        let out = orig.slice(0, reveal);
        for (let i = reveal; i < orig.length; i++) {
          out += orig[i] === " " ? " " : DECODE_CHARS[(Math.random() * DECODE_CHARS.length) | 0];
        }
        node.nodeValue = out;
      }
      if (p < 1) requestAnimationFrame(tick);
      else nodes.forEach(({ node, orig }) => (node.nodeValue = orig));
    })(start);
  }

  const targets = document.querySelectorAll(
    ".sec-label, .section h2, .sec-sub, .stats-row .stat, .timeline-item, .plan-row, .faq-item, .contact-links, .contact-note"
  );
  // stagger siblings within each parent
  const counts = new Map();
  targets.forEach((el) => {
    const k = el.parentElement;
    const i = counts.get(k) || 0;
    counts.set(k, i + 1);
    el.classList.add("reveal");
    el.style.transitionDelay = `${Math.min(i * 70, 350)}ms`;
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("visible");
        if (e.target.matches("h2, .sec-label")) decode(e.target);
        revealObserver.unobserve(e.target);
      }
    },
    { threshold: 0.15 }
  );
  targets.forEach((el) => revealObserver.observe(el));
})();

/* ---------- Magnetic buttons ---------- */
(function initMagnetic() {
  if (REDUCE_MOTION || !window.matchMedia("(pointer: fine)").matches) return;
  document.querySelectorAll(".btn").forEach((btn) => {
    btn.addEventListener("pointermove", (e) => {
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width / 2) * 0.22;
      const dy = (e.clientY - r.top - r.height / 2) * 0.22;
      btn.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    btn.addEventListener("pointerleave", () => (btn.style.transform = ""));
  });
})();

/* ---------- Stat counters ---------- */
const statObserver = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      statObserver.unobserve(e.target);
      const target = Number(e.target.dataset.count);
      const suffix = e.target.dataset.suffix || "";
      const duration = 1400;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        e.target.textContent = Math.round(target * eased).toLocaleString() + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  },
  { threshold: 0.5 }
);
document.querySelectorAll(".stat-num[data-count]").forEach((el) => statObserver.observe(el));

/* ---------- News fades once you leave the hero ---------- */
window.addEventListener(
  "scroll",
  () => document.body.classList.toggle("scrolled", window.scrollY > window.innerHeight * 0.4),
  { passive: true }
);

/* ---------- Section watcher: background word + info text ---------- */
const infoText = document.getElementById("info-text");
let sectionInfo = infoText.textContent; // current section's default line
let circleInfoActive = false;

// The 3D layer registers this to receive word changes
const sceneHooks = { setWord: null };

function setInfo(text) {
  if (infoText.textContent !== text) infoText.textContent = text;
}

const sectionObserver = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const word = e.target.dataset.word;
      const info = e.target.dataset.info;
      const wordOpacity = e.target.dataset.wordOpacity;
      if (word && sceneHooks.setWord) sceneHooks.setWord(word, parseFloat(wordOpacity || "0.95"));
      if (info) {
        sectionInfo = info;
        if (!circleInfoActive) setInfo(info);
      }
    }
  },
  { rootMargin: "-45% 0px -45% 0px" } // fires when a section crosses mid-screen
);
document.querySelectorAll("[data-word]").forEach((el) => sectionObserver.observe(el));

/* ---------- Highlights: circles travel bottom-right → top-left ---------- */
(function initWorksScroll() {
  const section = document.querySelector(".works-scroll");
  const circles = Array.from(document.querySelectorAll(".work-circle"));
  if (!section || !circles.length || REDUCE_MOTION) return;

  const STAGGER = 0.32;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  function update() {
    if (window.innerWidth < 768) {
      circles.forEach((c) => (c.style.transform = "none"));
      return;
    }

    const rect = section.getBoundingClientRect();
    const runway = section.offsetHeight - window.innerHeight;
    const progress = clamp01(-rect.top / runway);

    const W = window.innerWidth;
    const H = window.innerHeight;
    const start = { x: W * 1.08, y: H * 1.12 };
    const end = { x: -W * 0.35, y: -H * 0.45 };
    const totalSpan = 1 + STAGGER * (circles.length - 1);

    let centered = null;
    let bestDist = Infinity;

    circles.forEach((c, i) => {
      const t = clamp01(progress * totalSpan - STAGGER * i);
      const half = c.offsetWidth / 2;
      const cx = lerp(start.x, end.x, t);
      const cy = lerp(start.y, end.y, t) - Math.sin(Math.PI * t) * H * 0.06;
      const scale = 0.8 + 0.3 * Math.sin(Math.PI * t);
      const rot = (t - 0.5) * 10;
      c.style.transform = `translate(${cx - half}px, ${cy - half}px) scale(${scale}) rotate(${rot}deg)`;

      // track whichever circle is nearest mid-screen
      const dist = Math.hypot(cx - W / 2, cy - H / 2);
      if (dist < bestDist) {
        bestDist = dist;
        centered = c;
      }
    });

    // while a circle holds the center, its title/desc takes over the info box
    const inWorks = rect.top < H * 0.5 && rect.bottom > H * 0.5;
    const hasCenter = inWorks && centered && bestDist < Math.min(W, H) * 0.28;
    circles.forEach((c) => {
      const isCenter = hasCenter && c === centered;
      c.classList.toggle("is-center", isCenter);
      const v = c.querySelector("video");
      if (v) {
        if (isCenter && v.paused) v.play().catch(() => {});
        else if (!isCenter && !v.paused) v.pause();
      }
    });
    if (hasCenter) {
      circleInfoActive = true;
      setInfo(`${centered.dataset.title} — ${centered.dataset.desc}`);
    } else if (circleInfoActive) {
      circleInfoActive = false;
      setInfo(sectionInfo);
    }
  }

  let queued = false;
  const requestUpdate = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      update();
    });
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  update();
})();

/* ---------- Clip playback on phones / reduced motion (static circle layout) ---------- */
(function initStaticClipPlayback() {
  if (!(window.innerWidth < 768 || REDUCE_MOTION)) return;
  const vio = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) e.target.play().catch(() => {});
        else e.target.pause();
      }
    },
    { threshold: 0.6 }
  );
  document.querySelectorAll(".work-circle video").forEach((v) => vio.observe(v));
})();

/* ============================================================
   3D SCENE — fixed behind the page
   ============================================================ */
(function initScene() {
  if (typeof THREE === "undefined") return; // CDN failed — page still fully works

  const canvas = document.getElementById("scene");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e1014);
  scene.fog = new THREE.Fog(0x0e1014, 14, 45);

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.4, 11);

  /* ----- Environment map (hand-built room so the glass has something to refract) ----- */
  const pmrem = new THREE.PMREMGenerator(renderer);
  (function makeEnvironment() {
    const env = new THREE.Scene();
    env.background = new THREE.Color(0x14161c);
    const box = new THREE.BoxGeometry(1, 1, 1);
    const put = (color, x, y, z, sx, sy, sz) => {
      const m = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color }));
      m.position.set(x, y, z);
      m.scale.set(sx, sy, sz);
      env.add(m);
    };
    put(0xffffff, 0, 6, 0, 8, 0.5, 8);      // bright ceiling strip for glass highlights
    put(0xdfe4f0, -7, 1, 2, 0.5, 6, 6);
    put(0x30343f, 7, 0, -2, 0.5, 5, 5);
    put(0xff4655, 3, -5, -3, 4, 0.5, 4);    // red kick from below
    scene.environment = pmrem.fromScene(env, 0.04).texture;
  })();

  /* ----- Lights ----- */
  scene.add(new THREE.AmbientLight(0xffffff, 0.45));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
  keyLight.position.set(4, 6, 8);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0xff4655, 0.55); // stronger red rim in the dark
  rimLight.position.set(-6, -2, -4);
  scene.add(rimLight);

  /* ----- Massive background word (crossfades between sections) ----- */
  const wordCanvas = document.createElement("canvas");
  wordCanvas.width = 2048;
  wordCanvas.height = 512;
  const wordCtx = wordCanvas.getContext("2d");
  const wordTexture = new THREE.CanvasTexture(wordCanvas);
  wordTexture.colorSpace = THREE.SRGBColorSpace;
  wordTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const wordOff = document.createElement("canvas"); // scratch buffer for glitch slices
  wordOff.width = 2048;
  wordOff.height = 512;
  const wordOffCtx = wordOff.getContext("2d");

  function drawWord(word, glitch) {
    wordCtx.clearRect(0, 0, 2048, 512);
    wordCtx.textAlign = "center";
    wordCtx.textBaseline = "middle";
    let size = 400;
    wordCtx.font = `900 ${size}px "Segoe UI", "Arial Black", system-ui, sans-serif`;
    const w = wordCtx.measureText(word).width;
    if (w > 1900) {
      size = Math.floor(size * (1900 / w));
      wordCtx.font = `900 ${size}px "Segoe UI", "Arial Black", system-ui, sans-serif`;
    }

    if (!glitch) {
      wordCtx.fillStyle = "#ffffff";
      wordCtx.fillText(word, 1024, 275);
    } else {
      // RGB split
      wordCtx.globalAlpha = 0.85;
      wordCtx.fillStyle = "#ff4655";
      wordCtx.fillText(word, 1024 - 8 - Math.random() * 8, 275);
      wordCtx.fillStyle = "#54e6ff";
      wordCtx.fillText(word, 1024 + 8 + Math.random() * 8, 275);
      wordCtx.globalAlpha = 1;
      wordCtx.fillStyle = "#ffffff";
      wordCtx.fillText(word, 1024 + (Math.random() * 6 - 3), 275);

      // displaced horizontal slices
      wordOffCtx.clearRect(0, 0, 2048, 512);
      wordOffCtx.drawImage(wordCanvas, 0, 0);
      const slices = 3 + (Math.random() * 3) | 0;
      for (let i = 0; i < slices; i++) {
        const y = (Math.random() * 460) | 0;
        const h = 12 + (Math.random() * 42) | 0;
        const shift = (Math.random() * 90 - 45) | 0;
        wordCtx.clearRect(0, y, 2048, h);
        wordCtx.drawImage(wordOff, 0, y, 2048, h, shift, y, 2048, h);
      }
    }
    wordTexture.needsUpdate = true;
  }

  let wordOpacityTarget = 0.95; // per-section: bold in hero/works, faint behind reading sections
  let currentWord = "SHRAEN";
  let targetWord = "SHRAEN";
  drawWord(currentWord);

  const wordMaterial = new THREE.MeshBasicMaterial({
    map: wordTexture,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
  });
  const wordPlane = new THREE.Mesh(new THREE.PlaneGeometry(26, 6.5), wordMaterial);
  wordPlane.position.set(0, 0.7, -7);
  scene.add(wordPlane);

  sceneHooks.setWord = (w, opacity) => {
    targetWord = w;
    if (typeof opacity === "number" && !isNaN(opacity)) wordOpacityTarget = opacity;
    if (REDUCE_MOTION) {
      currentWord = w;
      drawWord(w);
      wordMaterial.opacity = wordOpacityTarget;
      renderer.render(scene, camera);
    }
  };

  /* ----- Grid floor ----- */
  const grid = new THREE.GridHelper(90, 60, 0x2c313d, 0x21252f);
  grid.material.transparent = true;
  grid.material.opacity = 0.7;
  grid.position.y = -4.5;
  scene.add(grid);

  /* ----- Glass centerpiece: the Shraendraight "S" mark ----- */
  // Outline traced from assets/brand/logo.png (grid-sampled silhouette),
  // in image pixel coordinates (479×350, y down).
  const LOGO_OUTLINE = [
    [20, 0], [54, 0], [48, 6.5], [25, 6.5], [21.5, 12],   // top bar + left step
    [74, 12], [87, 13], [80, 20],                          // middle bar right tip
    [69, 30.5], [34, 30.5],                                // lower bar
    [24, 43], [11, 43],                                    // bottom-left tail
    [29, 25], [62, 24.5], [66, 20],                        // inner notch
    [0.5, 20], [7, 12], [9.5, 12],                         // middle bar left tip
  ].map(([c, r]) => [c * 5.44, 350 - r * 7.95]);           // grid → pixels, y up

  const glassGroup = new THREE.Group();
  (function buildGlassLogo() {
    const shape = new THREE.Shape();
    LOGO_OUTLINE.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 55,
      bevelEnabled: true,
      bevelThickness: 8,
      bevelSize: 7,
      bevelSegments: 3,
    });
    geo.center();

    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transmission: 1,          // real refraction — bends the word + grid behind it
        thickness: 2,
        roughness: 0.06,
        metalness: 0,
        ior: 1.5,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        iridescence: 0.35,        // subtle chromatic shimmer
        iridescenceIOR: 1.3,
      })
    );
    mesh.scale.setScalar(0.0105); // pixels → world units (~5 wide)
    glassGroup.add(mesh);
  })();
  const glassMesh = glassGroup.children[0];

  // red gyroscope ring orbiting the logo
  const orbitRing = new THREE.Mesh(
    new THREE.TorusGeometry(3.1, 0.016, 8, 160),
    new THREE.MeshBasicMaterial({ color: 0xff4655, transparent: true, opacity: 0.85 })
  );
  glassGroup.add(orbitRing);
  const orbitRingOuter = new THREE.Mesh(
    new THREE.TorusGeometry(3.45, 0.007, 8, 160),
    new THREE.MeshBasicMaterial({ color: 0xff4655, transparent: true, opacity: 0.3 })
  );
  glassGroup.add(orbitRingOuter);

  glassGroup.position.set(0, 0.15, 0);
  scene.add(glassGroup);

  /* ----- Small floaters + particles ----- */
  const pearl = (tint) =>
    new THREE.MeshStandardMaterial({ color: tint, metalness: 0.35, roughness: 0.15 });

  const floaters = [
    { geo: new THREE.OctahedronGeometry(0.5, 0), pos: [-5.2, 2.4, -3], spin: 0.25 },
    { geo: new THREE.IcosahedronGeometry(0.4, 0), pos: [5.4, -2.2, -2], spin: 0.3 },
    { geo: new THREE.OctahedronGeometry(0.3, 0), pos: [4.8, 2.8, -4], spin: 0.35 },
  ].map((d, i) => {
    const m = new THREE.Mesh(d.geo, pearl(i === 2 ? 0xff4655 : 0xffffff));
    m.position.set(...d.pos);
    m.userData = { baseY: d.pos[1], spin: d.spin, phase: i * 2.1 };
    scene.add(m);
    return m;
  });

  const COUNT = 300;
  const positions = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 30;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
    positions[i * 3 + 2] = -Math.random() * 16;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    particleGeo,
    new THREE.PointsMaterial({ color: 0x6b7284, size: 0.045, transparent: true, opacity: 0.6 })
  );
  scene.add(particles);

  /* ----- Mouse + scroll ----- */
  const mouse = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  });

  let scrollY = window.scrollY;
  window.addEventListener("scroll", () => (scrollY = window.scrollY), { passive: true });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (REDUCE_MOTION) renderer.render(scene, camera);
  });

  /* ----- Animation loop ----- */
  const clock = new THREE.Clock();
  let nextGlitch = 3.5;
  let glitchEnd = 0;
  let wasGlitching = false;

  function animate() {
    const t = clock.getElapsedTime();
    const vh = window.innerHeight;

    // occasional RGB-split glitch on the giant word
    if (t > nextGlitch) {
      glitchEnd = t + 0.16 + Math.random() * 0.18;
      nextGlitch = t + 4.5 + Math.random() * 4.5;
    }
    if (t < glitchEnd) {
      drawWord(currentWord, true); // re-randomizes every frame while active
      wasGlitching = true;
    } else if (wasGlitching) {
      wasGlitching = false;
      drawWord(currentWord, false);
    }

    // word crossfade + per-section brightness
    if (targetWord !== currentWord) {
      wordMaterial.opacity = Math.max(0, wordMaterial.opacity - 0.07);
      if (wordMaterial.opacity === 0) {
        currentWord = targetWord;
        drawWord(currentWord);
      }
    } else {
      wordMaterial.opacity += (wordOpacityTarget - wordMaterial.opacity) * 0.06;
    }

    // glass logo: idle sway + mouse parallax, floats away as you scroll past the hero
    const heroP = Math.min(scrollY / vh, 1.3);
    glassGroup.position.y = 0.15 + heroP * 5;
    glassGroup.position.x = mouse.x * 0.5;
    const s = 1 - 0.3 * Math.min(heroP, 1);
    glassGroup.scale.setScalar(s);
    glassMesh.rotation.y = Math.sin(t * 0.35) * 0.45 + mouse.x * 0.5 + scrollY * 0.0008;
    glassMesh.rotation.x = Math.sin(t * 0.22) * 0.12 - mouse.y * 0.3;
    glassMesh.rotation.z = Math.sin(t * 0.28) * 0.05;

    // gyroscope rings: tilted planes precessing around the logo
    orbitRing.rotation.set(1.25 + Math.sin(t * 0.3) * 0.15, t * 0.45, 0);
    orbitRingOuter.rotation.set(-1.1 + Math.cos(t * 0.25) * 0.12, -t * 0.3, 0.3);

    // floaters + particles
    for (const m of floaters) {
      m.rotation.x += m.userData.spin * 0.004;
      m.rotation.y += m.userData.spin * 0.006;
      m.position.y = m.userData.baseY + Math.sin(t * 0.5 + m.userData.phase) * 0.3;
    }
    particles.rotation.y = t * 0.012;

    // camera: gentle mouse sway + scroll drift
    const drift = scrollY * 0.0009;
    camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.03;
    camera.position.y += (0.4 - mouse.y * 0.3 - drift - camera.position.y) * 0.03;
    camera.lookAt(0, 0.2 - drift, -2);

    // word drifts slightly slower than the page (depth parallax)
    wordPlane.position.y = 0.7 + drift * 1.2;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  if (REDUCE_MOTION) {
    renderer.render(scene, camera);
  } else {
    animate();
  }
})();
