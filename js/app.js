/* =====================================================================
   OUR SHELF — 3D-сцена, раскладка, взаимодействие и формы добавления
   ===================================================================== */
const CONTENT = window.SHELF_CONTENT || { frames: [], objects: [], placeholders: [], minFrames: 0 };
let local = Store.empty();          // то, что добавлено в этом браузере
let FRAMES = [];                    // данные рамок в порядке показа (для записки)
let OBJECTS = [];                   // данные предметов

/* ---------- renderer ---------- */
const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, matchMedia('(pointer: coarse)').matches ? 1.75 : 2));
renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .92;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color('#121925');
const camera = new THREE.PerspectiveCamera(40, 1, .05, 100);

scene.add(new THREE.HemisphereLight('#c79a74', '#1e140c', .26));
const key = new THREE.SpotLight('#ffb062', 2.1, 0, .8, .85, 1); key.position.set(0, 8, 6); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -.0004; key.shadow.radius = 4; scene.add(key); scene.add(key.target);
const fill = new THREE.DirectionalLight('#ffcf9a', .08); fill.position.set(4, 3, 6); scene.add(fill);
const lampLight = new THREE.PointLight('#ff9a48', .55, 14, 2); scene.add(lampLight);

/* ---------- wall ---------- */
const WALL_Z = -.36;
const wall = new THREE.Mesh(new THREE.PlaneGeometry(60, 80), new THREE.MeshStandardMaterial({ map: plasterCanvas(), roughness: .95 }));
wall.material.map.repeat.set(6, 8);
wall.position.set(0, 3, WALL_Z); wall.receiveShadow = true; scene.add(wall);

/* ---------- frames ---------- */
const STYLE = {
  wood: { b: .13, depth: .06, bevel: .025, mat: () => new THREE.MeshStandardMaterial({ map: woodCanvas(true), roughness: .7 }) },
  gold: { b: .16, depth: .07, bevel: .035, mat: () => new THREE.MeshStandardMaterial({ color: '#c9a04e', metalness: .75, roughness: .38 }), lip: '#8a6a2c' },
  black: { b: .09, depth: .05, bevel: .015, mat: () => new THREE.MeshStandardMaterial({ color: '#17161a', roughness: .45, metalness: .1 }) },
  white: { b: .1, depth: .05, bevel: .02, mat: () => new THREE.MeshStandardMaterial({ color: '#efe9df', roughness: .6 }) }
};
function ringGeo(ow, oh, b, depth, bevel) {
  const s = new THREE.Shape(); s.moveTo(-ow / 2, -oh / 2); s.lineTo(ow / 2, -oh / 2); s.lineTo(ow / 2, oh / 2); s.lineTo(-ow / 2, oh / 2); s.closePath();
  const iw = ow - 2 * b, ih = oh - 2 * b, h = new THREE.Path(); h.moveTo(-iw / 2, -ih / 2); h.lineTo(-iw / 2, ih / 2); h.lineTo(iw / 2, ih / 2); h.lineTo(iw / 2, -ih / 2); h.closePath(); s.holes.push(h);
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 1 });
}
let frames = []; const glassMap = glassTex();
function buildFrame(cfg, i, img) {
  const aspect = img ? img.width / img.height : (cfg.aspect || 1);
  const MAX = 1.22, pw = aspect >= 1 ? MAX : MAX * aspect, ph = aspect >= 1 ? MAX / aspect : MAX;
  const st = STYLE[cfg.frame] || STYLE.wood, m = .11;
  const ow = pw + 2 * m + 2 * st.b, oh = ph + 2 * m + 2 * st.b;
  const root = new THREE.Group(), inner = new THREE.Group(); root.add(inner);
  const body = new THREE.Group(); body.position.y = oh / 2 + .02; inner.add(body);
  const ring = new THREE.Mesh(ringGeo(ow, oh, st.b, st.depth, st.bevel), st.mat()); body.add(ring);
  if (ring.material.map) { ring.material.map.repeat.set(1.2, 1.2); }
  if (st.lip) { const lip = new THREE.Mesh(ringGeo(ow - 2 * st.b + .05, oh - 2 * st.b + .05, .035, .03, .01), new THREE.MeshStandardMaterial({ color: st.lip, metalness: .7, roughness: .4 })); lip.position.z = st.depth; body.add(lip); }
  const back = new THREE.Mesh(new THREE.BoxGeometry(ow - .04, oh - .04, .02), new THREE.MeshStandardMaterial({ color: '#3a2c22', roughness: .9 })); back.position.z = -.01; body.add(back);
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(pw + 2 * m, ph + 2 * m), new THREE.MeshStandardMaterial({ map: matCanvas(pw, ph, m), roughness: .95 })); mat.position.z = .012; body.add(mat);
  const photoTex = img ? (() => { const t = new THREE.Texture(img); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; t.needsUpdate = true; return t; })() : tex(placeholderCanvas(aspect, i));
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshStandardMaterial({ map: photoTex, roughness: .6 })); photo.position.z = .016; body.add(photo);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(ow - 2 * st.b, oh - 2 * st.b), new THREE.MeshBasicMaterial({ map: glassMap, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .5 }));
  glass.position.z = st.depth * .6; body.add(glass);
  root.traverse(o => { if (o.isMesh) { o.castShadow = o !== glass && o !== photo && o !== mat; o.receiveShadow = true; o.userData.frame = i; } });
  // наклон и поворот стабильны для каждой рамки (не прыгают при перестройке)
  const seed = cfg.id || ('ph' + i);
  root.userData = { i, ow, oh, body, inner, hover: 0, lean: -.09 - hashStr(seed) * .04, twist: (hashStr(seed + 'tw') - .5) * .16 };
  root.rotation.set(root.userData.lean, root.userData.twist, 0);
  scene.add(root); frames[i] = root;
}
function disposeTree(o) {
  o.traverse(m => {
    if (m.geometry) m.geometry.dispose();
    const mats = m.material ? (Array.isArray(m.material) ? m.material : [m.material]) : [];
    mats.forEach(mt => { if (mt.map && mt.map !== glassMap && mt.map !== shelfWood.light && mt.map !== decor.shelfMap) mt.map.dispose(); mt.dispose(); });
  });
}

