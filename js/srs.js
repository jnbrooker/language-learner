// Spaced repetition: card building from deck data + SM-2-style scheduling.
LL.srs = (function () {
  const MIN = 60 * 1000, DAY = 24 * 60 * MIN;

  function parseCloze(item) {
    const [sentence, translation = '', hint = '', note = ''] = item.split('|');
    const m = sentence.match(/\{([^}]+)\}/);
    if (!m) return null;
    return {
      type: 'cloze',
      before: sentence.slice(0, m.index),
      after: sentence.slice(m.index + m[0].length),
      answers: m[1].split('/').map(s => s.trim()),
      full: sentence.replace(/\{([^}]+)\}/, (_, a) => a.split('/')[0].trim()),
      translation, hint, note,
      key: sentence,
    };
  }
  function parseFlip(item) {
    const [front, back = '', note = ''] = item.split('|');
    return { type: 'flip', front, back, note, full: front, key: front };
  }

  function customDeck(lang) {
    return { name: 'My cards', desc: 'Sentences you mined from films and elsewhere.', type: 'mixed', items: LL.store.get('custom:' + lang, []) };
  }
  function decks(lang) {
    return Object.assign({}, LL.data[lang].decks, { custom: customDeck(lang) });
  }

  let cache = {};
  function allCards(lang) {
    const out = [];
    const ds = decks(lang);
    for (const dk of Object.keys(ds)) {
      const d = ds[dk];
      for (const item of d.items) {
        const raw = typeof item === 'string' ? item : item.raw;
        const type = typeof item === 'string' ? d.type : item.type;
        const c = type === 'flip' ? parseFlip(raw) : parseCloze(raw);
        if (!c) continue;
        c.deck = dk;
        c.deckName = d.name;
        c.id = lang + ':' + dk + ':' + LL.text.hash(c.key);
        c.raw = raw;
        out.push(c);
      }
    }
    cache[lang] = out;
    return out;
  }

  function states(lang) { return LL.store.get('srs:' + lang, {}); }
  function saveStates(lang, st) { LL.store.set('srs:' + lang, st); }

  function newCountToday(lang) {
    const r = LL.store.get('newcount:' + lang, {});
    return r.date === LL.today() ? r.n : 0;
  }
  function bumpNew(lang) {
    LL.store.set('newcount:' + lang, { date: LL.today(), n: newCountToday(lang) + 1 });
  }

  function enabledCards(lang) {
    const s = LL.settings();
    const on = (s.decks && s.decks[lang]) || {};
    return allCards(lang).filter(c => on[c.deck] !== false);
  }

  // Build today's session: due reviews first (most overdue first), then new cards.
  function buildSession(lang, opts) {
    opts = opts || {};
    const st = states(lang);
    const now = Date.now();
    const cards = opts.deck ? allCards(lang).filter(c => c.deck === opts.deck) : enabledCards(lang);
    const due = cards.filter(c => st[c.id] && st[c.id].due <= now)
      .sort((a, b) => st[a.id].due - st[b.id].due);
    const s = LL.settings();
    const newLeft = opts.deck ? (opts.extraNew || 10) : Math.max(0, s.newPerDay - newCountToday(lang)) + (opts.extraNew || 0);
    // Interleave decks for new cards so you don't get 20 of the same kind in a row.
    const fresh = cards.filter(c => !st[c.id]);
    const byDeck = {};
    fresh.forEach(c => (byDeck[c.deck] = byDeck[c.deck] || []).push(c));
    const order = ['custom', 'core', 'everyday', 'conversation', 'grammar', 'spoken', 'cinema'].filter(k => byDeck[k]);
    Object.keys(byDeck).forEach(k => { if (!order.includes(k)) order.push(k); });
    const newCards = [];
    let added = true;
    while (newCards.length < newLeft && added) {
      added = false;
      for (const k of order) {
        if (newCards.length >= newLeft) break;
        const c = byDeck[k].shift();
        if (c) { newCards.push(c); added = true; }
      }
    }
    return { due, newCards };
  }

  // grade: 0 again, 1 hard, 2 good, 3 easy
  function answer(lang, card, grade) {
    const st = states(lang);
    const isNew = !st[card.id];
    const c = st[card.id] || { interval: 0, ease: 2.5, reps: 0, lapses: 0 };
    const now = Date.now();
    if (grade === 0) {
      if (c.interval >= 1) c.lapses++;
      c.interval = 0;
      c.ease = Math.max(1.3, c.ease - 0.2);
      c.due = now + 10 * MIN;
    } else {
      let iv;
      if (c.interval === 0) iv = grade === 3 ? 4 : grade === 1 ? 1 : (c.reps === 0 ? 1 : 2);
      else if (grade === 1) iv = Math.max(1, c.interval * 1.2);
      else if (grade === 2) iv = Math.max(c.interval + 1, c.interval * c.ease);
      else iv = Math.max(c.interval + 2, c.interval * c.ease * 1.3);
      if (grade === 1) c.ease = Math.max(1.3, c.ease - 0.15);
      if (grade === 3) c.ease += 0.15;
      // Small fuzz so cards added together don't stay clumped forever.
      if (iv > 3) iv = iv * (0.95 + Math.random() * 0.1);
      c.interval = Math.round(iv * 10) / 10;
      c.due = now + c.interval * DAY;
      c.reps++;
    }
    c.last = now;
    st[card.id] = c;
    saveStates(lang, st);
    if (isNew) bumpNew(lang);
    logReview(lang, grade);
    return c;
  }

  function logReview(lang, grade) {
    const log = LL.store.get('log:' + lang, {});
    const d = LL.today();
    log[d] = log[d] || { n: 0, ok: 0 };
    log[d].n++;
    if (grade > 0) log[d].ok++;
    LL.store.set('log:' + lang, log);
  }

  function stats(lang) {
    const st = states(lang);
    const cards = enabledCards(lang);
    const now = Date.now();
    let due = 0, learned = 0, mature = 0, fresh = 0;
    for (const c of cards) {
      const s = st[c.id];
      if (!s) { fresh++; continue; }
      if (s.due <= now) due++;
      if (s.reps > 0) learned++;
      if (s.interval >= 21) mature++;
    }
    const log = LL.store.get('log:' + lang, {});
    let streak = 0;
    const d = new Date();
    if (!log[LL.today()]) d.setDate(d.getDate() - 1);
    for (;;) {
      const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      if (log[k] && log[k].n > 0) { streak++; d.setDate(d.getDate() - 1); } else break;
    }
    const todayLog = log[LL.today()] || { n: 0, ok: 0 };
    const newLeft = Math.min(fresh, Math.max(0, LL.settings().newPerDay - newCountToday(lang)));
    return { due, learned, mature, fresh, total: cards.length, streak, today: todayLog, newLeft };
  }

  // Words you have demonstrably learned (answers of cards reviewed successfully).
  function knownWords(lang) {
    const st = states(lang);
    const set = new Set(LL.store.get('known:' + lang, []));
    for (const c of allCards(lang)) {
      const s = st[c.id];
      if (s && s.reps > 0 && c.type === 'cloze') {
        c.answers.forEach(a => LL.text.tokens(a, lang).forEach(w => set.add(w)));
      }
    }
    return set;
  }

  function deckProgress(lang) {
    const st = states(lang);
    const ds = decks(lang);
    const all = allCards(lang);
    const out = [];
    for (const k of Object.keys(ds)) {
      const cs = all.filter(c => c.deck === k);
      if (!cs.length) continue;
      let started = 0, solid = 0;
      cs.forEach(c => { const x = st[c.id]; if (x) { started++; if (x.interval >= 21) solid++; } });
      out.push({ key: k, name: ds[k].name, total: cs.length, started, solid });
    }
    return out;
  }

  return { deckProgress, allCards, decks, buildSession, answer, stats, states, knownWords, parseCloze };
})();
