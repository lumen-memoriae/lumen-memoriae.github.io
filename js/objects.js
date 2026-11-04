/* =====================================================================
   ПРЕДМЕТЫ НА ПОЛКЕ
   Каждый тип: name — подпись в меню, w — ширина основания (для раскладки),
   fields — настройки в форме «Добавить объект», make(params) — 3D-модель.
   ===================================================================== */
const shelfWood = { light: null };
function lightWood() { return shelfWood.light || (shelfWood.light = woodCanvas(true)); }

/* 1. яйца + бутылка водки */
function makeVodka(p) {
  const g = new THREE.Group();
  const board = new THREE.Mesh(new THREE.BoxGeometry(.66, .03, .3), Mt('#a8784e', { map: lightWood() })); board.position.y = .015; g.add(board);
  const prof = [[0, 0], [.075, 0], [.08, .012], [.08, .3], [.072, .355], [.033, .43], [.028, .52], [0, .52]].map(q => new THREE.Vector2(q[0], q[1]));
  const bottle = new THREE.Mesh(new THREE.LatheGeometry(prof, 28), Mt('#dfe9f2', { transparent: true, opacity: .42, roughness: .06, metalness: .1, side: THREE.DoubleSide, depthWrite: false }));
  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(.073, .073, .3, 24), Mt('#eaf2fa', { transparent: true, opacity: .22, roughness: .05, depthWrite: false })); liquid.position.y = .16;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.034, .034, .06, 20), Mt('#c3c6cc', { metalness: .8, roughness: .3 })); cap.position.y = .55;
  const labelT = canvasTex(512, 256, (x, w, h) => {
    x.fillStyle = '#f3ede0'; x.fillRect(0, 0, w, h); x.strokeStyle = p.accent; x.lineWidth = 8; x.strokeRect(14, 14, w - 28, h - 28);
    x.fillStyle = p.accent; fitFont(x, p.label, 440, 96, '700 {}px "Cormorant Garamond", Georgia, serif'); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(p.label, w / 2, h / 2 + 4);
    x.fillStyle = '#8a6a2c'; x.font = '600 28px "Cormorant Garamond", Georgia, serif'; x.fillText(p.sub, w / 2, h - 46);
  });
  const label = new THREE.Mesh(new THREE.CylinderGeometry(.0815, .0815, .13, 24, 1, true, -.95, 1.9), Mt('#fff', { map: labelT, roughness: .7 })); label.position.y = .17;
  const bt = new THREE.Group(); bt.add(bottle, liquid, cap, label); bt.position.set(.16, .03, 0); g.add(bt);
  const shell = Mt('#efe3cf', { roughness: .55 }), eggGeo = new THREE.SphereGeometry(.05, 20, 14);
  [[-.24, .08, .05, 1.4], [-.11, .08, .07, -.4]].forEach(([x, y, z, r]) => { const e = new THREE.Mesh(eggGeo, shell); e.scale.set(1, 1.3, 1); e.position.set(x, y, z); e.rotation.set(0, r, Math.PI / 2); g.add(e); });
  const cup = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [.035, 0], [.035, .01], [.015, .02], [.015, .03], [.045, .06], [.048, .07], [0, .07]].map(q => new THREE.Vector2(q[0], q[1])), 18), Mt('#f4f1ec', { roughness: .3 }));
  cup.position.set(-.17, .03, -.06); g.add(cup);
  const e3 = new THREE.Mesh(eggGeo, shell); e3.scale.set(1, 1.3, 1); e3.position.set(-.17, .03 + .058 + .05, -.06); g.add(e3); // третье яйцо стоит в рюмке
  return g;
}