/* ---------- данные: что сейчас висит и стоит ---------- */
let cloudFrames = [];               // рамки из общей базы (если она подключена)
const safeSrc = s => typeof s === 'string' && s.startsWith('data:image/');
function visibleFrames() {
  const hidden = new Set(local.hidden), seen = new Set(), out = [];
  if (Cloud.ok) {
    // общая полка: рамки из content.js (с правками хозяина) + рамки посетителей
    const byId = new Map(cloudFrames.map(d => [d.id, d]));
    CONTENT.frames.forEach(f => { const o = byId.get(f.id); seen.add(f.id); if (o && o.hidden) return; out.push(o ? Object.assign({}, f, o, { builtin: true, src: safeSrc(o.src) ? o.src : f.src }) : Object.assign({ builtin: true }, f)); });
    cloudFrames.forEach(d => { if (seen.has(d.id) || d.hidden || d.override || !safeSrc(d.src)) return; seen.add(d.id); out.push(d); });
  } else {
    const edits = local.edits || {};
    CONTENT.frames.concat(local.frames).forEach(f => { if (!hidden.has(f.id) && !seen.has(f.id)) { seen.add(f.id); out.push(edits[f.id] ? Object.assign({}, f, edits[f.id]) : f); } });
  }
  const ph = CONTENT.placeholders || [];
  for (let k = 0; out.length < (CONTENT.minFrames || 0) && ph.length; k++) out.push(Object.assign({ placeholder: true, id: 'ph' + k, src: '' }, ph[k % ph.length]));
  return out;
}
function visibleObjects() {
  const hidden = new Set(local.hidden), seen = new Set(), out = [];
  CONTENT.objects.concat(local.objects).forEach(o => { if (!hidden.has(o.id) && !seen.has(o.id) && OBJECT_TYPES[o.type]) { seen.add(o.id); out.push(o); } });
  return out;
}

const imgCache = new Map();
function loadImg(src) {
  if (!src) return Promise.resolve(null);
  if (imgCache.has(src)) return imgCache.get(src);
  const p = new Promise(r => { const im = new Image(); im.onload = () => r(im); im.onerror = () => r(null); im.src = src; });
  imgCache.set(src, p); return p;
}
async function rebuildFrames() {
  const list = visibleFrames();
  const imgs = await Promise.all(list.map(f => loadImg(f.src)));
  frames.forEach(f => { scene.remove(f); disposeTree(f); });
  frames = []; FRAMES = list;
  list.forEach((f, i) => buildFrame(f, i, imgs[i]));
}

/* ---------- decor ---------- */
const decor = { items: new Map() };
function rebuildObjects() {
  const list = visibleObjects(), ids = new Set(list.map(o => o.id));
  decor.items.forEach((g, id) => { if (!ids.has(id)) { scene.remove(g); disposeTree(g); decor.items.delete(id); } });
  list.forEach(o => {
    const sig = o.type + JSON.stringify(o.params || {});
    const cur = decor.items.get(o.id);
    if (cur && cur.userData.sig === sig) return;
    if (cur) { scene.remove(cur); disposeTree(cur); }
    const g = makeObject(o); if (!g) return; g.userData.sig = sig;
    scene.add(g); decor.items.set(o.id, g);
  });
  OBJECTS = list;
}

