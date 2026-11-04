/* =====================================================================
   ОБЩАЯ ПОЛКА (Firebase Firestore)
   Рамки хранятся в коллекции frames и видны всем посетителям.
   Каждый посетитель входит анонимно (чтобы мог менять свои рамки),
   хозяин входит по почте и паролю через #admin.
   Если Firebase недоступен, сайт работает как раньше, только в этом браузере.
   ===================================================================== */
const Cloud = (() => {
  const SDK = 'https://www.gstatic.com/firebasejs/13.2.0/';
  let F, A, db, auth, ok = false, user = null;
  const authListeners = [];
  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

  async function init() {
    const config = window.FIREBASE_CONFIG; if (!config) return false;
    try {
      const [app, fs, au] = await withTimeout(Promise.all([import(SDK + 'firebase-app.js'), import(SDK + 'firebase-firestore.js'), import(SDK + 'firebase-auth.js')]), 10000);
      F = fs; A = au;
      const fa = app.initializeApp(config);
      db = F.getFirestore(fa); auth = A.getAuth(fa);
      await withTimeout(auth.authStateReady(), 10000);
      if (!auth.currentUser) await withTimeout(A.signInAnonymously(auth), 10000);
      user = auth.currentUser;
      A.onAuthStateChanged(auth, async u => {
        user = u;
        if (!u) { try { await A.signInAnonymously(auth); } catch (e) { console.warn('[shelf] анонимный вход не удался', e); } return; }
        authListeners.forEach(fn => fn());
      });
      ok = true;
    } catch (e) { console.warn('[shelf] общая полка недоступна, работаем локально', e); ok = false; }
    return ok;
  }
  const col = () => F.collection(db, 'frames');
  function watch(onList, onError) {
    return F.onSnapshot(F.query(col(), F.orderBy('createdAt')), s => onList(s.docs.map(d => Object.assign({}, d.data({ serverTimestamps: 'estimate' }), { id: d.id }))), onError);
  }
  async function add(data) {
    const ref = await F.addDoc(col(), Object.assign({}, data, { owner: user.uid, createdAt: F.serverTimestamp() }));
    return ref.id;
  }
  async function update(id, data) { await F.updateDoc(F.doc(db, 'frames', id), data); }
  // правка/скрытие рамок из js/content.js (только хозяин): документ с тем же id
  async function override(id, data) { await F.setDoc(F.doc(db, 'frames', id), Object.assign({}, data, { owner: 'admin', override: true, createdAt: F.serverTimestamp() })); }
  async function remove(id) { await F.deleteDoc(F.doc(db, 'frames', id)); }
  async function login(email, password) { await A.signInWithEmailAndPassword(auth, email, password); }
  async function logout() { await A.signOut(auth); }
  return {
    init, watch, add, update, override, remove, login, logout,
    get ok() { return ok; },
    get uid() { return user ? user.uid : null; },
    get isAdmin() { return !!(user && !user.isAnonymous); },
    get email() { return user && user.email; },
    onAuth(fn) { authListeners.push(fn); }
  };
})();