/* 2. модель машины */
function makeCar(p) {
  const g = new THREE.Group(), car = new THREE.Group(); g.add(car);
  const paint = Mt(p.color, { metalness: .65, roughness: .32 });
  const s = new THREE.Shape(), P = [[-.28, .045], [.28, .045], [.288, .1], [.25, .122], [.12, .132], [.06, .2], [-.12, .205], [-.2, .142], [-.278, .132], [-.29, .09]];
  s.moveTo(...P[0]); P.slice(1).forEach(q => s.lineTo(...q)); s.closePath();
  const bodyG = new THREE.ExtrudeGeometry(s, { depth: .2, bevelEnabled: true, bevelThickness: .012, bevelSize: .01, bevelSegments: 2 }); bodyG.translate(0, 0, -.1);
  car.add(new THREE.Mesh(bodyG, paint));
  const glass = Mt('#1b222c', { roughness: .08, metalness: .4 });
  [1, -1].forEach(sd => {
    const w = new THREE.Shape();[[.045, .14], [.005, .19], [-.115, .194], [-.172, .14]].forEach((q, i) => i ? w.lineTo(...q) : w.moveTo(...q));
    const m = new THREE.Mesh(new THREE.ShapeGeometry(w), glass); m.position.z = sd * .1125; if (sd < 0) m.rotation.y = Math.PI, m.scale.x = -1; car.add(m);
    const pil = new THREE.Mesh(new THREE.BoxGeometry(.012, .055, .002), paint); pil.position.set(-.045, .165, sd * .113); car.add(pil);
  });
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(.095, .205).rotateX(-Math.PI / 2), glass); ws.position.set(.091, .168, 0); ws.rotation.z = -.86; car.add(ws);
  const rw = new THREE.Mesh(new THREE.PlaneGeometry(.103, .205).rotateX(-Math.PI / 2), glass); rw.position.set(-.161, .175, 0); rw.rotation.z = .68; car.add(rw);
  const tyre = Mt('#141416', { roughness: .8 }), hub = Mt('#d7dade', { metalness: .85, roughness: .25 });
  [[.18, 1], [.18, -1], [-.18, 1], [-.18, -1]].forEach(([x, sd]) => {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(.047, .047, .045, 20), tyre); t.rotation.x = Math.PI / 2; t.position.set(x, .047, sd * .098); car.add(t);
    const h = new THREE.Mesh(new THREE.CylinderGeometry(.028, .028, .006, 14), hub); h.rotation.x = Math.PI / 2; h.position.set(x, .047, sd * .122); car.add(h);
  });
  [1, -1].forEach(sd => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(.012, .022, .05), Mt('#fff6dc', { emissive: '#ffe6a8', emissiveIntensity: .5 })); hl.position.set(.292, .105, sd * .068); car.add(hl);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(.012, .022, .05), Mt('#a3121c', { emissive: '#600', emissiveIntensity: .4 })); tl.position.set(-.296, .112, sd * .07); car.add(tl);
  });
  const grille = new THREE.Mesh(new THREE.BoxGeometry(.008, .02, .1), Mt('#222')); grille.position.set(.293, .075, 0); car.add(grille);
  const base = new THREE.Mesh(new THREE.BoxGeometry(.66, .025, .3), Mt('#18171a', { roughness: .35 })); base.position.y = .0125; g.add(base);
  car.position.y = .025; car.rotation.y = -.45;
  return g;
}