/* ---------- полки и гирлянда перестраиваются под раскладку ---------- */
let layoutGroup = null; const bulbs = [];
function shelfMesh(len) {
  const g = new THREE.Group();
  const board = new THREE.Mesh(new THREE.BoxGeometry(len, .1, .6), decor.shelfMat); board.position.set(0, -.05, WALL_Z + .3); board.castShadow = board.receiveShadow = true; g.add(board);
  const iron = new THREE.MeshStandardMaterial({ color: '#2a2a2e', metalness: .6, roughness: .4 });
  [-len / 2 + .5, len / 2 - .5].forEach(x => {
    const v = new THREE.Mesh(new THREE.BoxGeometry(.05, .4, .03), iron); v.position.set(x, -.3, WALL_Z + .02); g.add(v);
    const h = new THREE.Mesh(new THREE.BoxGeometry(.05, .03, .5), iron); h.position.set(x, -.115, WALL_Z + .25); g.add(h);
    const d = new THREE.Mesh(new THREE.BoxGeometry(.04, .5, .03), iron); d.position.set(x, -.3, WALL_Z + .2); d.rotation.x = .78; g.add(d);
    [v, h, d].forEach(m => { m.castShadow = true; });
  });
  return g;
}
const glowT = radial([[0, 'rgba(255,214,140,.9)'], [.3, 'rgba(255,190,110,.35)'], [1, 'rgba(255,180,100,0)']]);
function fairyLights(x0, x1, y, sag) {
  const g = new THREE.Group(), pts = [];
  for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push(new THREE.Vector3(x0 + (x1 - x0) * t, y - sag * 4 * t * (1 - t) + Math.sin(t * Math.PI * 6) * .04, WALL_Z + .04)); }
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, .008, 4), new THREE.MeshStandardMaterial({ color: '#2a2a20' })));
  bulbs.length = 0;
  for (let i = 1; i < 20; i++) {
    const p = pts[i * 2]; const b = new THREE.Mesh(new THREE.SphereGeometry(.03, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd690' })); b.position.copy(p).y -= .04; g.add(b);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.position.copy(b.position); s.scale.setScalar(.32); g.add(s);
    bulbs.push({ b, s, ph: rand(0, 6), sp: rand(.6, 1.6) });
  }
  return g;
}

/* ---------- раскладка ----------
   широкий экран: полки по 3 и 2 рамки (как в макете) + до 4 предметов;
   узкий экран: по 2 рамки, нечётная рамка — с 4 предметами по бокам.
   Новые рамки и предметы просто добавляют полки ниже. */
let home = { pos: new THREE.Vector3(), tgt: new THREE.Vector3() }, portrait = false;
const pan = { on: false, min: 0, max: 0, target: 0, cur: 0, cx: 0, d: 10, vh: 1 };
const shelfY = new Map(); // id предмета/рамки → высота полки
function distribute(f, o) {
  // раскидать предметы по промежуткам между рамками, лишние — в последние промежутки
  const G = f.length + 1, base = Math.floor(o.length / G), extra = o.length % G, seq = []; let oi = 0;
  for (let g = 0; g < G; g++) {
    const n = base + (g >= G - extra ? 1 : 0);
    for (let k = 0; k < n; k++) seq.push({ kind: 'o', ref: o[oi++] });
    if (g < f.length) seq.push({ kind: 'f', ref: f[g] });
  }
  return seq;
}
function assignShelves(fl, ol) {
  const shelves = []; let fi = 0, oi = 0;
  if (!portrait) {
    while (fi < fl.length || oi < ol.length || shelves.length < 2) {
      const fc = shelves.length % 2 ? 2 : 3, f = fl.slice(fi, fi + fc); fi += f.length;
      const oc = f.length ? 4 : 7, o = ol.slice(oi, oi + oc); oi += o.length;
      shelves.push({ f, o });
    }
  } else {
    // две рамки на полку, если влезают по ширине; одиночная рамка делит полку с предметами
    const ow = i => frames[fl[i]].userData.ow;
    while (fi < fl.length) {
      if (fi + 1 < fl.length && ow(fi) + ow(fi + 1) + .1 <= 3.45) { shelves.push({ f: [fl[fi], fl[fi + 1]], o: [] }); fi += 2; continue; }
      const oc = 4, o = ol.slice(oi, oi + oc); oi += o.length; shelves.push({ f: [fl[fi++]], o });
    }
    while (oi < ol.length) { const o = ol.slice(oi, oi + 4); oi += o.length; shelves.push({ f: [], o }); }
    if (!shelves.length) shelves.push({ f: [], o: [] });
  }
  return shelves;
}
function place(obj, x, y, z = WALL_Z + .32) { obj.position.set(x, y, z); }
function layout() {
  portrait = innerWidth / innerHeight < .9;
  if (layoutGroup) { scene.remove(layoutGroup); disposeTree(layoutGroup); } layoutGroup = new THREE.Group(); scene.add(layoutGroup);
  const fz = WALL_Z + .3, sc = portrait ? 1.1 : 1.7, len = portrait ? 3.9 : 9.5, step = portrait ? 2.3 : 2.35;
  // порядок предметов: в узкой раскладке — по полю po (как в макете), остальные следом
  let ol = OBJECTS.map(o => o.id);
  if (portrait) { const withPo = OBJECTS.filter(o => o.po != null).sort((a, b) => a.po - b.po), rest = OBJECTS.filter(o => o.po == null); ol = withPo.concat(rest).map(o => o.id); }
  const fl = frames.map((f, i) => i);
  const shelves = assignShelves(fl, ol), n = shelves.length, top = (n - 1) * step;
  shelfY.clear();
  shelves.forEach((s, si) => {
    const y = top - si * step;
    const sm = shelfMesh(len); sm.position.y = y; layoutGroup.add(sm);
    const seq = distribute(s.f, s.o);
    const widths = seq.map(it => it.kind === 'f' ? frames[it.ref].userData.ow : (decor.items.get(it.ref).userData.w * sc + .06));
    const total = widths.reduce((a, b) => a + b, 0), L = len - .5;
    const gap = seq.length > 1 ? Math.min(portrait ? .3 : .6, (L - total) / (seq.length - 1)) : 0;
    let x = -(total + gap * (seq.length - 1)) / 2;
    seq.forEach((it, k) => {
      const cx = x + widths[k] / 2; x += widths[k] + gap;
      if (it.kind === 'f') { place(frames[it.ref], cx, y, fz); shelfY.set('f' + it.ref, y); }
      else { const g = decor.items.get(it.ref); place(g, cx, y); g.scale.setScalar(sc); shelfY.set(it.ref, y); }
    });
  });
  const yTop = top + (portrait ? 2.9 : 2.4), y0 = portrait ? -1.15 : -.45;
  layoutGroup.add(fairyLights(-len / 2 + .2, len / 2 - .2, top + 2.25, portrait ? .35 : .55));
  const bbox = { x0: -len / 2 - .05, x1: len / 2 + .05, y0, y1: yTop };
  const cx = (bbox.x0 + bbox.x1) / 2, cy = (bbox.y0 + bbox.y1) / 2, w = bbox.x1 - bbox.x0, h = bbox.y1 - bbox.y0;
  const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), a = camera.aspect;
  const dFit = Math.max(h / 2 / t, w / 2 / (t * a)) * 1.05 + .3;
  // если полок много — не уменьшаем всё до мелочи, а даём листать вверх-вниз
  const capH = portrait ? 11 : 7.6;
  const dCap = Math.max(w / 2 / (t * a), capH / 2 / t) * 1.05 + .3;
  const d = Math.min(dFit, dCap);
  pan.on = d < dFit - .01; pan.cx = cx; pan.d = d; pan.vh = 2 * (d - .3) * t;
  if (pan.on) {
    pan.max = bbox.y1 - pan.vh / 2 + .2; pan.min = bbox.y0 + pan.vh / 2 - .2;
    pan.target = Math.min(pan.max, Math.max(pan.min, pan.target || pan.max));
  } else { pan.min = pan.max = pan.target = cy; }
  pan.cur = pan.target;
  setHome(pan.target);
  key.target.position.set(cx, cy - .3, WALL_Z); key.position.set(cx, bbox.y1 + 3.5, 6 + Math.max(0, h - 10) * .4);
  key.angle = Math.min(1.3, Math.atan(Math.max(w * .62, h * .62) / Math.hypot(bbox.y1 + 3.5 - cy, key.position.z)));
  lampLight.position.set(cx, bbox.y1 + .4, 1.4);
  pill.textContent = pan.on ? 'выбырите что пасматреть · листайте ↕' : 'выбырите что пасматреть';
}
function setHome(y) { home.tgt.set(pan.cx, y, 0); home.pos.set(pan.cx, y + .35, pan.d); }
function panTo(y) { if (!pan.on) return; pan.target = Math.min(pan.max, Math.max(pan.min, y)); }

