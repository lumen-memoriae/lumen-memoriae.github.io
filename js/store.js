/* =====================================================================
   ХРАНИЛИЩЕ: всё, что добавлено через сайт, сохраняется в браузере
   (IndexedDB — фотографии туда помещаются, в отличие от localStorage).
   Формат: { frames:[...], objects:[...], hidden:[id,...] }
   ===================================================================== */
const Store = (() => {
  const DB = 'our-shelf', OS = 'kv', KEY = 'state';
  const empty = () => ({ frames: [], objects: [], hidden: [] });
  let dbp = null;
  function db() {
    if (!dbp) dbp = new Promise((res, rej) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(OS);
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  async function load() {
    try {
      const d = await db();
      const v = await new Promise((res, rej) => { const q = d.transaction(OS).objectStore(OS).get(KEY); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
      return Object.assign(empty(), v || {});
    } catch (e) { console.warn('[shelf] хранилище недоступно', e); return empty(); }
  }
  async function save(state) {
    try {
      const d = await db();
      await new Promise((res, rej) => { const t = d.transaction(OS, 'readwrite'); t.objectStore(OS).put(state, KEY); t.oncomplete = res; t.onerror = () => rej(t.error); });
      return true;
    } catch (e) { console.warn('[shelf] не удалось сохранить', e); return false; }
  }
  return { load, save, empty };
})();