/* 3. пластинки (оригинальные обложки, названия просто текстом) */
const SLEEVES = [
  [x => { x.fillStyle = '#ece6da'; x.fillRect(0, 0, 512, 512);[['#d9452b', 60], ['#f0a23a', 150], ['#2f5d8a', 250], ['#1b1b1b', 350]].forEach(([c, y], i) => { x.fillStyle = c; x.fillRect(40 + i * 22, y + 60, 380 - i * 44, 46); }); }, '#1b1b1b'],
  [x => { x.fillStyle = '#2a1640'; x.fillRect(0, 0, 512, 512); for (let r = 230; r > 10; r -= 26) { x.strokeStyle = r % 52 ? '#c46cff' : '#ff9ad5'; x.lineWidth = 6; x.beginPath(); x.arc(256, 290, r, 0, Math.PI * 2); x.stroke(); } }, '#f3e6ff'],
  [x => { x.fillStyle = '#121112'; x.fillRect(0, 0, 512, 512); x.fillStyle = '#b3121f'; x.beginPath(); x.moveTo(0, 512); x.lineTo(512, 140); x.lineTo(512, 260); x.lineTo(110, 512); x.fill(); }, '#e9e2d8'],
  [x => { x.fillStyle = '#5f7389'; x.fillRect(0, 0, 512, 512); for (let y = 120; y < 512; y += 14)for (let xx = 0; xx < 512; xx += 14) { const r = 4 * Math.abs(Math.sin(xx * .012 + y * .008)); x.fillStyle = '#d9e2ea'; x.beginPath(); x.arc(xx, y, r, 0, Math.PI * 2); x.fill(); } }, '#f4f1ea'],
  [x => { x.fillStyle = '#f2f0ea'; x.fillRect(0, 0, 512, 512); x.strokeStyle = '#1d1d1d'; x.lineWidth = 2; for (let i = 0; i < 40; i++) { x.beginPath(); x.moveTo(256, 500); x.lineTo(i * 13, 130); x.stroke(); } }, '#1d1d1d'],
  [x => { x.fillStyle = '#e2b24a'; x.fillRect(0, 0, 512, 512); x.fillStyle = '#1e3a2f'; for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(256, 330, 200 - i * 32, Math.PI, 0); x.fill(); x.fillStyle = i % 2 ? '#1e3a2f' : '#e2b24a'; } }, '#1e1a14'],
  [x => { x.fillStyle = '#0f2c3a'; x.fillRect(0, 0, 512, 512); x.fillStyle = '#f4d35e'; x.beginPath(); x.arc(256, 300, 110, 0, Math.PI * 2); x.fill(); x.fillStyle = '#ee6c4d'; x.fillRect(0, 330, 512, 182); }, '#f4f1ea']
];
function splitList(s, max) { return String(s || '').split(',').map(t => t.trim()).filter(Boolean).slice(0, max); }
function makeRecords(p) {
  const g = new THREE.Group(); const names = splitList(p.names, 7); if (!names.length) names.push('...');
  const n = names.length, mid = (n - 1) / 2, off = p.design | 0;
  names.forEach((name, i) => {
    const [art, ink] = SLEEVES[(i + off) % SLEEVES.length];
    const t = canvasTex(512, 512, (x, w, h) => { art(x); x.fillStyle = ink; fitFont(x, name, 440, 50, '600 {}px "Cormorant Garamond", Georgia, serif'); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(name, w / 2, 62); grain(x, w, h, 8); });
    const edge = Mt('#d9d2c4');
    const sl = new THREE.Mesh(new THREE.BoxGeometry(.34, .34, .008).translate(0, .17, 0), [edge, edge, edge, edge, Mt('#fff', { map: t, roughness: .75 }), edge]);
    const piv = new THREE.Group(); piv.add(sl); piv.position.set((i - mid) * .085, 0, -.1 + (i - mid + 2) * .03); piv.rotation.set(-.22, 0, (i - mid) * -.24); g.add(piv);
    if (i === n - 1) {
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(.155, .155, .004, 40), Mt('#0d0d0f', { roughness: .25, metalness: .2 })); disc.rotation.x = Math.PI / 2; disc.position.set(.11, .2, -.008); sl.add(disc);
      const lbl = new THREE.Mesh(new THREE.CircleGeometry(.05, 24), Mt(p.disc || '#c33a2c')); lbl.position.set(.11, .2, -.0055); lbl.rotation.y = Math.PI; sl.add(lbl);
    }
  });
  return g;
}

/* 4. игровая приставка (без брендов) + геймпад */
function makeConsole(p) {
  const g = new THREE.Group();
  const shellC = p.color === 'black' ? '#1d1d22' : '#f2f2f0', coreC = p.color === 'black' ? '#f2f2f0' : '#141418';
  const white = Mt(shellC, { roughness: .35 }), black = Mt(coreC, { roughness: .3, metalness: .2 }), dark = Mt('#141418', { roughness: .3, metalness: .2 });
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(.07, .08, .02, 20), dark); stand.position.set(.1, .01, -.05); g.add(stand);
  const body = new THREE.Group(); body.position.set(.1, .02, -.05); body.rotation.y = -.5; g.add(body);
  const core = new THREE.Mesh(new THREE.BoxGeometry(.05, .4, .28), black); core.position.y = .2; body.add(core);
  [1, -1].forEach(sd => { const sh = new THREE.Mesh(new THREE.BoxGeometry(.022, .43, .3), white); sh.position.set(sd * .036, .212, 0); body.add(sh); });
  const led = new THREE.Mesh(new THREE.BoxGeometry(.004, .36, .004), new THREE.MeshBasicMaterial({ color: p.led || '#6fa8ff' })); led.position.set(.026, .21, .14); body.add(led);
  const pad = new THREE.Group(); pad.position.set(-.13, .035, .08); pad.rotation.set(-1.25, 0, .35); g.add(pad);
  const pb = new THREE.Mesh(new THREE.BoxGeometry(.16, .07, .035), white); pad.add(pb);
  [1, -1].forEach(sd => {
    const gr = new THREE.Mesh(new THREE.SphereGeometry(.034, 14, 10), white); gr.scale.set(1, 1.5, .9); gr.position.set(sd * .07, -.04, 0); pad.add(gr);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(.013, .013, .012, 12), dark); st.rotation.x = Math.PI / 2; st.position.set(sd * .03, -.015, .02); pad.add(st);
  });
  const tp = new THREE.Mesh(new THREE.BoxGeometry(.07, .03, .004), dark); tp.position.set(0, .015, .018); pad.add(tp);
  return g;
}