/* ---------- camera + interaction ---------- */
let view = 'home', current = -1, tween = null;
const camPos = new THREE.Vector3(), camTgt = new THREE.Vector3();
function zoomView(i) {
  const f = frames[i], u = f.userData;
  f.updateMatrixWorld();
  const center = new THREE.Vector3(); u.body.getWorldPosition(center);
  const q = new THREE.Quaternion(); u.body.getWorldQuaternion(q);
  const n = new THREE.Vector3(0, 0, 1).applyQuaternion(q), right = new THREE.Vector3(1, 0, 0).applyQuaternion(q), up = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
  const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), a = camera.aspect;
  let d, off;
  if (!portrait) {
    d = Math.max(u.oh / .74 / (2 * t), u.ow / .46 / (2 * t * a));
    off = right.clone().multiplyScalar(2 * d * t * a * .2);   // рамка слева, записка справа
  } else {
    d = Math.max(u.oh / .46 / (2 * t), u.ow / .86 / (2 * t * a));
    off = up.clone().multiplyScalar(-2 * d * t * .2);       // рамка сверху, записка снизу
  }
  return { pos: center.clone().add(n.multiplyScalar(d)).add(off), tgt: center.clone().add(off) };
}
function go(pos, tgt, dur = 1.05) { tween = { p0: camPos.clone(), t0: camTgt.clone(), p1: pos, t1: tgt, t: 0, dur: reduceMotion ? .01 : dur }; }
const panel = $('panel'), pill = $('pill'), topbar = $('topbar');
function openFrame(i) {
  if (!frames.length) return;
  i = (i + frames.length) % frames.length; current = i; view = 'zoom';
  const v = zoomView(i); go(v.pos, v.tgt);
  pill.classList.add('hidden'); topbar.classList.add('hidden'); closeMenu();
  panel.classList.remove('on');
  setTimeout(() => {
    if (current !== i || view !== 'zoom') return;
    const f = FRAMES[i];
    $('pTitle').textContent = f.title || ''; $('pCount').textContent = `${i + 1} / ${frames.length}`;
    $('pText').textContent = f.text || ''; $('pText').hidden = !f.text;
    $('pEdit').hidden = !canEdit(f); $('pDel').hidden = !(Cloud.ok && Cloud.isAdmin && !f.placeholder); resetDel();
    panel.className = 'panel ' + (portrait ? 'below' : 'side') + ' on'; panel.scrollTop = 0; $('shade').className = (portrait ? 'below' : 'side') + ' on';
  }, reduceMotion ? 0 : 600);
}
function closeFrame() {
  if (view !== 'zoom') return; view = 'home'; current = -1; panel.classList.remove('on'); $('shade').classList.remove('on');
  setHome(pan.target); go(home.pos.clone(), home.tgt.clone(), 1.1);
  setTimeout(() => { if (view === 'home') { pill.classList.remove('hidden'); topbar.classList.remove('hidden'); if (refreshPending) scheduleRefresh(); } }, 900);
}
/* кто может менять рамку: в общей полке — автор или хозяин, иначе — все (локально) */
function canEdit(f) {
  if (!f || f.placeholder) return false;
  if (!Cloud.ok) return true;
  return Cloud.isAdmin || (!!f.owner && f.owner === Cloud.uid);
}
/* общая полка обновилась: перестраиваем, но не посреди просмотра рамки или заполнения формы */
let refreshPending = false;
function scheduleRefresh() {
  if (view === 'zoom' || document.querySelector('dialog[open]')) { refreshPending = true; return; }
  refreshPending = false; refresh();
}
$('close').addEventListener('click', closeFrame);
$('prev').addEventListener('click', () => openFrame(current - 1));
$('next').addEventListener('click', () => openFrame(current + 1));
addEventListener('keydown', e => {
  if (document.querySelector('dialog[open]')) return;
  if (e.key === 'Escape') { closeMenu(); closeFrame(); }
  if (view === 'zoom' && e.key === 'ArrowRight') openFrame(current + 1);
  if (view === 'zoom' && e.key === 'ArrowLeft') openFrame(current - 1);
  if (view === 'home' && pan.on && (e.key === 'ArrowDown' || e.key === 'PageDown')) panTo(pan.target - pan.vh * .4);
  if (view === 'home' && pan.on && (e.key === 'ArrowUp' || e.key === 'PageUp')) panTo(pan.target + pan.vh * .4);
});

