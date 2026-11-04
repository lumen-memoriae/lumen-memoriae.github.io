/* ---------- общие помощники и процедурные текстуры ---------- */
const $ = id => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a), pick = a => a[(Math.random() * a.length) | 0];
const clamp01 = v => Math.max(0, Math.min(1, v));
const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function grain(x, w, h, a = 10) { const d = x.getImageData(0, 0, w, h), p = d.data; for (let i = 0; i < p.length; i += 4) { const n = (Math.random() - .5) * a; p[i] += n; p[i + 1] += n; p[i + 2] += n; } x.putImageData(d, 0, 0); }
function tex(c) { const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t; }
function radial(stops, s = 64) { const [c, x] = cv(s, s); const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); stops.forEach(([o, cl]) => g.addColorStop(o, cl)); x.fillStyle = g; x.fillRect(0, 0, s, s); return tex(c); }
function canvasTex(w, h, draw) { const [c, x] = cv(w, h); draw(x, w, h); return tex(c); }
const Mt = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .6, metalness: 0 }, o));
/* подогнать размер шрифта под ширину */
function fitFont(x, text, maxW, start, tpl) { let fs = start; do { x.font = tpl.replace('{}', fs); fs -= 2; } while (x.measureText(text).width > maxW && fs > 8); }
/* осветлить / затемнить цвет: k>0 светлее, k<0 темнее */
function shade(hex, k) { const c = new THREE.Color(hex); return k > 0 ? c.lerp(new THREE.Color('#ffffff'), k) : c.lerp(new THREE.Color('#000000'), -k); }
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; }

function plasterCanvas() {
  const W = 1024, H = 1024, [c, x] = cv(W, H); x.fillStyle = '#223047'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 1800; i++) { x.globalAlpha = rand(.03, .09); x.fillStyle = pick(['#2c3c58', '#1a2539', '#30425f', '#1e2a40']); x.beginPath(); x.ellipse(rand(0, W), rand(0, H), rand(10, 60), rand(6, 30), rand(0, 3), 0, Math.PI * 2); x.fill(); }
  x.globalAlpha = 1; grain(x, W, H, 9); const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 2); return t;
}
function woodCanvas(light) {
  const W = 1024, H = 256, [c, x] = cv(W, H); x.fillStyle = light ? '#9a6a44' : '#6d4428'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) {
    x.strokeStyle = pick(light ? ['rgba(70,40,20,.25)', 'rgba(200,150,100,.25)'] : ['rgba(40,20,10,.3)', 'rgba(150,100,60,.22)']); x.lineWidth = rand(1, 3);
    x.beginPath(); let y = rand(0, H); x.moveTo(0, y); for (let px = 0; px <= W; px += 48) { y += rand(-2, 2); x.lineTo(px, y); } x.stroke();
  }
  for (let k = 0; k < 3; k++) { x.fillStyle = 'rgba(50,25,10,.35)'; x.beginPath(); x.ellipse(rand(60, W - 60), rand(30, H - 30), rand(10, 24), rand(5, 9), 0, 0, Math.PI * 2); x.fill(); }
  grain(x, W, H, 8); const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function matCanvas(pw, ph, m) {
  const S = 400, W = Math.round((pw + 2 * m) * S), H = Math.round((ph + 2 * m) * S), [c, x] = cv(W, H);
  x.fillStyle = '#f2ebde'; x.fillRect(0, 0, W, H); grain(x, W, H, 6);
  const ix = m * S, iy = m * S, iw = pw * S, ih = ph * S;
  x.strokeStyle = 'rgba(120,100,80,.35)'; x.lineWidth = 5; x.strokeRect(ix - 3, iy - 3, iw + 6, ih + 6);
  x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = 2; x.beginPath(); x.moveTo(ix - 6, iy + ih + 6); x.lineTo(ix + iw + 6, iy + ih + 6); x.lineTo(ix + iw + 6, iy - 6); x.stroke();
  return tex(c);
}
function placeholderCanvas(aspect, i) {
  const W = 800, H = Math.round(800 / aspect), [c, x] = cv(W, H);
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, ['#e9c9b4', '#c7d3e6'][i % 2]); g.addColorStop(1, ['#b9a4c9', '#e7d2b0'][i % 2]); x.fillStyle = g; x.fillRect(0, 0, W, H);
  for (let k = 0; k < 140; k++) { x.globalAlpha = rand(.05, .15); x.fillStyle = pick(['#fff', '#f2b6c6', '#ffd9a8', '#a9bcff']); x.beginPath(); x.ellipse(rand(0, W), rand(0, H), rand(20, 90), rand(10, 50), rand(0, 3), 0, Math.PI * 2); x.fill(); }
  x.globalAlpha = 1; x.strokeStyle = 'rgba(60,50,70,.45)'; x.lineWidth = 6; x.setLineDash([18, 14]); x.strokeRect(40, 40, W - 80, H - 80); x.setLineDash([]);
  x.fillStyle = 'rgba(60,50,70,.75)'; x.font = '600 84px Caveat'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('будут еще,', W / 2, H / 2 - 48); x.fillText('добавим жи ес', W / 2, H / 2 + 48);
  return c;
}
function glassTex() {
  const [c, x] = cv(256, 256); const g = x.createLinearGradient(0, 0, 256, 256);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.38, 'rgba(255,255,255,0)'); g.addColorStop(.45, 'rgba(255,255,255,.22)'); g.addColorStop(.52, 'rgba(255,255,255,0)');
  g.addColorStop(.6, 'rgba(255,255,255,.08)'); g.addColorStop(.64, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256); return tex(c);
}
function miniRose(x, cx, cy, r) {
  for (let k = 0; k < 6; k++) { x.fillStyle = ['#5e0a16', '#7d1222', '#9b1a2e', '#b52640', '#c93450', '#d84a62'][k]; x.beginPath(); x.arc(cx + Math.cos(k * 2.1) * r * .08, cy + Math.sin(k * 2.1) * r * .08, r * (1 - k * .15), 0, Math.PI * 2); x.fill(); }
  x.strokeStyle = 'rgba(40,0,8,.6)'; x.lineWidth = r * .06; x.beginPath(); for (let a = 0; a < Math.PI * 4; a += .2) { const rr = a / (Math.PI * 4) * r * .75; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.stroke();
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