/* 5. жеода с кристаллами */
function makeGeode(p) {
  const g = new THREE.Group(), col = p.color;
  const rg = new THREE.IcosahedronGeometry(.14, 2), q = rg.attributes.position; for (let i = 0; i < q.count; i++) { const k = 1 + rand(-.07, .07); q.setXYZ(i, q.getX(i) * k, q.getY(i) * k * .85, Math.min(q.getZ(i) * k * .6, .05)); } rg.computeVertexNormals();
  const rock = new THREE.Mesh(rg, Mt('#7d7268', { flatShading: true, roughness: .95 })); rock.position.y = .13; g.add(rock);
  const face = new THREE.Mesh(new THREE.CircleGeometry(.12, 32), Mt('#fff', {
    roughness: .35, map: canvasTex(256, 256, (x, w, h) => {
      const gr = x.createRadialGradient(128, 128, 10, 128, 128, 128);
      [[0, '#' + shade(col, -.6).getHexString()], [.55, '#' + shade(col, -.2).getHexString()], [.72, '#' + shade(col, .5).getHexString()], [.8, '#efe7f4'], [.86, '#9a8d84'], [.92, '#d9d2cb'], [1, '#7d7268']].forEach(([o, c]) => gr.addColorStop(o, c)); x.fillStyle = gr; x.fillRect(0, 0, w, h); grain(x, w, h, 18);
    })
  }));
  face.scale.y = .85; face.position.set(0, .13, .052); g.add(face);
  const crys = Mt(col, { roughness: .15, metalness: .1, emissive: shade(col, -.6), emissiveIntensity: .35, flatShading: true });
  for (let i = 0; i < 34; i++) {
    const a = rand(0, Math.PI * 2), r = Math.sqrt(Math.random()) * .075; const c = new THREE.Mesh(new THREE.ConeGeometry(rand(.008, .014), rand(.02, .04), 5), crys);
    c.position.set(Math.cos(a) * r, .13 + Math.sin(a) * r * .85, .06); c.rotation.set(Math.PI / 2 + rand(-.4, .4) - Math.sin(a) * .3, 0, rand(-.4, .4) + Math.cos(a) * .3); g.add(c);
  }
  const st = new THREE.Mesh(new THREE.CylinderGeometry(.07, .085, .03, 20), Mt('#2a1e16', { roughness: .6 })); st.position.y = .015; g.add(st);
  return g;
}

/* 6. теннисные ракетки + мяч */
function makeRacket(col, grip) {
  const r = new THREE.Group(), frameM = Mt(col, { roughness: .35, metalness: .2 });
  const head = new THREE.Mesh(new THREE.TorusGeometry(.12, .011, 8, 40), frameM); head.scale.set(1, 1.3, 1.6); head.position.y = .5; r.add(head);
  const strT = canvasTex(256, 256, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = 'rgba(240,240,230,.85)'; x.lineWidth = 2; for (let i = 8; i < w; i += 14) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); } });
  const str = new THREE.Mesh(new THREE.CircleGeometry(.12, 40), new THREE.MeshStandardMaterial({ map: strT, transparent: true, side: THREE.DoubleSide, depthWrite: false })); str.scale.set(1, 1.3, 1); str.position.y = .5; r.add(str);
  [1, -1].forEach(sd => { const th = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .14, 6), frameM); th.position.set(sd * .03, .3, 0); th.rotation.z = sd * .4; r.add(th); });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.014, .016, .06, 8), frameM); shaft.position.y = .22; r.add(shaft);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(.018, .02, .19, 8), Mt(grip, { roughness: .9 })); handle.position.y = .095; r.add(handle);
  return r;
}
function makeRackets(p) {
  const g = new THREE.Group();
  const a = makeRacket(p.color1, '#1c1c1c'); a.position.set(-.13, 0, -.02); a.rotation.set(-.26, .15, -.06); g.add(a);
  const b = makeRacket(p.color2, '#efeae0'); b.position.set(.13, 0, .02); b.rotation.set(-.24, -.15, .07); g.add(b);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.034, 20, 16), Mt('#fff', {
    roughness: .95, map: canvasTex(256, 128, (x, w, h) => {
      x.fillStyle = '#d6e04a'; x.fillRect(0, 0, w, h); grain(x, w, h, 30);
      x.strokeStyle = '#f5f5ea'; x.lineWidth = 7; x.beginPath(); for (let px = 0; px <= w; px += 4)x.lineTo(px, h / 2 + Math.sin(px / w * Math.PI * 4) * 30); x.stroke();
    })
  }));
  ball.position.set(.2, .034, .1); g.add(ball);
  return g;
}