const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let downAt = null, hovered = -1;
const pointer = { x: 0, y: 0 };
function pickFrame(cx, cy) {
  ndc.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  const meshes = []; frames.forEach(f => { if (f.visible) f.traverse(o => { if (o.isMesh) meshes.push(o); }); });
  const hit = ray.intersectObjects(meshes, false)[0]; return hit ? hit.object.userData.frame : -1;
}
canvas.addEventListener('pointerdown', e => { downAt = { x: e.clientX, y: e.clientY, ly: e.clientY }; closeMenu(); });
canvas.addEventListener('pointerup', e => {
  if (!downAt) return; const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y); downAt = null; if (moved > 8) return;
  const i = pickFrame(e.clientX, e.clientY);
  if (i >= 0 && i !== current) openFrame(i); else if (view === 'zoom' && i < 0) closeFrame();
});
canvas.addEventListener('pointercancel', () => { downAt = null; });
canvas.addEventListener('pointermove', e => {
  pointer.x = e.clientX / innerWidth * 2 - 1; pointer.y = e.clientY / innerHeight * 2 - 1;
  if (downAt && view === 'home' && pan.on) { panTo(pan.target + (e.clientY - downAt.ly) * pan.vh / innerHeight); downAt.ly = e.clientY; }
  if (e.pointerType === 'mouse') { hovered = view === 'home' ? pickFrame(e.clientX, e.clientY) : -1; canvas.style.cursor = pickFrame(e.clientX, e.clientY) >= 0 ? 'pointer' : 'default'; }
});
canvas.addEventListener('wheel', e => { if (view === 'home' && pan.on) { e.preventDefault(); panTo(pan.target - e.deltaY * pan.vh / innerHeight * .6); } }, { passive: false });

