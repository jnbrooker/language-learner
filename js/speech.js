// Text-to-speech using the browser's built-in voices (macOS has good fr/es voices).
LL.speech = (function () {
  let voices = [];
  function load() { voices = window.speechSynthesis ? speechSynthesis.getVoices() : []; }
  if (window.speechSynthesis) {
    load();
    speechSynthesis.onvoiceschanged = load;
  }
  const LOCALES = { fr: ['fr-FR', 'fr-CA', 'fr'], es: ['es-ES', 'es-MX', 'es-US', 'es'] };
  function voicesFor(lang) {
    load();
    return voices.filter(v => v.lang && v.lang.toLowerCase().startsWith(lang));
  }
  function pick(lang) {
    const s = LL.settings();
    const list = voicesFor(lang);
    const chosen = list.find(v => v.name === (s.voice || {})[lang]);
    if (chosen) return chosen;
    for (const loc of LOCALES[lang]) {
      // Prefer enhanced/premium voices when present.
      const good = list.find(v => v.lang === loc && /premium|enhanced|amélie|thomas|monica|jorge|marisol/i.test(v.name));
      if (good) return good;
      const any = list.find(v => v.lang === loc);
      if (any) return any;
    }
    return list[0] || null;
  }
  function say(text, lang, opts) {
    if (!window.speechSynthesis) return;
    opts = opts || {};
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pick(lang);
    if (v) u.voice = v;
    u.lang = v ? v.lang : LOCALES[lang][0];
    u.rate = (opts.rate || LL.settings().rate || 1) * (opts.slow ? 0.7 : 1);
    if (opts.onend) u.onend = opts.onend;
    speechSynthesis.speak(u);
  }
  function available() { return !!window.speechSynthesis; }
  return { say, voicesFor, available, stop: () => window.speechSynthesis && speechSynthesis.cancel() };
})();