/* 7. пачка сигарет (наш чёрный дизайн с розами) */
function makePack(p) {
  const g = new THREE.Group();
  const front = canvasTex(400, 600, (x, w, h) => {
    x.fillStyle = p.bg || '#0e0b0c'; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#2d5229'; x.lineWidth = 5; x.beginPath(); x.moveTo(40, h); x.bezierCurveTo(120, h - 200, 0, h - 380, 90, h - 560); x.stroke(); x.beginPath(); x.moveTo(w - 30, h); x.bezierCurveTo(w - 140, h - 180, w, h - 400, w - 80, h - 580); x.stroke();
    miniRose(x, 90, h - 70, 46); miniRose(x, w - 80, h - 110, 38); miniRose(x, w / 2, 90, 48); miniRose(x, 70, 250, 24);
    x.strokeStyle = '#c9a35e'; x.lineWidth = 3; x.strokeRect(12, 12, w - 24, h - 24); x.fillStyle = '#c9a35e'; x.fillRect(12, 168, w - 24, 2);
    x.fillStyle = 'rgba(5,3,4,.92)'; x.beginPath(); x.ellipse(w / 2, h * .55, 150, 80, 0, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#c9a35e'; x.lineWidth = 2; x.stroke();
    x.fillStyle = '#ecd29c'; x.textAlign = 'center'; x.textBaseline = 'middle';
    [p.line1, p.line2].forEach((l, i) => { fitFont(x, l, 270, 30, 'italic 600 {}px "Cormorant Garamond", Georgia, serif'); x.fillText(l, w / 2, h * .55 - 22 + i * 32); });
    fitFont(x, p.line3, 260, 20, 'italic 600 {}px "Cormorant Garamond", Georgia, serif'); x.fillStyle = '#c9a35e'; x.fillText(p.line3, w / 2, h * .55 + 52);
  });
  const side = Mt(p.bg || '#0e0b0c', { roughness: .5 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(.2, .3, .08), [side, side, side, side, Mt('#fff', { map: front, roughness: .45 }), side]); box.position.y = .15; g.add(box);
  const cig = new THREE.Group(); cig.position.set(.17, .009, .1); cig.rotation.y = -.6; g.add(cig);
  const paper = new THREE.Mesh(new THREE.CylinderGeometry(.009, .009, .11, 10), Mt('#f5f1ea')); paper.rotation.z = Math.PI / 2; cig.add(paper);
  const filt = new THREE.Mesh(new THREE.CylinderGeometry(.0092, .0092, .035, 10), Mt('#d39a55')); filt.rotation.z = Math.PI / 2; filt.position.x = -.072; cig.add(filt);
  g.rotation.y = -.2;
  return g;
}

/* 8. керамическая кошка */
const CAT_COLORS = { tuxedo: ['#16161a', '#f3f0ea'], ginger: ['#c9692c', '#f6e3c8'], gray: ['#6f7480', '#e9e6e0'], white: ['#f1eee8', '#ffffff'], black: ['#141418', '#26262c'] };
function makeCat(p) {
  const [c1, c2] = CAT_COLORS[p.coat] || CAT_COLORS.tuxedo;
  const g = new THREE.Group(), blk = Mt(c1, { roughness: .25, metalness: .05 }), wht = Mt(c2, { roughness: .25 });
  const add = (geo, mat, q, s, parent = g) => { const m = new THREE.Mesh(geo, mat); m.position.set(...q); if (s) m.scale.set(...s); parent.add(m); return m; };
  add(new THREE.CylinderGeometry(.1, .11, .02, 24), Mt('#2a1e16', { roughness: .5 }), [0, .01, 0]);
  add(new THREE.SphereGeometry(.09, 20, 14), blk, [0, .1, -.01], [1, 1.2, .9]);
  add(new THREE.SphereGeometry(.07, 16, 12), blk, [0, .06, -.045], [1.35, .75, 1.1]);
  add(new THREE.SphereGeometry(.05, 16, 12), wht, [0, .1, .048], [1, 1.4, .6]);
  add(new THREE.SphereGeometry(.022, 10, 8), wht, [-.032, .026, .06], [1, .8, 1.3]);
  add(new THREE.SphereGeometry(.022, 10, 8), wht, [.032, .026, .06], [1, .8, 1.3]);
  const head = new THREE.Group(); head.position.set(0, .215, .012); g.add(head);
  add(new THREE.SphereGeometry(.062, 20, 16), blk, [0, 0, 0], [1.08, .95, .95], head);
  add(new THREE.SphereGeometry(.032, 12, 10), wht, [0, -.022, .045], [1.25, .85, .7], head);
  add(new THREE.SphereGeometry(.014, 8, 6), wht, [0, .025, .054], [1, 1.8, .5], head);
  [-1, 1].forEach(sd => {
    const e = add(new THREE.ConeGeometry(.026, .05, 4), blk, [sd * .036, .058, 0], null, head); e.rotation.z = -sd * .3;
    add(new THREE.SphereGeometry(.0105, 10, 8), Mt(p.eyes || '#c8d84a', { emissive: '#3a4010', emissiveIntensity: .5, roughness: .1 }), [sd * .024, .01, .053], null, head);
  });
  add(new THREE.SphereGeometry(.007, 8, 6), Mt('#e79aa8'), [0, -.006, .065], null, head);
  const tc = new THREE.CatmullRomCurve3([new THREE.Vector3(.05, .03, -.08), new THREE.Vector3(.11, .025, -.01), new THREE.Vector3(.1, .025, .06), new THREE.Vector3(.04, .03, .09)]);
  add(new THREE.TubeGeometry(tc, 20, .013, 8), blk, [0, 0, 0]);
  const ph = rand(0, 6);
  g.userData.tick = t => { head.rotation.z = Math.sin(t * .5 + ph) * .05; }; // кошка покачивает головой
  return g;
}

/* 9. стопка книг */
const BOOK_COLORS = ['#7a2630', '#24476b', '#2f5a3a', '#c79a4a', '#4b2f5e', '#8a4b2a', '#33363d'];
function makeBooks(p) {
  const g = new THREE.Group(); const titles = splitList(p.titles, 5); if (!titles.length) titles.push(' ');
  let y = 0;
  titles.forEach((title, i) => {
    const w = .3 + ((hashStr(title + i) * 6) | 0) * .015, th = .045 + ((hashStr(i + title) * 4) | 0) * .008, d = .22;
    const col = BOOK_COLORS[(i + (p.palette | 0)) % BOOK_COLORS.length];
    const spine = canvasTex(512, 80, (x, W, H) => {
      x.fillStyle = col; x.fillRect(0, 0, W, H); grain(x, W, H, 14);
      x.fillStyle = '#d8b46a'; x.fillRect(18, 8, 4, H - 16); x.fillRect(W - 22, 8, 4, H - 16);
      fitFont(x, title, W - 80, 48, '600 {}px "Cormorant Garamond", Georgia, serif'); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#f1e2bf'; x.fillText(title, W / 2, H / 2 + 2);
    });
    const cover = Mt(col, { roughness: .7 }), pages = Mt('#efe6d2', { roughness: .9 });
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, th, d), [pages, pages, cover, cover, Mt('#fff', { map: spine, roughness: .7 }), pages]);
    b.position.set(rand(-.02, .02), y + th / 2, 0); b.rotation.y = rand(-.12, .12); g.add(b); y += th;
  });
  if (p.mug !== 'no') {
    const mug = new THREE.Group(); mug.position.set(.03, y, .01); g.add(mug);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(.045, .04, .1, 24, 1, true), Mt(p.mugColor || '#e9e2d6', { roughness: .3, side: THREE.DoubleSide })); cup.position.y = .05; mug.add(cup);
    const bot = new THREE.Mesh(new THREE.CircleGeometry(.04, 20), Mt(p.mugColor || '#e9e2d6')); bot.rotation.x = -Math.PI / 2; bot.position.y = .002; mug.add(bot);
    const tea = new THREE.Mesh(new THREE.CircleGeometry(.042, 20), Mt('#4a2a14', { roughness: .2 })); tea.rotation.x = -Math.PI / 2; tea.position.y = .085; mug.add(tea);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(.026, .007, 8, 16, Math.PI), Mt(p.mugColor || '#e9e2d6', { roughness: .3 })); handle.rotation.z = -Math.PI / 2; handle.position.set(.045, .05, 0); mug.add(handle);
    mug.rotation.y = -.7;
  }
  return g;
}