/* ---------- loop ---------- */
const clock = new THREE.Clock(); const par = new THREE.Vector2(), tmpV = new THREE.Vector3();
function frame() {
  const dt = Math.min(clock.getDelta(), .1), time = clock.elapsedTime;
  if (tween) { tween.t += dt / tween.dur; const k = easeInOut(clamp01(tween.t)); camPos.lerpVectors(tween.p0, tween.p1, k); camTgt.lerpVectors(tween.t0, tween.t1, k); if (tween.t >= 1) tween = null; }
  else if (view === 'home') { pan.cur += (pan.target - pan.cur) * (reduceMotion ? 1 : .14); setHome(pan.cur); camPos.copy(home.pos); camTgt.copy(home.tgt); }
  // лёгкий параллакс, чтобы полка ощущалась объёмной
  const tx = reduceMotion ? 0 : (view === 'home' ? pointer.x : pointer.x * .25), ty = reduceMotion ? 0 : (view === 'home' ? pointer.y : pointer.y * .25);
  par.x += (tx - par.x) * .06; par.y += (ty - par.y) * .06;
  const idle = reduceMotion ? 0 : Math.sin(time * .35) * .08;
  camera.position.copy(camPos).add(tmpV.set(par.x * .45 + idle, -par.y * .25, 0));
  camera.lookAt(camTgt);
  frames.forEach((f, i) => {
    const u = f.userData; const target = (i === hovered) ? 1 : 0; u.hover += (target - u.hover) * .15;
    u.inner.scale.setScalar(1 + u.hover * .035); u.inner.position.z = u.hover * .06;
  });
  if (!reduceMotion) {
    bulbs.forEach(b => { const k = .65 + .35 * Math.sin(time * b.sp + b.ph); b.s.material.opacity = k * .55; b.b.material.color.setHSL(.09, 1, .5 + .15 * k); });
    decor.items.forEach(g => { if (g.userData.tick) g.userData.tick(time); });
  }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
function resize() {
  renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); layout();
  if (view === 'zoom' && current >= 0) { const v = zoomView(current); camPos.copy(v.pos); camTgt.copy(v.tgt); tween = null; panel.className = 'panel ' + (portrait ? 'below' : 'side') + ' on'; $('shade').className = (portrait ? 'below' : 'side') + ' on'; }
  else { camPos.copy(home.pos); camTgt.copy(home.tgt); tween = null; }
}
addEventListener('resize', resize);

/* =====================================================================
   ДОБАВЛЕНИЕ / УДАЛЕНИЕ
   ===================================================================== */
const uid = p => p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
let toastT = 0;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2600); }
async function persist() { const ok = await Store.save(local); if (!ok) toast('не получилось сохранить в браузере 😕'); return ok; }
async function refresh() { await rebuildFrames(); rebuildObjects(); layout(); }

/* --- диалоги: закрытие по крестику/фону --- */
document.querySelectorAll('dialog.sheet').forEach(d => {
  d.addEventListener('click', e => { if (e.target === d || e.target.closest('[data-close]')) d.close(); });
});

