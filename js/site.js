(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Títulos: cada palavra sobe de dentro de uma máscara
  $$('[data-split]').forEach(h => {
    h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
    let k = 0;
    const walk = n => [...n.childNodes].forEach(c => {
      if (c.nodeType === 1) return walk(c);
      if (c.nodeType !== 3) return;
      const f = document.createDocumentFragment();
      c.textContent.split(/(\s+)/).forEach(t => {
        if (!t) return;
        if (!t.trim()) return f.append(' ');
        const w = document.createElement('span'), i = document.createElement('span');
        w.className = 'w'; w.setAttribute('aria-hidden', 'true');
        i.textContent = t; i.style.setProperty('--k', k++);
        w.append(i); f.append(w);
      });
      c.replaceWith(f);
    });
    walk(h);
  });

  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    e.target.classList.add('in');
  }), { threshold: .1, rootMargin: '0px 0px -6% 0px' });
  // O título da abertura não depende da rolagem
  setTimeout(() => $('h1').classList.add('in'), 120);
  // O clip-path esconde o próprio alvo, por isso o observado é o pai
  const clipIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    clipIO.unobserve(e.target);
    $('[data-clip]', e.target).classList.add('in');
  }), { threshold: .15 });
  $$('[data-clip]').forEach(c => clipIO.observe(c.parentElement));
  $$('[data-r],h2[data-split]').forEach(e => io.observe(e));

  // Menu
  const burger = $('.burger'), menu = $('#menu');
  const toggle = open => {
    menu.hidden = !open;
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  };
  burger.onclick = () => toggle(menu.hidden);
  menu.onclick = e => { if (e.target.closest('a')) toggle(false); };
  addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { toggle(false); burger.focus(); } });

  // Imagens que convertem
  const acc = $$('.acc button'), pics = $$('.stage img');
  acc.forEach((b, i) => b.onclick = () => {
    acc.forEach((x, j) => { x.classList.toggle('on', i === j); x.setAttribute('aria-expanded', i === j); });
    pics.forEach((x, j) => x.classList.toggle('on', i === j));
  });

  // Nichos
  const tabs = $$('[role=tab]'), panels = $$('.npanel');
  const pick = i => {
    tabs.forEach((x, j) => { x.setAttribute('aria-selected', i === j); x.tabIndex = i === j ? 0 : -1; });
    panels.forEach((x, j) => { x.hidden = i !== j; });
  };
  tabs.forEach((b, i) => {
    b.onclick = () => pick(i);
    b.onkeydown = e => {
      const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (d) { const n = (i + d + tabs.length) % tabs.length; pick(n); tabs[n].focus(); }
    };
  });
  pick(0);
  // Adianta as imagens dos outros nichos quando a seção se aproxima
  new IntersectionObserver((es, o) => {
    if (!es[0].isIntersecting) return;
    o.disconnect();
    $$('.npanel img').forEach(i => { i.loading = 'eager'; });
  }, { rootMargin: '300px' }).observe($('#nichos'));

  // Comparador: antes e depois (data-l e data-r2 trocam os rótulos)
  const cmp = $('.cmp'), range = $('input', cmp);
  const setX = v => {
    cmp.style.setProperty('--x', v + '%');
    cmp.classList.toggle('lo', v < 24);
    cmp.classList.toggle('hi', v > 68);
  };
  range.oninput = () => setX(range.value);
  const pairs = $$('.duotxt button');
  pairs.forEach(b => b.onclick = () => {
    pairs.forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
    const l = b.dataset.l || 'Capa comum', r = b.dataset.r2 || 'Capa DR';
    $('.a', cmp).src = b.dataset.a; $('.a', cmp).alt = l + ': ' + b.dataset.t;
    $('.b', cmp).src = b.dataset.b; $('.b', cmp).alt = r + ': ' + b.dataset.t;
    $('.tag.l', cmp).textContent = l; $('.tag.r', cmp).textContent = r;
    range.value = 50; setX(50);
  });
  // Um leve vai e vem mostra que dá para arrastar
  if (!calm) new IntersectionObserver((es, o) => {
    if (!es[0].isIntersecting) return;
    o.disconnect();
    let t0, stop = false;
    range.addEventListener('pointerdown', () => { stop = true; }, { once: true });
    const step = t => {
      t0 = t0 || t;
      const k = Math.min(1, (t - t0) / 1800);
      if (stop) return;
      setX(50 + Math.sin(k * Math.PI * 2) * 16 * (1 - k));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, { threshold: .5 }).observe(cmp);

  // Gráficos: valor do dia ao passar o mouse ou tocar
  const brl = v => 'R$ ' + v.toLocaleString('pt-BR');
  $$('.chart').forEach(ch => {
    const D = JSON.parse(ch.dataset.chart), tip = $('.tip', ch), cross = $('.cross', ch), dot = $('.dot', ch);
    const show = e => {
      const r = ch.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * 100;
      let k = 0;
      D.x.forEach((x, n) => { if (Math.abs(x - px) < Math.abs(D.x[k] - px)) k = n; });
      cross.setAttribute('x1', D.vx[k]); cross.setAttribute('x2', D.vx[k]);
      dot.setAttribute('cx', D.vx[k]); dot.setAttribute('cy', D.vy[k]);
      tip.textContent = `${D.d[k]}: ${brl(D.c[k])} (antes ${brl(D.p[k])})`;
      tip.style.left = Math.min(74, Math.max(26, D.x[k])) + '%';
      tip.hidden = false; ch.classList.add('on');
    };
    const hide = () => { tip.hidden = true; ch.classList.remove('on'); };
    ch.addEventListener('pointermove', show);
    ch.addEventListener('pointerdown', show);
    ch.addEventListener('pointerleave', hide);
  });

  // Print original em tela cheia
  const lb = $('.lb');
  $$('.seeprint').forEach(b => b.onclick = () => {
    const im = $('img', lb);
    im.src = b.dataset.print; im.alt = b.dataset.alt; im.width = b.dataset.w; im.height = b.dataset.h;
    lb.showModal();
  });
  lb.onclick = e => { if (e.target === lb || e.target.closest('.arrow')) lb.close(); };

  // Galerias do portfólio
  $$('.gal').forEach(g => {
    const t = $('.track', g), n = t.children.length, c = $('.count', g);
    const at = () => Math.round(t.scrollLeft / t.clientWidth);
    const go = i => t.scrollTo({ left: ((i + n) % n) * t.clientWidth, behavior: calm ? 'auto' : 'smooth' });
    $('.prev', g).onclick = () => go(at() - 1);
    $('.next', g).onclick = () => go(at() + 1);
    t.addEventListener('scroll', () => { c.textContent = `${at() + 1} / ${n}`; }, { passive: true });
  });

  // Depoimentos
  const q = $('.quotes'), [qp, qn] = $$('.ctrl .arrow');
  const move = d => q.scrollBy({ left: d * (q.firstElementChild.offsetWidth + 20), behavior: calm ? 'auto' : 'smooth' });
  const qs = () => { qp.disabled = q.scrollLeft < 8; qn.disabled = q.scrollLeft > q.scrollWidth - q.clientWidth - 8; };
  qp.onclick = () => move(-1);
  qn.onclick = () => move(1);
  q.addEventListener('scroll', qs, { passive: true });
  qs();

  // Rolagem: leque da abertura, etapas na horizontal e botão flutuante
  const fan = $('.fan'), proc = $('.proc'), steps = $('.steps'), prog = $('.prog'), fl = $('.float');
  let dist = 0, pinned = false, queued = false;
  const frame = () => {
    queued = false;
    if (!calm && scrollY < innerHeight) fan.style.setProperty('--sp', (scrollY / innerHeight).toFixed(3));
    fl.classList.toggle('in', scrollY > innerHeight * .7);
    let p;
    if (pinned) {
      p = Math.min(1, Math.max(0, -proc.getBoundingClientRect().top / (dist || 1)));
      steps.style.transform = `translate3d(${-p * dist}px,0,0)`;
    } else p = steps.scrollLeft / (steps.scrollWidth - steps.clientWidth || 1);
    prog.style.setProperty('--p', .12 + p * .88);
  };
  const layout = () => {
    document.documentElement.style.setProperty('--sb', innerWidth - document.documentElement.clientWidth + 'px');
    pinned = !calm && innerWidth > 1000 && innerHeight >= 620;
    proc.classList.toggle('pinned', pinned);
    steps.style.transform = '';
    dist = pinned ? Math.max(0, steps.offsetWidth - document.documentElement.clientWidth) : 0;
    proc.style.height = pinned ? innerHeight + dist + 'px' : '';
    frame();
  };
  const ask = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', ask, { passive: true });
  steps.addEventListener('scroll', ask, { passive: true });
  addEventListener('resize', layout);
  if (document.fonts) document.fonts.ready.then(layout);
  layout();

  // Proteção das imagens, mantida do site anterior
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('keydown', e => { if (e.ctrlKey && (e.key === 's' || e.key === 'u')) e.preventDefault(); });
})();