/* 10. растение в горшке */
function makePlant(p) {
  const g = new THREE.Group();
  const prof = [[0, 0], [.07, 0], [.075, .01], [.092, .13], [.1, .135], [.1, .155], [.088, .155], [0, .15]].map(q => new THREE.Vector2(q[0], q[1]));
  g.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 28), Mt(p.pot, { roughness: .85 })));
  const soil = new THREE.Mesh(new THREE.CircleGeometry(.086, 24), Mt('#2b1d14', { roughness: 1 })); soil.rotation.x = -Math.PI / 2; soil.position.y = .145; g.add(soil);
  const leafM = Mt(p.leaf, { roughness: .55, side: THREE.DoubleSide });
  const kind = p.kind || 'leafy';
  if (kind === 'cactus') {
    const body = new THREE.Mesh(new THREE.SphereGeometry(.05, 16, 12), leafM); body.scale.set(1, 2.6, 1); body.position.y = .27; g.add(body);
    [[.06, .27, .6], [-.055, .23, -.6]].forEach(([x, y, r]) => { const arm = new THREE.Mesh(new THREE.SphereGeometry(.025, 12, 10), leafM); arm.scale.set(1, 2.2, 1); arm.position.set(x, y + .03, 0); arm.rotation.z = -r * .4; g.add(arm); });
    const fl = new THREE.Mesh(new THREE.SphereGeometry(.016, 10, 8), Mt('#e8598a', { emissive: '#601030', emissiveIntensity: .3 })); fl.position.y = .4; g.add(fl);
  } else {
    const leafGeo = new THREE.SphereGeometry(.05, 12, 8); leafGeo.scale(.45, 1, .12); leafGeo.translate(0, .05, 0);
    const n = kind === 'tall' ? 9 : 14;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + rand(-.2, .2), len = kind === 'tall' ? rand(1.8, 3) : rand(1.1, 1.7);
      const l = new THREE.Mesh(leafGeo, leafM); l.scale.set(1, len, 1); l.position.set(Math.cos(a) * .02, .145, Math.sin(a) * .02);
      l.rotation.order = 'YXZ'; l.rotation.y = -a + Math.PI / 2; l.rotation.x = kind === 'tall' ? rand(.1, .35) : rand(.5, 1.1); g.add(l);
    }
  }
  return g;
}

