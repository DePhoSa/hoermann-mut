/* Hörmann Cloud: Firestore-Anbindung (ersetzt ntfy + bytebin).
   Öffentlicher Web-Config-Block, die Sicherheit liegt in firebase/firestore.rules. */
(function(root) {
  const config = {
    apiKey: 'AIzaSyDM72SyPIPrRdXzqgdmeif26LliIrbppyY',
    authDomain: 'hoermann-mut.firebaseapp.com',
    projectId: 'hoermann-mut',
    storageBucket: 'hoermann-mut.firebasestorage.app',
    messagingSenderId: '204649341366',
    appId: '1:204649341366:web:3a6b32e69f9b23f76ba117'
  };
  const SDK = 'https://www.gstatic.com/firebasejs/10.14.1/';
  // Vorschau unter /test/ nutzt getrennte Sammlungen, damit echte Daten unberührt bleiben.
  const PRE = (root.location && /\/test\//.test(root.location.pathname)) ? 'test_' : '';
  const scoreId = (cat, name) => cat + '__' + String(name).trim().toLowerCase();
  const ADMIN_TYPES = new Set(['CHAT_DELETE','CHAT_CLEAR','IDEA_DELETE','RENAME_APPROVE','RENAME_REJECT','FORCE_UPDATE']);
  let ready = null, started = false, api = null;

  function init() {
    if (ready) return ready;
    ready = (async () => {
      const [app, auth, fs] = await Promise.all([
        import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js'), import(SDK + 'firebase-firestore.js')
      ]);
      const a = app.initializeApp(config);
      const au = auth.getAuth(a);
      const db = fs.initializeFirestore(a, { experimentalAutoDetectLongPolling: true });
      if (!au.currentUser) await auth.signInAnonymously(au);
      api = { fs, db, au };
      root.HoermannCloud.uid = au.currentUser && au.currentUser.uid;
      return api;
    })();
    ready.catch(() => { ready = null; });
    return ready;
  }

  function toScorePayload(d) {
    return { type: 'SCORE', cat: d.cat, name: d.name, score: d.score, date: d.date || 'Heute', deviceToken: d.owner };
  }

  const cloud = {
    uid: null,
    scoreId,
    async publish(p) {
      const { fs, db, au } = await init();
      if (p.type === 'SCORE') {
        const ref = fs.doc(db, PRE + 'scores', scoreId(p.cat, p.name));
        const data = { cat: p.cat, name: String(p.name).trim().slice(0, 24), score: Number(p.score), date: p.date || 'Heute', owner: au.currentUser.uid, ts: Date.now() };
        const snap = await fs.getDoc(ref);
        if (snap.exists() && Number(snap.data().score) >= data.score) return;
        await fs.setDoc(ref, data);
        return;
      }
      if (p.type === 'ADMIN_HASH') return; // Admin läuft jetzt über config/admins
      const ev = Object.assign({}, p, { uid: au.currentUser.uid, ts: p.ts || Date.now() });
      delete ev.deviceToken;
      await fs.addDoc(fs.collection(db, PRE + 'events'), ev);
    },
    // Admin = diese anonyme Geräte-ID steht in Firestore unter config/admins (Feld uids).
    async isAdmin() {
      const { fs, db, au } = await init();
      const snap = await fs.getDoc(fs.doc(db, 'config', 'admins'));
      return snap.exists() && Array.isArray(snap.data().uids) && snap.data().uids.includes(au.currentUser.uid);
    },
    // onItems(payloads[]) bekommt alle neuen/geänderten Daten, setBadge(status) den Verbindungsstatus.
    async start(onItems, setBadge) {
      if (started) return;
      started = true;
      try {
        const { fs, db } = await init();
        const seen = new Set();
        fs.onSnapshot(fs.collection(db, PRE + 'scores'), snap => {
          const items = [];
          snap.docChanges().forEach(c => { if (c.type !== 'removed') items.push(toScorePayload(c.doc.data())); });
          if (items.length) onItems(items);
          setBadge && setBadge('online');
        }, () => setBadge && setBadge('offline'));
        const q = fs.query(fs.collection(db, PRE + 'events'), fs.orderBy('ts', 'desc'), fs.limit(400));
        fs.onSnapshot(q, snap => {
          const items = [];
          snap.docChanges().forEach(c => {
            if (c.type !== 'added' || seen.has(c.doc.id)) return;
            seen.add(c.doc.id);
            items.push(c.doc.data());
          });
          items.sort((a, b) => (a.ts || 0) - (b.ts || 0));
          if (items.length) onItems(items);
          setBadge && setBadge('online');
        }, () => setBadge && setBadge('offline'));
      } catch (e) { started = false; setBadge && setBadge('offline'); throw e; }
    },
    ADMIN_TYPES
  };
  root.HoermannCloud = cloud;
  if (typeof module === 'object' && module.exports) module.exports = cloud;
})(globalThis);
