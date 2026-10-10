// Persistent state in localStorage. Everything is namespaced under "ll:".
window.LL = window.LL || {};
LL.data = LL.data || { fr: { decks: {} }, es: { decks: {} } };

LL.store = {
  get(key, def) {
    try {
      const v = localStorage.getItem('ll:' + key);
      return v == null ? def : JSON.parse(v);
    } catch (e) { return def; }
  },
  set(key, val) {
    try { localStorage.setItem('ll:' + key, JSON.stringify(val)); } catch (e) {}
  },
  exportAll() {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith('ll:')) out[k] = localStorage.getItem(k);
    }
    return out;
  },
  importAll(obj) {
    Object.keys(obj).forEach(k => { if (k.startsWith('ll:')) localStorage.setItem(k, obj[k]); });
  },
  clearAll() {
    Object.keys(localStorage).filter(k => k.startsWith('ll:')).forEach(k => localStorage.removeItem(k));
  },
};

LL.settings = function () {
  return Object.assign({
    lang: 'fr',
    newPerDay: 30,
    rate: 1.0,
    voice: { fr: '', es: '' },
    listenFirst: false,
    autoplay: true,
    decks: {
      fr: { core: true, spoken: true, grammar: true, cinema: true, custom: true },
      es: { core: true, spoken: true, grammar: true, cinema: true, custom: true },
    },
  }, LL.store.get('settings', {}));
};
LL.saveSettings = function (s) { LL.store.set('settings', s); };

LL.today = function () {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};
