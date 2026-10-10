// All page views. Each view renders into `el` and may set LL.onKey for keyboard shortcuts.
LL.views = (function () {
  const esc = s => LL.text.escape(s == null ? '' : s);
  const lang = () => LL.settings().lang;
  const LANG_NAME = { fr: 'French', es: 'Spanish' };
  const ACCENTS = {
    fr: ['é', 'è', 'ê', 'à', 'â', 'ç', 'ù', 'û', 'ô', 'î', 'ï', 'ë', 'œ', '«', '»'],
    es: ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¿', '¡'],
  };
  const $ = (el, sel) => el.querySelector(sel);
  const $$ = (el, sel) => Array.from(el.querySelectorAll(sel));

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }
  function accentBar(l) {
    return `<div class="accents">${ACCENTS[l].map(a => `<button type="button" tabindex="-1" data-acc="${a}">${a}</button>`).join('')}</div>`;
  }
  // Clicking an accent button inserts it into the last focused input.
  let lastInput = null;
  document.addEventListener('focusin', e => { if (e.target.matches('input[type=text], textarea')) lastInput = e.target; });
  document.addEventListener('mousedown', e => {
    const b = e.target.closest('[data-acc]');
    if (!b) return;
    e.preventDefault();
    const inp = lastInput && document.contains(lastInput) ? lastInput : document.querySelector('input.blank, .conj-input, textarea.dict');
    if (!inp) return;
    const s = inp.selectionStart ?? inp.value.length, en = inp.selectionEnd ?? s;
    inp.value = inp.value.slice(0, s) + b.dataset.acc + inp.value.slice(en);
    inp.focus();
    inp.setSelectionRange(s + 1, s + 1);
    inp.dispatchEvent(new Event('input'));
  });
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  /* ---------------- Today ---------------- */
  const INTENSITY = [
    { id: 'steady', label: 'Steady', n: 15, note: '~20 min/day' },
    { id: 'intense', label: 'Intensive', n: 30, note: '~40 min/day' },
    { id: 'max', label: 'Maximum', n: 50, note: '60+ min/day' },
  ];
  function today(el) {
    const l = lang();
    const s = LL.settings();
    const st = LL.srs.stats(l);
    const conj = LL.store.get('conjstats:' + l, {});
    let cn = 0, cok = 0;
    Object.values(conj).forEach(v => { cn += v.n; cok += v.ok; });
    const tr = LL.store.get('transstats:' + l, { n: 0, words: 0, ok: 0 });
    const dict = LL.store.get('dictstats:' + l, { n: 0, words: 0, ok: 0 });
    const session = st.due + st.newLeft;
    const progress = LL.srs.deckProgress(l);
    const films = LL.data[l].films.list;
    const watched = new Set(LL.store.get('watched:' + l, []));
    const nextFilm = films.find(f => !watched.has(f.title));
    const pct = (a, b) => b ? Math.round(100 * a / b) + '%' : '—';
    el.innerHTML = `
      <div class="section-head"><span class="kicker">Intensive ${LANG_NAME[l]}</span></div>
      <h1>Today</h1>
      <p class="lede">Daily typed recall, production and listening, aimed at real comprehension: conversations, books, and films in the original.</p>
      <div class="grid">
        <div class="stat"><div class="num">${st.due}</div><div class="lbl">reviews due</div></div>
        <div class="stat"><div class="num">${st.newLeft}</div><div class="lbl">new cards left today</div></div>
        <div class="stat"><div class="num">${st.learned}</div><div class="lbl">cards learned (${st.mature} solid)</div></div>
        <div class="stat"><div class="num">${st.streak}</div><div class="lbl">day streak</div></div>
      </div>
      <div class="card" style="margin-top:16px">
        <div class="row">
          <div>
            <h2 style="margin:0">${session ? `${session} cards waiting` : 'Reviews cleared'}</h2>
            <div class="muted small">${st.today.n} reviews done today · ${st.total - st.fresh} of ${st.total} cards started</div>
          </div>
          <div class="spacer"></div>
          ${session ? `<a class="btn primary" href="#/review">Start review →</a>` : `<a class="btn" href="#/review?extra=10">Learn 10 more</a>`}
        </div>
        <div class="row" style="margin-top:14px">
          <span class="small muted">Intensity</span>
          <div class="seg" id="intensity">${INTENSITY.map(i => `<button data-n="${i.n}" class="${s.newPerDay === i.n ? 'active' : ''}" title="${i.note}">${i.label} <span class="small" style="opacity:.75">${i.n}</span></button>`).join('')}</div>
          <span class="small muted">${s.newPerDay} new cards/day · ${(INTENSITY.find(i => i.n === s.newPerDay) || { note: 'custom' }).note}</span>
        </div>
      </div>

      <h2>Daily training</h2>
      <div class="card">
        <table class="decks"><tbody>
          <tr><td><b>1. Review</b><div class="muted small">Clear every due card. Type each answer, then say the sentence aloud after the audio.</div></td><td class="small muted">${st.today.n} today</td><td><a class="btn small" href="#/review">Go</a></td></tr>
          <tr><td><b>2. Translate</b><div class="muted small">English → ${LANG_NAME[l]}, whole sentences. The hardest drill, and the one that builds speaking.</div></td><td class="small muted">${pct(tr.ok, tr.words)} words</td><td><a class="btn small" href="#/translate">Go</a></td></tr>
          <tr><td><b>3. Conjugate</b><div class="muted small">One round; aim the tense selection at your weakest.</div></td><td class="small muted">${pct(cok, cn)}</td><td><a class="btn small" href="#/conjugate">Go</a></td></tr>
          <tr><td><b>4. Dictation</b><div class="muted small">10 sentences. Trains your ear for native-speed speech.</div></td><td class="small muted">${pct(dict.ok, dict.words)} words</td><td><a class="btn small" href="#/dictation">Go</a></td></tr>
          <tr><td><b>5. Immerse</b><div class="muted small">20+ minutes of real ${LANG_NAME[l]}: a film, podcast or book. Mine the lines you nearly understand into <a href="#/add">My cards</a>.</div></td><td></td><td><a class="btn small" href="#/cinema">Cinema</a></td></tr>
        </tbody></table>
      </div>

      <h2>Progress by deck</h2>
      <div class="card">
        <table class="decks"><tbody>
        ${progress.map(d => `<tr><td style="width:38%"><b>${esc(d.name)}</b></td>
          <td><div class="bar"><div style="width:${100 * d.started / d.total}%"></div></div></td>
          <td class="small muted" style="width:150px;text-align:right">${d.started}/${d.total} started · ${d.solid} solid</td>
          <td style="width:70px;text-align:right"><a class="btn small" href="#/review?deck=${d.key}">Focus</a></td></tr>`).join('')}
        </tbody></table>
        <p class="muted small" style="margin-bottom:0">“Solid” = interval of 3+ weeks. “Focus” runs a session on one deck only. Turn decks on/off in <a href="#/settings">Settings</a>.</p>
      </div>

      <div class="card cinema-banner" style="margin-top:24px">
        <div class="section-head"><span class="kicker">Cinema</span></div>
        <h2 style="margin:4px 0 6px">The goal: ${l === 'fr' ? 'French New Wave' : 'Spanish-language classics'} in the original</h2>
        <p style="margin:0 0 10px">${nextFilm ? `Next on the ladder: <b>${esc(nextFilm.title)}</b> (${nextFilm.year}), listening difficulty ${'●'.repeat(nextFilm.difficulty)}${'○'.repeat(5 - nextFilm.difficulty)}.` : 'You\'ve worked through the whole ladder.'}</p>
        <div class="row"><a class="btn primary" href="#/cinema">Film ladder</a><a class="btn" href="#/subtitles">Subtitle prep</a><a class="btn" href="#/review?deck=cinema">Study film vocabulary</a></div>
      </div>
      <p class="muted small">Progress is stored in this browser. Back it up from <a href="#/settings">Settings</a>.</p>
    `;
    $$(el, '#intensity button').forEach(b => b.onclick = () => {
      const s2 = LL.settings();
      s2.newPerDay = +b.dataset.n;
      LL.saveSettings(s2);
      today(el);
    });
  }

  /* ---------------- Review ---------------- */
  function review(el, params) {
    const l = lang();
    const s = LL.settings();
    const { due, newCards } = LL.srs.buildSession(l, { extraNew: +params.extra || 0, deck: params.deck });
    // Interleave new cards between reviews.
    const queue = [];
    const n = newCards.slice();
    const d = due.slice();
    while (d.length || n.length) {
      for (let i = 0; i < 3 && d.length; i++) queue.push(d.shift());
      if (n.length) queue.push(n.shift());
    }
    const newIds = new Set(newCards.map(c => c.id));
    const total = queue.length;
    let done = 0, correct = 0, card, phase, result, typed;

    if (!total) {
      el.innerHTML = `<div class="card empty"><h2>Nothing due</h2><p class="muted">Come back later, or learn some extra cards now.</p>
        <div class="row" style="justify-content:center"><a class="btn primary" href="#/review?extra=10">Learn 10 more</a><a class="btn" href="#/conjugate">Conjugation drill</a><a class="btn" href="#/dictation">Dictation</a></div></div>`;
      return;
    }

    function next() {
      card = queue.shift();
      if (!card) return finish();
      phase = 'answer';
      result = null;
      typed = '';
      render();
      if (card.type === 'flip' || s.listenFirst) speak();
    }
    function speak(slow) { LL.speech.say(card.type === 'flip' ? card.front : card.full, l, { slow }); }

    function header() {
      return `<div class="progress"><div style="width:${100 * done / (done + queue.length + 1)}%"></div></div>
        <div class="row" style="margin-bottom:12px">
          <span class="deck-tag">${esc(card.deckName)}${newIds.has(card.id) ? ' · new' : ''}</span>
          <span class="spacer"></span>
          <span class="muted small">${queue.length + 1} left</span>
          <button class="icon-btn" id="play" title="Play audio">🔊</button>
          <button class="icon-btn" id="slow" title="Play slowly">🐢</button>
        </div>`;
    }
    function gradeButtons(def) {
      const labels = ['Again', 'Hard', 'Good', 'Easy'];
      return `<div class="grade-row">${labels.map((lb, i) =>
        `<button class="btn ${i === def ? 'primary' : ''}" data-grade="${i}">${lb} <kbd>${i + 1}</kbd></button>`).join('')}
        <span class="muted small" style="align-self:center">Enter = ${labels[def]}</span></div>`;
    }

    function render() {
      let body = '';
      if (card.type === 'cloze') {
        const hint = card.hint ? `<div class="hint">${esc(card.hint)}</div>` : '';
        if (phase === 'answer') {
          const w = Math.max(5, Math.max(...card.answers.map(a => a.length)) + 2);
          body = `<div class="sentence">${esc(card.before)}<input class="blank" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" style="width:${w * 0.62}em">${esc(card.after)}</div>
            <div class="translation">${esc(card.translation)}</div>${hint}
            ${accentBar(l)}
            <div class="row" style="margin-top:16px"><button class="btn primary" id="check">Check ↵</button><button class="btn" id="giveup">Show answer</button></div>`;
        } else {
          const cls = result === 'good' ? 'good' : result === 'accent' ? 'warn' : 'bad';
          const msg = result === 'good' ? 'Correct.' : result === 'accent' ? `Right word — check the accents. You typed “${esc(typed)}”.` : typed ? `You typed “${esc(typed)}”.` : 'Answer shown.';
          const def = result === 'good' ? 2 : result === 'accent' ? 1 : 0;
          body = `<div class="sentence">${esc(card.before)}<span class="answer ${cls}">${esc(card.answers[0])}</span>${esc(card.after)}</div>
            <div class="translation">${esc(card.translation)}</div>${hint}
            <div class="feedback ${cls}">${msg}${card.answers.length > 1 ? ` <span class="small">Also accepted: ${esc(card.answers.slice(1).join(', '))}</span>` : ''}</div>
            ${card.note ? `<div class="note">${esc(card.note)}</div>` : ''}
            ${gradeButtons(def)}
            ${result === 'bad' && typed ? `<button class="btn small" style="margin-top:8px" data-grade="2">I was right (typo / valid alternative)</button>` : ''}`;
        }
      } else {
        body = `<div class="flip-front">${esc(card.front)}</div>
          ${phase === 'answer'
            ? `<p class="muted small">What does it mean / how would it be written formally? Say it, then reveal.</p><button class="btn primary" id="reveal">Reveal (space)</button>`
            : `<div class="flip-back">${esc(card.back)}</div>${card.note ? `<div class="note">${esc(card.note)}</div>` : ''}${gradeButtons(2)}`}`;
      }
      el.innerHTML = `<div class="card review-card">${header()}${body}</div>`;
      $(el, '#play').onclick = () => speak();
      $(el, '#slow').onclick = () => speak(true);
      const inp = $(el, 'input.blank');
      if (inp) setTimeout(() => inp.focus(), 0);
      if ($(el, '#check')) $(el, '#check').onclick = check;
      if ($(el, '#giveup')) $(el, '#giveup').onclick = () => { typed = ''; result = 'bad'; reveal(); };
      if ($(el, '#reveal')) $(el, '#reveal').onclick = reveal;
      $$(el, '[data-grade]').forEach(b => b.onclick = () => grade(+b.dataset.grade));
    }
    function check() {
      const inp = $(el, 'input.blank');
      typed = inp.value.trim();
      result = LL.text.check(typed, card.answers);
      reveal();
    }
    function reveal() {
      phase = 'reveal';
      render();
      if (card.type === 'cloze' && s.autoplay) speak();
    }
    function grade(g) {
      LL.srs.answer(l, card, g);
      done++;
      if (g > 0) correct++;
      if (g === 0) queue.splice(Math.min(queue.length, 4), 0, card); // see it again this session
      next();
    }
    function finish() {
      LL.onKey = null;
      el.innerHTML = `<div class="card empty"><h2>Session complete</h2>
        <p>${done} reviews · ${Math.round(100 * correct / Math.max(1, done))}% recalled</p>
        <div class="row" style="justify-content:center"><a class="btn primary" href="#/conjugate">Conjugation drill →</a><a class="btn" href="#/dictation">Dictation</a><a class="btn" href="#/today">Home</a></div></div>`;
    }
    LL.onKey = e => {
      if (!card) return;
      if (phase === 'answer') {
        if (card.type === 'cloze' && e.key === 'Enter') { e.preventDefault(); check(); }
        else if (card.type === 'flip' && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); reveal(); }
      } else {
        if (e.key === 'Enter') { e.preventDefault(); const p = $(el, '.grade-row .btn.primary'); if (p) p.click(); }
        else if (/^[1-4]$/.test(e.key)) { e.preventDefault(); grade(+e.key - 1); }
        else if (e.key === 'r') speak();
      }
    };
    next();
  }

  /* ---------------- Conjugation ---------------- */
  function conjugate(el) {
    const l = lang();
    const C = LL.conj[l];
    const cfg = Object.assign({ tenses: C.TENSES.slice(0, 4).map(t => t.id), verbs: 'irregular', len: 20 }, LL.store.get('conjcfg:' + l, {}));
    const stats = LL.store.get('conjstats:' + l, {});

    function setup() {
      LL.onKey = e => { if (e.key === 'Enter') { e.preventDefault(); start(); } };
      el.innerHTML = `<div class="section-head"><span class="kicker">Train</span></div><h1>Conjugation drill</h1>
        <p class="lede">Type the verb form only (the pronoun is optional). Missed items come back at the end of the round.</p>
        <div class="card">
          <h3 style="margin-top:0">Tenses</h3>
          <div>${C.TENSES.map(t => {
            const st = stats[t.id];
            const pct = st && st.n ? Math.round(100 * st.ok / st.n) : null;
            return `<label class="check"><input type="checkbox" value="${t.id}" ${cfg.tenses.includes(t.id) ? 'checked' : ''}> ${t.name}${pct != null ? ` <span class="muted small">${pct}%</span>` : ''}</label>`;
          }).join('')}</div>
          <h3>Verbs</h3>
          <select id="verbs">
            <option value="irregular" ${cfg.verbs === 'irregular' ? 'selected' : ''}>Irregular / stem-changing (most useful)</option>
            <option value="regular" ${cfg.verbs === 'regular' ? 'selected' : ''}>Regular only</option>
            <option value="all" ${cfg.verbs === 'all' ? 'selected' : ''}>All ${C.verbs.length} verbs</option>
          </select>
          <select id="len">${[10, 20, 40].map(n => `<option ${cfg.len === n ? 'selected' : ''}>${n}</option>`).join('')}</select> questions
          <div class="row" style="margin-top:16px"><button class="btn primary" id="go">Start ↵</button></div>
          ${l === 'fr' ? `<p class="muted small">Tip: the passé simple barely exists in speech, but New Wave voice-over narration (e.g. <i>Jules et Jim</i>) uses it constantly — recognition is what matters.</p>` : ''}
        </div>
        <h2>Accuracy by tense</h2>
        <div class="card">${C.TENSES.map(t => {
          const st = stats[t.id] || { n: 0, ok: 0 };
          const pct = st.n ? Math.round(100 * st.ok / st.n) : 0;
          return `<div class="row small" style="margin:4px 0"><span style="width:170px">${t.name}</span><div class="bar" style="flex:1"><div style="width:${pct}%"></div></div><span style="width:90px;text-align:right" class="muted">${st.n ? pct + '% of ' + st.n : '—'}</span></div>`;
        }).join('')}</div>`;
      $(el, '#go').onclick = start;
    }
    function start() {
      cfg.tenses = $$(el, 'input[type=checkbox]:checked').map(i => i.value);
      cfg.verbs = $(el, '#verbs').value;
      cfg.len = +$(el, '#len').value;
      if (!cfg.tenses.length) return toast('Pick at least one tense');
      LL.store.set('conjcfg:' + l, cfg);
      const pool = C.verbs.filter(v => cfg.verbs === 'all' || (cfg.verbs === 'irregular') === v.irregular);
      const qs = [];
      for (let i = 0; i < cfg.len; i++) {
        const v = pool[Math.floor(Math.random() * pool.length)];
        const t = cfg.tenses[Math.floor(Math.random() * cfg.tenses.length)];
        qs.push({ v, t, p: Math.floor(Math.random() * 6) });
      }
      run(qs);
    }
    function run(qs) {
      let q, phase, ok, typed, score = 0, asked = 0;
      const total = qs.length;
      function next() {
        q = qs.shift();
        if (!q) return end();
        phase = 'ask';
        draw();
      }
      function promptPron() {
        const form = C.conjugate(q.v.inf, q.t)[q.p];
        let p = l === 'fr' ? C.pronoun(q.p, form) : C.pronoun(q.p);
        if (q.t === 'subj' || q.t === 'subji') p = (l === 'fr' && /^(il|elle|ils)/.test(p) ? "qu'" : 'que ') + p;
        return p;
      }
      function draw() {
        const tname = C.TENSES.find(t => t.id === q.t).name;
        const forms = C.conjugate(q.v.inf, q.t);
        let body = `<div class="progress"><div style="width:${100 * asked / (asked + qs.length + 1)}%"></div></div>
          <div class="conj-prompt"><span class="tense">${tname}</span><br>
          <span class="verb">${esc(q.v.inf)}</span> <span class="muted small">${esc(q.v.en)}</span><br>
          <span>${esc(promptPron())}</span> …</div>`;
        if (phase === 'ask') {
          body += `<input class="conj-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" style="margin-top:12px">${accentBar(l)}`;
        } else {
          const cls = ok === 'good' ? 'good' : ok === 'accent' ? 'warn' : 'bad';
          body += `<div class="feedback ${cls}">${ok === 'good' ? 'Correct' : ok === 'accent' ? 'Accent error' : 'Not quite'} — <b>${esc(forms[q.p])}</b>${ok !== 'good' && typed ? ` (you: ${esc(typed)})` : ''}</div>
            <table class="paradigm">${forms.map((f, i) => `<tr class="${i === q.p ? 'hl' : ''}"><td>${esc(l === 'fr' ? C.pronoun(i, f) : C.PRON[i])}</td><td>${esc(f)}</td></tr>`).join('')}</table>
            <p class="muted small">Enter for next</p>`;
        }
        el.innerHTML = `<div class="card review-card">${body}</div>`;
        const inp = $(el, '.conj-input');
        if (inp) setTimeout(() => inp.focus(), 0);
      }
      function check() {
        typed = $(el, '.conj-input').value.trim();
        ok = LL.text.check(C.stripPronoun(typed), C.accepted(q.v.inf, q.t, q.p));
        const st = stats[q.t] = stats[q.t] || { n: 0, ok: 0 };
        st.n++;
        if (ok !== 'bad') st.ok++;
        LL.store.set('conjstats:' + l, stats);
        asked++;
        if (ok === 'good') score++;
        else qs.push(Object.assign({}, q, { retry: true }));
        phase = 'show';
        draw();
        LL.speech.say(C.conjugate(q.v.inf, q.t)[q.p], l);
      }
      function end() {
        LL.onKey = e => { if (e.key === 'Enter') { e.preventDefault(); setup(); } };
        el.innerHTML = `<div class="card empty"><h2>Round done</h2><p>${score} first-try correct out of ${total}</p>
          <div class="row" style="justify-content:center"><button class="btn primary" id="again">Another round ↵</button><a class="btn" href="#/dictation">Dictation</a></div></div>`;
        $(el, '#again').onclick = setup;
      }
      LL.onKey = e => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        if (phase === 'ask') check(); else next();
      };
      next();
    }
    setup();
  }

  /* ---------------- Dictation ---------------- */
  function dictation(el) {
    const l = lang();
    const all = LL.srs.allCards(l).filter(c => c.type === 'cloze');
    const st = LL.srs.states(l);
    const learned = all.filter(c => st[c.id] && st[c.id].reps > 0);
    const dstats = LL.store.get('dictstats:' + l, { n: 0, words: 0, ok: 0 });
    let source = learned.length >= 10 ? 'learned' : 'all';
    let card, phase;

    function pick() {
      const pool = source === 'learned' && learned.length ? learned : all;
      card = pool[Math.floor(Math.random() * pool.length)];
      phase = 'ask';
      draw();
      play();
    }
    function play(slow) { LL.speech.say(card.full, l, { slow }); }
    function draw(res) {
      let body = `<div class="section-head"><span class="kicker">Train</span></div><h1>Dictation</h1>
        <p class="lede">Listen, then type exactly what you hear. Esc = replay, Shift+Esc = slow. ${dstats.n ? `<span class="small">Lifetime: ${Math.round(100 * dstats.ok / Math.max(1, dstats.words))}% of ${dstats.words} words.</span>` : ''}</p>
        <div class="card review-card">
          <div class="row" style="margin-bottom:12px">
            <select id="src"><option value="learned" ${source === 'learned' ? 'selected' : ''}>Sentences I've studied (${learned.length})</option><option value="all" ${source === 'all' ? 'selected' : ''}>All sentences (${all.length})</option></select>
            <span class="spacer"></span>
            <button class="btn" id="play">🔊 Replay</button><button class="btn" id="slow">🐢 Slow</button>
          </div>`;
      if (phase === 'ask') {
        body += `<textarea class="dict" rows="2" placeholder="Type what you hear…" autocomplete="off" autocapitalize="off" spellcheck="false" style="font-size:20px"></textarea>${accentBar(l)}
          <div class="row" style="margin-top:12px"><button class="btn primary" id="check">Check ↵</button><button class="btn" id="skip">Skip</button></div>`;
      } else {
        const pct = Math.round(100 * res.correct / Math.max(1, res.total));
        body += `<div class="diff sentence" style="font-size:22px">${res.parts.map(p => `<span class="${p.t}">${esc(p.w)}</span>`).join(' ')}</div>
          <div class="feedback ${pct === 100 ? 'good' : pct >= 70 ? 'warn' : 'bad'}">${pct}% — ${esc(card.full)}</div>
          <div class="translation">${esc(card.translation)}</div>
          <p class="muted small"><span class="diff"><span class="miss">struck</span></span> = extra/wrong word you typed · <span class="diff"><span class="fix">green</span></span> = missed word · <span class="diff"><span class="acc">amber</span></span> = accent slip. Enter for next.</p>`;
      }
      el.innerHTML = body + '</div>';
      $(el, '#src').onchange = e => { source = e.target.value; pick(); };
      $(el, '#play').onclick = () => play();
      $(el, '#slow').onclick = () => play(true);
      if ($(el, '#check')) $(el, '#check').onclick = check;
      if ($(el, '#skip')) $(el, '#skip').onclick = pick;
      const ta = $(el, 'textarea');
      if (ta) setTimeout(() => ta.focus(), 0);
    }
    function check() {
      const typed = $(el, 'textarea').value;
      const res = LL.text.diff(typed, card.full);
      dstats.n++;
      dstats.words += res.total;
      dstats.ok += res.correct;
      LL.store.set('dictstats:' + l, dstats);
      phase = 'show';
      draw(res);
    }
    LL.onKey = e => {
      if (e.key === 'Escape') { e.preventDefault(); play(e.shiftKey); return; }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (phase === 'ask') check(); else pick();
      }
    };
    if (!all.length) { el.innerHTML = '<p>No sentences loaded.</p>'; return; }
    pick();
  }

  /* ---------------- Subtitle prep ---------------- */
  const STOP = {
    fr: 'le la les un une des de du d au aux et ou mais donc or ni car que qui quoi dont où ce cet cette ces se sa son ses mon ma mes ton ta tes notre nos votre vos leur leurs je tu il elle on nous vous ils elles me te lui moi toi soi eux y en ne pas plus non oui si est suis es sommes êtes sont été être ai as a avons avez ont avoir à dans par pour sur sous avec sans chez vers comme bien très tout tous toute toutes rien c ça cela ceci là ici alors aussi encore déjà jamais toujours quand comment pourquoi qu l s j m t n fait faire va vais vas allez aller dit dire peut peux veux veut sais sait était avait oh ah eh hein bon ben bah allô merci monsieur madame mademoiselle quelque quelqu chose même autre autres peu beaucoup trop après avant maintenant',
    es: 'el la los las un una unos unas de del al y o pero que qué quien quién cual cuál cuyo donde dónde este esta estos estas ese esa esos esas eso esto aquel se su sus mi mis tu tus nuestro nuestra vuestro yo tú él ella usted nosotros vosotros ellos ellas ustedes me te le lo les nos os no sí si es son soy eres somos ser estar está están estoy he ha han hay había a en por para con sin sobre entre hasta desde como muy más menos todo todos toda todas nada ya también tampoco nunca siempre cuando cómo porque por qué bien mal aquí allí ahí ah oh eh bueno pues vale gracias señor señora señorita algo alguien otro otra otros poco mucho muchos ahora antes después tan tanto',
  };
  function subtitles(el) {
    const l = lang();
    const stop = new Set(STOP[l].split(' '));
    const ignored = new Set(LL.store.get('ignored:' + l, []));
    let page = 0;
    const PAGE = 30;
    let analysis = LL._subs && LL._subs.lang === l ? LL._subs : null;

    function parse(text) {
      return text.replace(/\r/g, '').split('\n')
        .filter(line => line.trim() && !/^\d+$/.test(line.trim()) && !/-->/.test(line))
        .map(line => line.replace(/<[^>]+>/g, '').replace(/\{[^}]+\}/g, '').replace(/^[-–—]\s*/, '').trim())
        .filter(Boolean);
    }
    function analyse(text) {
      const lines = parse(text);
      const freq = new Map(), ctx = new Map(), midCaps = new Map(), lower = new Set();
      let totalTok = 0;
      for (const line of lines) {
        const raw = line.match(/[A-Za-zÀ-ÖØ-öø-ÿŒœ]+/g) || [];
        raw.forEach((w, i) => {
          const lw = w.toLowerCase();
          if (!/^[A-ZÀ-ÖØ-Þ]/.test(w)) lower.add(lw);
          else if (i > 0) midCaps.set(lw, (midCaps.get(lw) || 0) + 1);
        });
        for (const t of LL.text.tokens(line, l)) {
          totalTok++;
          freq.set(t, (freq.get(t) || 0) + 1);
          if (!ctx.has(t) || (ctx.get(t).length > 90 && line.length < ctx.get(t).length)) ctx.set(t, line);
        }
      }
      analysis = { lang: l, lines: lines.length, totalTok, freq, ctx, midCaps, lower };
      LL._subs = analysis;
      page = 0;
      draw();
    }
    function draw() {
      let html = `<div class="section-head"><span class="kicker">Cinema</span></div><h1>Subtitle prep</h1>
        <p class="lede">Load a film's (or TV episode's) ${LANG_NAME[l]} subtitle file (.srt) before watching. You'll see the words you're likely not to know, most frequent first, each in a real line from the film. Learn the top ~50 and the film becomes far easier to follow.</p>
        <div class="card">
          <div class="row"><input type="file" id="file" accept=".srt,.vtt,.txt,.sub"><span class="muted small">or paste subtitle text:</span></div>
          <textarea id="paste" placeholder="Paste .srt contents here…" style="margin-top:8px"></textarea>
          <div class="row" style="margin-top:8px"><button class="btn primary" id="go">Analyse</button>
          <span class="muted small">Find subtitles on opensubtitles.org or subdl.com — pick the ${LANG_NAME[l]} track, not English.</span></div>
        </div>`;
      if (analysis) {
        const known = LL.srs.knownWords(l);
        const isKnown = w => stop.has(w) || known.has(w) || ignored.has(w);
        let knownTok = 0;
        const unknown = [];
        for (const [w, n] of analysis.freq) {
          // Never written in lowercase, and capitalised mid-line or frequent: almost certainly a name.
          const isName = !analysis.lower.has(w) && ((analysis.midCaps.get(w) || 0) > 0 || n >= 3);
          if (isKnown(w) || isName || w.length < 3) knownTok += n;
          else unknown.push([w, n]);
        }
        unknown.sort((a, b) => b[1] - a[1]);
        const coverage = Math.round(100 * knownTok / Math.max(1, analysis.totalTok));
        const shown = unknown.slice(page * PAGE, (page + 1) * PAGE);
        html += `<div class="grid">
            <div class="stat"><div class="num">${analysis.lines}</div><div class="lbl">subtitle lines</div></div>
            <div class="stat"><div class="num">${analysis.freq.size}</div><div class="lbl">distinct words</div></div>
            <div class="stat"><div class="num">${coverage}%</div><div class="lbl">of running words known*</div></div>
            <div class="stat"><div class="num">${unknown.length}</div><div class="lbl">words to triage</div></div>
          </div>
          <p class="muted small">*Known = common function words + answers you've learned + words you mark below. ~95% coverage is where films start to feel comfortable. Words that only ever appear capitalised are treated as names.</p>
          <div class="card">
            <div class="row"><b>Most frequent unknown words</b><span class="spacer"></span>
              <button class="btn small" id="allknown">Mark all ${shown.length} on this page as known</button>
              <button class="btn small" id="prev" ${page ? '' : 'disabled'}>←</button><span class="small muted">${page * PAGE + 1}–${page * PAGE + shown.length}</span><button class="btn small" id="nextp" ${(page + 1) * PAGE < unknown.length ? '' : 'disabled'}>→</button></div>
            <table class="words"><tbody>
            ${shown.map(([w, n]) => {
              const line = analysis.ctx.get(w) || '';
              const re = new RegExp('(^|[^\\p{L}])(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?![\\p{L}])', 'iu');
              const ctxHtml = esc(line).replace(re, '$1<b>$2</b>');
              return `<tr data-w="${esc(w)}"><td class="w">${esc(w)}<div class="muted small">×${n}</div></td>
                <td class="ctx">${ctxHtml}</td>
                <td style="white-space:nowrap"><button class="btn small" data-act="known">✓ Know</button>
                <button class="btn small" data-act="card">+ Card</button>
                <button class="btn small" data-act="say" title="Hear the line">🔊</button>
                <a class="btn small" target="_blank" rel="noopener" href="https://www.wordreference.com/${l === 'fr' ? 'fren' : 'esen'}/${encodeURIComponent(w)}">WR</a></td></tr>`;
            }).join('')}
            </tbody></table>
          </div>`;
      }
      el.innerHTML = html;
      $(el, '#file').onchange = e => {
        const f = e.target.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = () => {
          let txt = r.result;
          // Many French .srt files are Latin-1; re-read if UTF-8 decoding produced replacement chars.
          if (txt.includes('�')) {
            const r2 = new FileReader();
            r2.onload = () => analyse(r2.result);
            r2.readAsText(f, 'windows-1252');
          } else analyse(txt);
        };
        r.readAsText(f, 'utf-8');
      };
      $(el, '#go').onclick = () => { const t = $(el, '#paste').value; if (t.trim()) analyse(t); };
      if (!analysis) return;
      $(el, '#prev').onclick = () => { page--; draw(); };
      $(el, '#nextp').onclick = () => { page++; draw(); };
      $(el, '#allknown').onclick = () => {
        const words = $$(el, 'tr[data-w]').map(tr => tr.dataset.w);
        markKnown(words);
        draw();
      };
      $$(el, 'tr[data-w] [data-act]').forEach(b => b.onclick = () => {
        const tr = b.closest('tr'), w = tr.dataset.w, act = b.dataset.act;
        const line = analysis.ctx.get(w) || '';
        if (act === 'known') { markKnown([w]); tr.remove(); }
        else if (act === 'say') LL.speech.say(line, l);
        else if (act === 'card') cardForm(tr, w, line);
      });
    }
    function markKnown(words) {
      const k = new Set(LL.store.get('known:' + l, []));
      words.forEach(w => k.add(w));
      LL.store.set('known:' + l, Array.from(k));
    }
    function cardForm(tr, w, line) {
      const re = new RegExp('(^|[^\\p{L}])(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?![\\p{L}])', 'iu');
      const cloze = line.replace(re, '$1{$2}');
      const row = document.createElement('tr');
      row.innerHTML = `<td colspan="3"><div class="card" style="margin:6px 0">
        <div class="small muted">Sentence (the {braced} word becomes the blank — edit freely):</div>
        <input type="text" class="f-s" style="width:100%" value="${esc(cloze)}">
        <div class="small muted" style="margin-top:6px">English meaning of the line:</div>
        <div class="row"><input type="text" class="f-t" style="flex:1" placeholder="Translation">
        <a class="btn small" target="_blank" rel="noopener" href="https://www.deepl.com/translator#${l}/en/${encodeURIComponent(line)}">DeepL</a></div>
        <div class="small muted" style="margin-top:6px">Hint (e.g. dictionary form):</div>
        <input type="text" class="f-h" style="width:100%" placeholder="optional">
        <div class="row" style="margin-top:8px"><button class="btn primary small f-save">Save card</button><button class="btn small f-cancel">Cancel</button></div></div></td>`;
      tr.after(row);
      $(row, '.f-t').focus();
      $(row, '.f-cancel').onclick = () => row.remove();
      $(row, '.f-save').onclick = () => {
        const s = $(row, '.f-s').value.trim();
        if (!/\{[^}]+\}/.test(s)) return toast('Wrap the target word in {braces}');
        addCustom(l, 'cloze', [s, $(row, '.f-t').value.trim(), $(row, '.f-h').value.trim(), 'Mined from subtitles'].join('|'));
        ignored.add(w);
        LL.store.set('ignored:' + l, Array.from(ignored));
        row.remove();
        tr.remove();
        toast('Card added to “My cards”');
      };
    }
    draw();
  }

  function addCustom(l, type, raw) {
    const list = LL.store.get('custom:' + l, []);
    list.unshift({ type, raw: raw.replace(/\|+$/, '') });
    LL.store.set('custom:' + l, list);
  }

  /* ---------------- Cinema ---------------- */
  function cinema(el) {
    const l = lang();
    const F = LL.data[l].films;
    const watched = new Set(LL.store.get('watched:' + l, []));
    const vocab = LL.srs.deckProgress(l).find(d => d.key === 'cinema');
    el.innerHTML = `<div class="section-head"><span class="kicker">Cinema</span></div>
      <h1>${F.title}</h1>
      <p class="lede">${F.intro}</p>
      <div class="grid">
        <div class="stat"><div class="num">${F.list.filter(f => watched.has(f.title)).length}/${F.list.length}</div><div class="lbl">films watched</div></div>
        <div class="stat"><div class="num">${vocab ? vocab.started + '/' + vocab.total : '—'}</div><div class="lbl">film-vocab cards started</div></div>
        <a class="stat" href="#/subtitles" style="text-decoration:none;color:inherit"><div class="num">.srt →</div><div class="lbl">Subtitle prep for your next film</div></a>
        <a class="stat" href="#/review?deck=cinema" style="text-decoration:none;color:inherit"><div class="num">▶</div><div class="lbl">Study film vocabulary</div></a>
      </div>
      <h2>How to watch for learning</h2>
      <div class="card"><ol style="margin:0;padding-left:20px">${F.method.map(m => `<li style="margin-bottom:6px">${m}</li>`).join('')}</ol></div>
      <h2>The ladder: easiest first</h2>
      ${F.list.map((f, i) => `<div class="card film" style="${watched.has(f.title) ? 'opacity:.6' : ''}"><div class="rank">${i + 1}</div><div>
        <div class="row"><h3>${esc(f.title)} <span class="muted small">(${f.year})</span></h3><span class="spacer"></span>
          <label class="check small"><input type="checkbox" data-film="${esc(f.title)}" ${watched.has(f.title) ? 'checked' : ''}> watched</label></div>
        <div class="small muted">${esc(f.director)} · listening difficulty <span class="dots">${'●'.repeat(f.difficulty)}${'○'.repeat(5 - f.difficulty)}</span></div>
        <div style="margin:6px 0">${(f.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        <p style="margin:6px 0">${f.why}</p>
        ${f.tip ? `<p class="small" style="margin:0"><b>Tip:</b> ${f.tip}</p>` : ''}
      </div></div>`).join('')}
      ${F.footer ? `<p class="muted small">${F.footer}</p>` : ''}`;
    $$(el, '[data-film]').forEach(c => c.onchange = () => {
      const w = new Set(LL.store.get('watched:' + l, []));
      if (c.checked) w.add(c.dataset.film); else w.delete(c.dataset.film);
      LL.store.set('watched:' + l, Array.from(w));
      cinema(el);
    });
  }

  /* ---------------- Translate ---------------- */
  function translate(el) {
    const l = lang();
    const st = LL.srs.states(l);
    const all = LL.srs.allCards(l).filter(c => c.type === 'cloze' && c.translation);
    const studied = all.filter(c => st[c.id] && st[c.id].reps > 0);
    const stats = LL.store.get('transstats:' + l, { n: 0, words: 0, ok: 0 });
    let source = studied.length >= 10 ? 'studied' : 'all';
    let card, phase, showKey = false;

    function pick() {
      const pool = source === 'studied' && studied.length ? studied : all;
      card = pool[Math.floor(Math.random() * pool.length)];
      phase = 'ask';
      showKey = false;
      draw();
    }
    function draw(res) {
      const n = LL.text.words(card.full).length;
      let body = `<div class="section-head"><span class="kicker">Train</span></div><h1>Translate</h1>
        <p class="lede">Write the whole sentence in ${LANG_NAME[l]}. Producing language is far harder than recognising it, which is why this drill works. Other wordings can be right too, so judge your answer honestly against the model.
        ${stats.n ? `<span class="small">Lifetime: ${Math.round(100 * stats.ok / Math.max(1, stats.words))}% of ${stats.words} words over ${stats.n} sentences.</span>` : ''}</p>
        <div class="card review-card">
          <div class="row" style="margin-bottom:12px">
            <select id="src"><option value="studied" ${source === 'studied' ? 'selected' : ''}>Sentences I've studied (${studied.length})</option><option value="all" ${source === 'all' ? 'selected' : ''}>All sentences (${all.length})</option></select>
            <span class="spacer"></span><span class="deck-tag">${esc(card.deckName)}</span>
          </div>
          <div class="sentence">${esc(card.translation)}</div>
          <div class="hint">${n} words${card.hint ? ' · ' + esc(card.hint) : ''}</div>
          ${showKey || phase !== 'ask' ? `<div class="hint" style="margin-left:6px">key: ${esc(card.answers[0])}</div>` : ''}`;
      if (phase === 'ask') {
        body += `<textarea class="dict" rows="2" placeholder="Type it in ${LANG_NAME[l]}…" autocomplete="off" autocapitalize="off" spellcheck="false" style="font-size:20px;margin-top:14px"></textarea>${accentBar(l)}
          <div class="row" style="margin-top:12px"><button class="btn primary" id="check">Check ↵</button><button class="btn" id="key">Hint: key word</button><button class="btn" id="skip">Skip</button></div>`;
      } else {
        const pct = Math.round(100 * res.correct / Math.max(1, res.total));
        body += `<div class="diff sentence" style="font-size:22px;margin-top:14px">${res.parts.map(p => `<span class="${p.t}">${esc(p.w)}</span>`).join(' ')}</div>
          <div class="feedback ${pct === 100 ? 'good' : pct >= 70 ? 'warn' : 'bad'}">${pct}% match: <b>${esc(card.full)}</b></div>
          ${card.note ? `<div class="note">${esc(card.note)}</div>` : ''}
          <div class="row" style="margin-top:12px"><button class="btn" id="play">🔊 Hear it</button><button class="btn primary" id="next">Next ↵</button></div>
          <p class="muted small">Say the model sentence out loud twice before moving on.</p>`;
      }
      el.innerHTML = body + '</div>';
      $(el, '#src').onchange = e => { source = e.target.value; pick(); };
      if ($(el, '#check')) $(el, '#check').onclick = check;
      if ($(el, '#skip')) $(el, '#skip').onclick = pick;
      if ($(el, '#key')) $(el, '#key').onclick = () => { const v = $(el, 'textarea').value; showKey = true; draw(); $(el, 'textarea').value = v; };
      if ($(el, '#play')) $(el, '#play').onclick = () => LL.speech.say(card.full, l);
      if ($(el, '#next')) $(el, '#next').onclick = pick;
      const ta = $(el, 'textarea');
      if (ta) setTimeout(() => ta.focus(), 0);
    }
    function check() {
      const res = LL.text.diff($(el, 'textarea').value, card.full);
      stats.n++;
      stats.words += res.total;
      stats.ok += res.correct;
      LL.store.set('transstats:' + l, stats);
      phase = 'show';
      draw(res);
      LL.speech.say(card.full, l);
    }
    LL.onKey = e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (phase === 'ask') check(); else pick();
      }
    };
    if (!all.length) { el.innerHTML = '<p>No sentences loaded.</p>'; return; }
    pick();
  }

  /* ---------------- Grammar ---------------- */
  function grammar(el) {
    const l = lang();
    const G = LL.data[l].grammar;
    el.innerHTML = `<div class="section-head"><span class="kicker">Train</span></div><h1>Grammar refresher</h1>
      <p class="lede">${G.intro}</p>
      ${G.sections.map((s, i) => `<details class="gram" ${i === 0 ? 'open' : ''}><summary>${s.title}</summary>${s.html}</details>`).join('')}`;
    $$(el, '.ex').forEach(x => {
      x.style.cursor = 'pointer';
      x.title = 'Click to hear';
      x.onclick = () => LL.speech.say(x.childNodes[0].textContent, l);
    });
  }

  /* ---------------- Add card ---------------- */
  function add(el) {
    const l = lang();
    function draw() {
      const list = LL.store.get('custom:' + l, []);
      el.innerHTML = `<h1>My cards</h1>
        <p class="lede">The best cards are sentences <i>you</i> met yourself in a film, a book, a podcast or a conversation. Copy the line and blank out the word that tripped you up.</p>
        <div class="card">
          <label class="check"><input type="radio" name="type" value="cloze" checked> Fill-in-the-blank sentence</label>
          <label class="check"><input type="radio" name="type" value="flip"> Front/back (expressions)</label>
          <div id="clozeF">
            <div class="small muted" style="margin-top:10px">Sentence in ${LANG_NAME[l]}</div>
            <input type="text" id="s" style="width:100%" placeholder="${l === 'fr' ? 'Il faut que tu partes ce soir.' : 'Quiero que vengas mañana.'}">
            <div class="small muted" style="margin-top:8px">Word(s) to blank — or wrap them in {braces} in the sentence. Alternatives with /</div>
            <input type="text" id="w" style="width:100%" placeholder="${l === 'fr' ? 'partes' : 'vengas'}">
          </div>
          <div id="flipF" style="display:none">
            <div class="small muted" style="margin-top:10px">Front (${LANG_NAME[l]})</div><input type="text" id="front" style="width:100%">
            <div class="small muted" style="margin-top:8px">Back</div><input type="text" id="back" style="width:100%">
          </div>
          <div class="small muted" style="margin-top:8px">Translation / meaning</div>
          <input type="text" id="t" style="width:100%">
          <div class="small muted" style="margin-top:8px">Hint (optional, shown with the blank)</div>
          <input type="text" id="h" style="width:100%" placeholder="e.g. partir, subjonctif">
          ${accentBar(l)}
          <div class="row" style="margin-top:12px"><button class="btn primary" id="save">Add card</button></div>
        </div>
        <h2>My cards (${list.length})</h2>
        ${list.length ? `<div class="card"><table class="words"><tbody>${list.map((c, i) => `<tr><td class="ctx" style="color:var(--text)">${esc(c.raw.split('|')[0])}<div class="muted">${esc(c.raw.split('|')[1] || '')}</div></td><td><button class="btn small" data-del="${i}">Delete</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">None yet.</p>'}`;
      $$(el, 'input[name=type]').forEach(r => r.onchange = () => {
        const flip = $(el, 'input[name=type]:checked').value === 'flip';
        $(el, '#clozeF').style.display = flip ? 'none' : '';
        $(el, '#flipF').style.display = flip ? '' : 'none';
      });
      $(el, '#save').onclick = () => {
        const type = $(el, 'input[name=type]:checked').value;
        const t = $(el, '#t').value.trim(), h = $(el, '#h').value.trim();
        if (type === 'cloze') {
          let s = $(el, '#s').value.trim();
          const w = $(el, '#w').value.trim();
          if (!/\{[^}]+\}/.test(s)) {
            if (!w) return toast('Say which word to blank');
            const first = w.split('/')[0];
            const i = s.toLowerCase().indexOf(first.toLowerCase());
            if (i < 0) return toast('That word is not in the sentence');
            s = s.slice(0, i) + '{' + s.slice(i, i + first.length) + (w.includes('/') ? '/' + w.split('/').slice(1).join('/') : '') + '}' + s.slice(i + first.length);
          }
          addCustom(l, 'cloze', [s, t, h].join('|'));
        } else {
          const f = $(el, '#front').value.trim(), b = $(el, '#back').value.trim();
          if (!f || !b) return toast('Fill in both sides');
          addCustom(l, 'flip', [f, b + (t ? ' — ' + t : ''), h].join('|'));
        }
        toast('Added');
        draw();
      };
      $$(el, '[data-del]').forEach(b => b.onclick = () => {
        const list2 = LL.store.get('custom:' + l, []);
        list2.splice(+b.dataset.del, 1);
        LL.store.set('custom:' + l, list2);
        draw();
      });
    }
    draw();
  }

  /* ---------------- Settings ---------------- */
  function settings(el) {
    const l = lang();
    const s = LL.settings();
    const voices = LL.speech.voicesFor(l);
    const decks = LL.srs.decks(l);
    const cards = LL.srs.allCards(l);
    el.innerHTML = `<h1>Settings</h1>
      <div class="card">
        <h3 style="margin-top:0">Daily load</h3>
        <label>New cards per day <input type="number" id="npd" min="0" max="200" value="${s.newPerDay}" style="width:80px"></label>
        <p class="muted small">15 is steady, 30 is intensive, 50 is maximum. Daily review load grows to roughly 8–10× this number of cards after a few weeks.</p>
        <h3>Decks (${LANG_NAME[l]})</h3>
        ${Object.keys(decks).map(k => `<div><label class="check"><input type="checkbox" data-deck="${k}" ${s.decks[l][k] !== false ? 'checked' : ''}> <b>${esc(decks[k].name)}</b> <span class="muted small">— ${cards.filter(c => c.deck === k).length} cards. ${esc(decks[k].desc || '')}</span></label></div>`).join('')}
        <h3>Audio</h3>
        <div class="row">Voice <select id="voice"><option value="">Auto</option>${voices.map(v => `<option ${s.voice[l] === v.name ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select>
          Speed <input type="range" id="rate" min="0.6" max="1.4" step="0.05" value="${s.rate}"> <span id="rateV">${s.rate}×</span>
          <button class="btn small" id="test">Test</button></div>
        ${voices.length ? '' : `<p class="small" style="color:var(--warn)">No ${LANG_NAME[l]} voice found. On macOS: System Settings → Accessibility → Spoken Content → System voice → Manage Voices, and add a ${LANG_NAME[l]} voice (the “Enhanced/Premium” ones are much better).</p>`}
        <p class="muted small">Tip: download an Enhanced/Premium voice for much more natural audio.</p>
        <label class="check"><input type="checkbox" id="autoplay" ${s.autoplay ? 'checked' : ''}> Play the sentence after answering</label><br>
        <label class="check"><input type="checkbox" id="listen" ${s.listenFirst ? 'checked' : ''}> Listening mode: play the sentence <i>before</i> answering (harder on the ear, easier on recall)</label>
        <div class="row" style="margin-top:14px"><button class="btn primary" id="save">Save</button></div>
      </div>
      <div class="card">
        <h3 style="margin-top:0">Backup</h3>
        <p class="muted small">All progress lives in this browser's storage. Export regularly, or to move to another device.</p>
        <div class="row"><button class="btn" id="exp">Export progress</button>
        <label class="btn">Import… <input type="file" id="imp" accept=".json" style="display:none"></label>
        <span class="spacer"></span><button class="btn" id="reset" style="color:var(--bad)">Reset everything</button></div>
      </div>`;
    $(el, '#rate').oninput = e => { $(el, '#rateV').textContent = e.target.value + '×'; };
    function collect() {
      s.newPerDay = Math.max(0, +$(el, '#npd').value || 0);
      s.voice[l] = $(el, '#voice').value;
      s.rate = +$(el, '#rate').value;
      s.autoplay = $(el, '#autoplay').checked;
      s.listenFirst = $(el, '#listen').checked;
      $$(el, '[data-deck]').forEach(c => { s.decks[l][c.dataset.deck] = c.checked; });
      LL.saveSettings(s);
    }
    $(el, '#test').onclick = () => { collect(); LL.speech.say(l === 'fr' ? "Bonjour ! On va au cinéma ce soir, ça te dit ?" : '¡Hola! ¿Vamos al cine esta noche?', l); };
    $(el, '#save').onclick = () => { collect(); toast('Saved'); };
    $(el, '#exp').onclick = () => {
      const blob = new Blob([JSON.stringify(LL.store.exportAll(), null, 1)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'cinelangue-backup-' + LL.today() + '.json';
      a.click();
    };
    $(el, '#imp').onchange = e => {
      const f = e.target.files[0];
      if (!f) return;
      f.text().then(t => { LL.store.importAll(JSON.parse(t)); toast('Imported'); location.reload(); }).catch(() => toast('Could not read that file'));
    };
    $(el, '#reset').onclick = () => {
      if (confirm('Delete ALL progress for both languages? Export first if unsure.')) { LL.store.clearAll(); location.reload(); }
    };
  }

  return { today, review, translate, conjugate, dictation, subtitles, cinema, films: cinema, grammar, add, settings };
})();
