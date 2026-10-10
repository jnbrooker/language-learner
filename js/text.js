// Text helpers: answer normalisation, comparison, tokenising, diffing.
LL.text = (function () {
  function stripAccents(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').replace(/æ/g, 'ae');
  }
  function norm(s) {
    return (s || '')
      .replace(/[’‘`´]/g, "'")
      .replace(/ /g, ' ')
      .toLowerCase()
      .replace(/[.!?¡¿,;:«»"“”]/g, '')
      .replace(/\s*'\s*/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }
  // Returns 'good' | 'accent' | 'bad'
  function check(input, answers) {
    const n = norm(input);
    if (!n) return 'bad';
    for (const a of answers) if (norm(a) === n) return 'good';
    const na = stripAccents(n);
    for (const a of answers) if (stripAccents(norm(a)) === na) return 'accent';
    return 'bad';
  }
  function hash(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }
  function escape(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  // Words for dictation comparison (keeps apostrophe-joined chunks together).
  function words(s) {
    return norm(s).replace(/-/g, ' ').split(' ').filter(Boolean);
  }
  // LCS-based word diff. Returns [{t:'ok'|'miss'|'fix'|'acc', w}]
  function diff(typed, target) {
    const a = words(typed), b = words(target);
    const m = a.length, n = b.length;
    const eq = (x, y) => stripAccents(x) === stripAccents(y);
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = m - 1; i >= 0; i--)
      for (let j = n - 1; j >= 0; j--)
        dp[i][j] = eq(a[i], b[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const out = [];
    let i = 0, j = 0;
    while (i < m && j < n) {
      if (eq(a[i], b[j])) { out.push({ t: a[i] === b[j] ? 'ok' : 'acc', w: b[j], typed: a[i] }); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ t: 'miss', w: a[i] }); i++; }
      else { out.push({ t: 'fix', w: b[j] }); j++; }
    }
    while (i < m) out.push({ t: 'miss', w: a[i++] });
    while (j < n) out.push({ t: 'fix', w: b[j++] });
    const correct = out.filter(o => o.t === 'ok').length;
    return { parts: out, correct, total: n };
  }
  // Tokenise running text into lowercase word forms (for subtitle analysis).
  function tokens(s, lang) {
    const t = s.toLowerCase().replace(/[’‘]/g, "'");
    const raw = t.match(/[a-zà-öø-ÿœæ'-]+/gi) || [];
    const out = [];
    for (let w of raw) {
      w = w.replace(/^[-']+|[-']+$/g, '');
      if (lang === 'fr') {
        // l'homme -> homme, qu'il -> il, aujourd'hui stays whole
        if (w !== "aujourd'hui" && w.includes("'")) w = w.split("'").pop();
        // dis-moi -> dis, moi
        for (const p of w.split('-')) if (p.length > 1) out.push(p);
      } else {
        for (const p of w.split('-')) if (p.length > 1) out.push(p);
      }
    }
    return out;
  }
  return { norm, check, stripAccents, hash, escape, words, diff, tokens };
})();