/* --- 1) рамка с фото и текстом --- */
const dlgFrame = $('dlgFrame'); let pendingPhoto = null, editingId = null;
function resetFrameForm() {
  $('frameForm').reset(); pendingPhoto = null; $('fPreview').hidden = true; $('fPreview').removeAttribute('src'); $('dropHint').hidden = false; $('fErr').hidden = true;
}
function readPhoto(file) {
  // уменьшаем до 1600px по длинной стороне и сохраняем в JPEG, чтобы влезало в память браузера
  return new Promise((res, rej) => {
    if (!file || !/^image\//.test(file.type)) return rej(new Error('Это не похоже на картинку'));
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const k = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight));
      const [c, x] = cv(Math.round(im.naturalWidth * k), Math.round(im.naturalHeight * k));
      x.drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      res(c.toDataURL('image/jpeg', .86));
    };
    im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Не удалось открыть фото')); };
    im.src = url;
  });
}
/* уменьшить фото, пока оно не влезет в документ базы (лимит ~1 МБ) */
async function fitPhoto(src, maxLen = 900000) {
  let im = await loadImg(src); if (!im) return src;
  let w = im.naturalWidth || im.width, h = im.naturalHeight || im.height, q = .84, out = src;
  for (let k = 0; out.length > maxLen && k < 8; k++) {
    const s = Math.min(1, 1400 / Math.max(w, h)) * Math.pow(.85, k);
    const [c, x] = cv(Math.round(w * s), Math.round(h * s)); x.drawImage(im, 0, 0, c.width, c.height);
    out = c.toDataURL('image/jpeg', Math.max(.6, q - k * .04));
  }
  return out;
}
async function takePhoto(file) {
  try { pendingPhoto = await readPhoto(file); $('fPreview').src = pendingPhoto; $('fPreview').hidden = false; $('dropHint').hidden = true; $('fErr').hidden = true; }
  catch (e) { $('fErr').textContent = e.message; $('fErr').hidden = false; }
}
$('fPhoto').addEventListener('change', e => takePhoto(e.target.files[0]));
const drop = $('drop');
['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, () => drop.classList.remove('over')));
drop.addEventListener('drop', e => { e.preventDefault(); takePhoto(e.dataTransfer.files[0]); });
function openFrameForm(f) {
  // f — рамка для редактирования; без f — новая рамка
  closeMenu(); resetFrameForm(); editingId = f ? f.id : null;
  $('dlgFrameTitle').textContent = f ? 'изменить рамку' : 'новая рамка';
  $('fSubmit').textContent = f ? 'сохранить' : 'повесить на стену';
  if (f) {
    pendingPhoto = f.src; $('fPreview').src = f.src; $('fPreview').hidden = false; $('dropHint').hidden = true;
    $('fTitle').value = f.title || ''; $('fText').value = f.text || '';
    const r = document.querySelector(`input[name=fstyle][value="${f.frame}"]`); if (r) r.checked = true;
  }
  dlgFrame.showModal();
}
$('addFrameBtn').addEventListener('click', () => openFrameForm(null));
$('pEdit').addEventListener('click', () => { const f = FRAMES[current]; if (f && !f.placeholder) openFrameForm(f); });
$('frameForm').addEventListener('submit', async e => {
  e.preventDefault();
  const title = $('fTitle').value.trim();
  if (!pendingPhoto) { $('fErr').textContent = 'Сначала выберите фото'; $('fErr').hidden = false; return; }
  if (!title) { $('fErr').textContent = 'Добавьте подпись'; $('fErr').hidden = false; $('fTitle').focus(); return; }
  $('fSubmit').disabled = true;
  const data = { src: pendingPhoto, frame: (document.querySelector('input[name=fstyle]:checked') || {}).value || 'wood', title, text: $('fText').value.trim() };
  let f;
  if (Cloud.ok) {
    try {
      data.src = await fitPhoto(data.src);
      if (editingId) {
        f = { id: editingId };
        const cur = FRAMES.find(x => x.id === editingId), inCloud = cloudFrames.some(x => x.id === editingId);
        if (cur && cur.builtin && !inCloud) await Cloud.override(editingId, data); else await Cloud.update(editingId, data);
      } else f = { id: await Cloud.add(data) };
    } catch (err) {
      console.warn('[shelf] запись не удалась', err); $('fSubmit').disabled = false;
      $('fErr').textContent = 'Не получилось сохранить: проверьте интернет и попробуйте ещё раз'; $('fErr').hidden = false; return;
    }
  } else if (editingId) {
    f = { id: editingId };
    const own = local.frames.find(x => x.id === editingId);
    if (own) Object.assign(own, data);                       // своя рамка — меняем на месте
    else { local.edits = local.edits || {}; local.edits[editingId] = data; } // рамка из content.js — запоминаем правку
    await persist();
  } else { f = Object.assign({ id: uid('f') }, data); local.frames.push(f); await persist(); }
  $('fSubmit').disabled = false; dlgFrame.close();
  const wasEdit = !!editingId; editingId = null;
  if (wasEdit) { view = 'home'; current = -1; panel.classList.remove('on'); }
  await refresh();
  const idx = FRAMES.findIndex(x => x.id === f.id); toast(wasEdit ? 'рамка обновлена ✨' : 'рамка висит на стене ✨');
  if (idx >= 0) setTimeout(() => openFrame(idx), 250);
});

function removeItem(id, kind) {
  const i = local[kind].findIndex(x => x.id === id);
  if (i >= 0) local[kind].splice(i, 1);
  if (local.edits) delete local.edits[id];
  if ((kind === 'frames' ? CONTENT.frames : CONTENT.objects).some(x => x.id === id) && !local.hidden.includes(id)) local.hidden.push(id);
}

/* --- удалить рамку: только хозяин в общей полке, вторым нажатием --- */
const pDel = $('pDel'); let delArmed = 0;
function resetDel() { clearTimeout(delArmed); delArmed = 0; pDel.classList.remove('sure'); pDel.textContent = 'удалить'; }
pDel.addEventListener('click', async () => {
  if (!delArmed) { pDel.classList.add('sure'); pDel.textContent = 'точно удалить?'; delArmed = setTimeout(resetDel, 5000); return; }
  resetDel();
  const f = FRAMES[current]; if (!f || f.placeholder || !Cloud.ok || !Cloud.isAdmin) return;
  try {
    const inCloud = cloudFrames.some(x => x.id === f.id);
    if (f.builtin) { if (inCloud) await Cloud.update(f.id, { hidden: true }); else await Cloud.override(f.id, { hidden: true }); }
    else await Cloud.remove(f.id);
    closeFrame(); toast('рамка удалена');
  } catch (err) { console.warn(err); toast('не получилось удалить'); }
});

/* --- вход хозяина (только по #admin) --- */
const dlgLogin = $('dlgLogin');
function syncLogin() {
  const on = Cloud.ok;
  $('loginBtn').hidden = !on || Cloud.isAdmin; $('logoutBtn').hidden = !on || !Cloud.isAdmin;
  $('logoutBtn').textContent = Cloud.isAdmin ? `выйти (${Cloud.email || 'хозяин'})` : 'выйти';
  $('resetBtn').hidden = on;
}
$('loginBtn').addEventListener('click', () => { closeMenu(); $('loginForm').reset(); $('lErr').hidden = true; dlgLogin.showModal(); });
$('logoutBtn').addEventListener('click', async () => { closeMenu(); await Cloud.logout(); toast('вы вышли'); });
$('loginForm').addEventListener('submit', async e => {
  e.preventDefault(); $('lSubmit').disabled = true;
  try { await Cloud.login($('lEmail').value.trim(), $('lPass').value); dlgLogin.close(); toast('вы вошли как хозяин'); }
  catch (err) { $('lErr').textContent = 'Неверная почта или пароль'; $('lErr').hidden = false; }
  $('lSubmit').disabled = false;
});
document.querySelectorAll('dialog.sheet').forEach(d => d.addEventListener('close', () => { if (refreshPending) setTimeout(scheduleRefresh, 50); }));

/* --- меню «⋯»: экспорт и сброс. Скрыто; видно, если открыть сайт с #admin в конце адреса --- */
function syncAdmin() { $('more').hidden = location.hash !== '#admin'; }
syncAdmin(); addEventListener('hashchange', syncAdmin);
const moreBtn = $('moreBtn'), moreMenu = $('moreMenu');
function closeMenu() { moreMenu.hidden = true; moreBtn.setAttribute('aria-expanded', 'false'); }
moreBtn.addEventListener('click', e => { e.stopPropagation(); const open = moreMenu.hidden; moreMenu.hidden = !open; moreBtn.setAttribute('aria-expanded', String(open)); });
document.addEventListener('click', e => { if (!e.target.closest('.more')) closeMenu(); });
$('exportBtn').addEventListener('click', () => {
  // собирает текущую полку в новый js/content.js — его можно выложить на хостинг, и все увидят те же рамки
  closeMenu();
  const fr = FRAMES.filter(f => !f.placeholder).map(f => ({ id: f.id, src: f.src, frame: f.frame, title: f.title || '', text: f.text || '' }));
  const ob = OBJECTS.map(o => { const r = { id: o.id, type: o.type, params: o.params || {} }; if (o.po != null) r.po = o.po; return r; });
  const data = { frames: fr, placeholders: CONTENT.placeholders || [], minFrames: CONTENT.minFrames || 0, objects: ob };
  const js = '/* Содержимое полки. Сохранено ' + new Date().toLocaleString('ru-RU') + '. Положите этот файл в js/content.js на хостинге. */\nwindow.SHELF_CONTENT = ' + JSON.stringify(data, null, 1) + ';\n';
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([js], { type: 'text/javascript' })); a.download = 'content.js';
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  toast('файл content.js сохранён');
});
let resetArmed = 0;
$('resetBtn').addEventListener('click', async e => {
  e.stopPropagation(); const b = e.currentTarget;
  if (!resetArmed) { b.textContent = 'точно? всё добавленное пропадёт'; resetArmed = setTimeout(() => { resetArmed = 0; b.textContent = 'вернуть полку как было'; }, 3500); return; }
  clearTimeout(resetArmed); resetArmed = 0; b.textContent = 'вернуть полку как было'; closeMenu();
  local = Store.empty(); await persist(); await refresh(); toast('полка как в начале');
});

