/* ============================================================
   Urban Latent Atlas — Main JS
   Canvas background · scroll animations · nav active state
   ============================================================ */

// ── Canvas Background ──────────────────────────────────────────
const canvas = document.getElementById('bg-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let W, H, t = 0;

  const CYAN  = [79, 70, 229];
  const ORANGE = [124, 58, 237];

  function rgba(c, a) {
    return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // Grid config
  const GRID = 48;

  // Nodes for neural-network feel
  const nodes = Array.from({ length: 28 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.18,
    vy: (Math.random() - 0.5) * 0.18,
    r: Math.random() * 1.5 + 0.5,
    phase: Math.random() * Math.PI * 2,
  }));

  function drawGrid() {
    ctx.strokeStyle = rgba(CYAN, 0.04);
    ctx.lineWidth = 0.5;

    for (let x = (t * 0.3) % GRID; x < W; x += GRID) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = (t * 0.2) % GRID; y < H; y += GRID) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  }

  function drawContours() {
    const bands = 5;
    for (let b = 0; b < bands; b++) {
      const yBase = H * (0.2 + b * 0.15);
      const amp = 30 + b * 10;
      const freq = 0.003 + b * 0.0008;
      const phase = t * 0.008 + b * 0.7;

      ctx.beginPath();
      ctx.moveTo(0, yBase);
      for (let x = 0; x <= W; x += 4) {
        const y = yBase
          + Math.sin(x * freq + phase) * amp
          + Math.sin(x * freq * 1.7 + phase * 1.3) * amp * 0.4;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }

      const alpha = 0.03 + b * 0.008;
      ctx.strokeStyle = b % 2 === 0 ? rgba(CYAN, alpha) : rgba(ORANGE, alpha * 0.6);
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }

  function drawTimeSeries() {
    const yBase = H * 0.82;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 2) {
      const progress = x / W;
      const y = yBase
        - Math.sin(progress * Math.PI * 6 + t * 0.015) * 18
        - Math.sin(progress * Math.PI * 14 + t * 0.01) * 7
        + Math.cos(progress * Math.PI * 3) * 12;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = rgba(CYAN, 0.06);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawNodes() {
    nodes.forEach(n => {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;

      const glow = 0.3 + 0.2 * Math.sin(t * 0.02 + n.phase);
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 6);
      grad.addColorStop(0, rgba(CYAN, glow * 0.7));
      grad.addColorStop(1, rgba(CYAN, 0));
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * 6, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = rgba(CYAN, 0.5 * glow);
      ctx.fill();
    });

    // Draw connections between nearby nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 160) {
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = rgba(CYAN, (1 - d / 160) * 0.04);
          ctx.lineWidth = 0.4;
          ctx.stroke();
        }
      }
    }
  }

  function drawScanLine() {
    const scanY = (t * 0.4) % H;
    const grad = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 4);
    grad.addColorStop(0, rgba(CYAN, 0));
    grad.addColorStop(1, rgba(CYAN, 0.025));
    ctx.fillStyle = grad;
    ctx.fillRect(0, scanY - 60, W, 64);
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    drawGrid();
    drawContours();
    drawTimeSeries();
    drawNodes();
    drawScanLine();
    t++;
    requestAnimationFrame(frame);
  }
  frame();
}

// ── Nav active state ───────────────────────────────────────────
function setActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.remove('active');
    if (a.getAttribute('href') === path) a.classList.add('active');
  });
}
setActiveNav();

// ── Mobile nav toggle ──────────────────────────────────────────
const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (toggle && navLinks) {
  toggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

// ── Intersection Observer (fade-in) ───────────────────────────
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.fade-in').forEach(el => obs.observe(el));

// ── Staggered fade-in for lists ────────────────────────────────
document.querySelectorAll('.pub-item, .card, .project-item, .teaching-item').forEach((el, i) => {
  el.classList.add('fade-in');
  el.style.transitionDelay = `${i * 0.06}s`;
  obs.observe(el);
});

// ── CV sidebar active on scroll ────────────────────────────────
const cvSections = document.querySelectorAll('.cv-section[id]');
const cvNavLinks = document.querySelectorAll('.cv-sidebar nav a');
if (cvSections.length && cvNavLinks.length) {
  const scrollObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        cvNavLinks.forEach(a => a.classList.remove('active'));
        const active = document.querySelector(`.cv-sidebar nav a[href="#${e.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });
  cvSections.forEach(s => scrollObs.observe(s));
}

// ── Portfolio filter ───────────────────────────────────────────
const filterBtns = document.querySelectorAll('.portfolio-nav button');
const portfolioItems = document.querySelectorAll('.portfolio-item');
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const cat = btn.dataset.cat;
    portfolioItems.forEach(item => {
      if (cat === 'all' || item.dataset.cat === cat) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
  });
});

// ── Lightbox ───────────────────────────────────────────────────
const lightbox = document.getElementById('lightbox');
if (lightbox) {
  document.querySelectorAll('.portfolio-item[data-src]').forEach(item => {
    item.addEventListener('click', () => {
      const img = lightbox.querySelector('img');
      img.src = item.dataset.src;
      lightbox.classList.add('active');
    });
  });
  lightbox.querySelector('.lightbox-close')?.addEventListener('click', () => {
    lightbox.classList.remove('active');
  });
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) lightbox.classList.remove('active');
  });
}

// ── Coord display (live random-looking coords) ─────────────────
const coord = document.querySelector('.coord-display');
if (coord) {
  const lat0 = 50.7753 + (Math.random() - 0.5) * 0.001;
  const lon0 = 6.0839  + (Math.random() - 0.5) * 0.001;
  setInterval(() => {
    coord.textContent = `${lat0.toFixed(4)}°N  ${lon0.toFixed(4)}°E`;
  }, 2000);
  coord.textContent = `${lat0.toFixed(4)}°N  ${lon0.toFixed(4)}°E`;
}

// ── Typed subtitle effect on hero ─────────────────────────────
const typedEl = document.querySelector('.hero-typed');
if (typedEl) {
  const phrases = [
    'Spatio-Temporal Data Mining',
    'Interpretable Machine Learning',
    'Urban Climate Intelligence',
    'GeoAI & Spatial Analysis',
    'Multimodal Urban Learning',
  ];
  let pi = 0, ci = 0, deleting = false;
  function type() {
    const current = phrases[pi];
    if (!deleting) {
      typedEl.textContent = current.slice(0, ci + 1);
      ci++;
      if (ci === current.length) {
        deleting = true;
        setTimeout(type, 1800);
        return;
      }
    } else {
      typedEl.textContent = current.slice(0, ci - 1);
      ci--;
      if (ci === 0) {
        deleting = false;
        pi = (pi + 1) % phrases.length;
      }
    }
    setTimeout(type, deleting ? 40 : 70);
  }
  setTimeout(type, 800);
}