/* 11. свеча в банке */
function makeCandle(p) {
  const g = new THREE.Group();
  const wax = new THREE.Mesh(new THREE.CylinderGeometry(.055, .055, .1, 24), Mt(p.wax, { roughness: .8 })); wax.position.y = .05; g.add(wax);
  const jar = new THREE.Mesh(new THREE.CylinderGeometry(.064, .062, .15, 28, 1, true), Mt('#e6eef5', { transparent: true, opacity: .3, roughness: .05, depthWrite: false, side: THREE.DoubleSide })); jar.position.y = .075; g.add(jar);
  const lbl = canvasTex(512, 128, (x, W, H) => { x.fillStyle = '#f3ede0'; x.fillRect(0, 0, W, H); x.fillStyle = '#5a4636'; fitFont(x, p.label || ' ', W - 60, 64, 'italic 600 {}px "Cormorant Garamond", Georgia, serif'); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(p.label || '', W / 2, H / 2); });
  if (p.label) { const l = new THREE.Mesh(new THREE.CylinderGeometry(.0645, .0645, .045, 24, 1, true, -.9, 1.8), Mt('#fff', { map: lbl, roughness: .7 })); l.position.y = .07; g.add(l); }
  const wick = new THREE.Mesh(new THREE.CylinderGeometry(.002, .002, .02, 6), Mt('#1a1a1a')); wick.position.y = .11; g.add(wick);
  const flameGeo = new THREE.SphereGeometry(.012, 12, 10); flameGeo.scale(1, 2.2, 1);
  const flame = new THREE.Mesh(flameGeo, new THREE.MeshBasicMaterial({ color: '#ffcf7a' })); flame.position.y = .133; g.add(flame);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radial([[0, 'rgba(255,200,120,.95)'], [.35, 'rgba(255,170,80,.35)'], [1, 'rgba(255,150,60,0)']]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.position.y = .135; glow.scale.setScalar(.16); g.add(glow);
  const ph = rand(0, 6);
  g.userData.tick = t => { const k = .85 + .15 * Math.sin(t * 9 + ph) * Math.sin(t * 3.7 + ph); flame.scale.set(1, k, 1); glow.material.opacity = .6 + .4 * k; };
  return g;
}

/* ---------- каталог: форма «Добавить объект» строится по полям ---------- */
const OBJECT_TYPES = {
  cat: { name: 'Кошка-статуэтка', w: .24, make: makeCat, fields: [
    { key: 'coat', label: 'Окрас', type: 'select', def: 'tuxedo', options: [['tuxedo', 'чёрно-белая'], ['ginger', 'рыжая'], ['gray', 'серая'], ['white', 'белая'], ['black', 'чёрная']] },
    { key: 'eyes', label: 'Глаза', type: 'color', def: '#c8d84a' }] },
  records: { name: 'Пластинки', w: .5, make: makeRecords, fields: [
    { key: 'names', label: 'Названия через запятую (до 7)', type: 'text', def: 'Radiohead, Muse, Scorpions, Portishead, My Own Private Alaska' },
    { key: 'design', label: 'Обложки', type: 'select', def: '0', options: [['0', 'набор 1'], ['2', 'набор 2'], ['4', 'набор 3']] },
    { key: 'disc', label: 'Цвет яблочка пластинки', type: 'color', def: '#c33a2c' }] },
  console: { name: 'Игровая приставка', w: .42, make: makeConsole, fields: [
    { key: 'color', label: 'Корпус', type: 'select', def: 'white', options: [['white', 'белый'], ['black', 'чёрный']] },
    { key: 'led', label: 'Подсветка', type: 'color', def: '#6fa8ff' }] },
  pack: { name: 'Пачка с надписью', w: .3, make: makePack, fields: [
    { key: 'line1', label: 'Строка 1', type: 'text', def: 'хочу моей вредине' },
    { key: 'line2', label: 'Строка 2', type: 'text', def: 'пожелать пару вещей' },
    { key: 'line3', label: 'Подпись', type: 'text', def: '— покурим же за вас —' }] },
  vodka: { name: 'Бутылка и яйца', w: .66, make: makeVodka, fields: [
    { key: 'label', label: 'Этикетка', type: 'text', def: 'ВОДКА' },
    { key: 'sub', label: 'Под надписью', type: 'text', def: '40%' },
    { key: 'accent', label: 'Цвет этикетки', type: 'color', def: '#b0242c' }] },
  geode: { name: 'Жеода с кристаллами', w: .3, make: makeGeode, fields: [
    { key: 'color', label: 'Цвет кристаллов', type: 'color', def: '#9b5fd6' }] },
  car: { name: 'Модель машины', w: .66, make: makeCar, fields: [
    { key: 'color', label: 'Цвет кузова', type: 'color', def: '#a7afb8' }] },
  rackets: { name: 'Теннисные ракетки', w: .45, make: makeRackets, fields: [
    { key: 'color1', label: 'Ракетка 1', type: 'color', def: '#b3242e' },
    { key: 'color2', label: 'Ракетка 2', type: 'color', def: '#2c4f86' }] },
  books: { name: 'Стопка книг', w: .36, make: makeBooks, fields: [
    { key: 'titles', label: 'Названия на корешках через запятую (до 5)', type: 'text', def: 'Мастер и Маргарита, Три товарища, Маленький принц' },
    { key: 'palette', label: 'Цвета', type: 'select', def: '0', options: [['0', 'бордо и синий'], ['2', 'зелёный и охра'], ['4', 'фиолетовый и медь']] },
    { key: 'mug', label: 'Кружка сверху', type: 'select', def: 'yes', options: [['yes', 'да'], ['no', 'нет']] },
    { key: 'mugColor', label: 'Цвет кружки', type: 'color', def: '#e9e2d6' }] },
  plant: { name: 'Растение в горшке', w: .22, make: makePlant, fields: [
    { key: 'kind', label: 'Вид', type: 'select', def: 'leafy', options: [['leafy', 'пышное'], ['tall', 'высокое'], ['cactus', 'кактус']] },
    { key: 'pot', label: 'Горшок', type: 'color', def: '#b8643f' },
    { key: 'leaf', label: 'Листья', type: 'color', def: '#3f7a3c' }] },
  candle: { name: 'Свеча в банке', w: .16, make: makeCandle, fields: [
    { key: 'wax', label: 'Воск', type: 'color', def: '#f1e6d2' },
    { key: 'label', label: 'Надпись на банке', type: 'text', def: 'уют' }] }
};
function objectParams(type, params) {
  const t = OBJECT_TYPES[type], out = {};
  t.fields.forEach(f => { out[f.key] = params && params[f.key] != null && params[f.key] !== '' ? params[f.key] : f.def; });
  return out;
}
function makeObject(o) {
  const t = OBJECT_TYPES[o.type]; if (!t) return null;
  const g = t.make(objectParams(o.type, o.params));
  g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  g.userData.w = t.w; g.userData.id = o.id;
  return g;
}