/* ---------- старт ---------- */
(async function init() {
  try { await Promise.race([Promise.all([document.fonts.load('600 48px Caveat'), document.fonts.load('600 48px "Cormorant Garamond"')]), new Promise(r => setTimeout(r, 2500))]); } catch (e) { }
  decor.shelfMap = woodCanvas(false);
  decor.shelfMat = new THREE.MeshStandardMaterial({ map: decor.shelfMap, roughness: .75 });
  local = await Store.load();
  if (await Cloud.init()) {
    // ждём первую загрузку общей полки (не дольше 8 секунд), дальше обновляемся вживую
    await new Promise(res => {
      let first = true; const t = setTimeout(() => { if (first) { first = false; res(); } }, 8000);
      Cloud.watch(list => { cloudFrames = list; if (first) { first = false; clearTimeout(t); res(); } else scheduleRefresh(); },
        err => { console.warn('[shelf] чтение общей полки', err); if (first) { first = false; clearTimeout(t); res(); } });
    });
    Cloud.onAuth(() => { syncLogin(); if (view === 'zoom' && current >= 0) { $('pEdit').hidden = !canEdit(FRAMES[current]); $('pDel').hidden = !(Cloud.isAdmin && !FRAMES[current].placeholder); } });
  }
  syncLogin();
  await rebuildFrames(); rebuildObjects();
  renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  layout(); camPos.copy(home.pos); camTgt.copy(home.tgt);
  frame(); $('loading').classList.add('done');
})();
