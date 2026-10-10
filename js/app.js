// Hash router + language switcher.
(function () {
  const app = document.getElementById('app');

  function route() {
    const hash = location.hash.replace(/^#\/?/, '') || 'today';
    const [name, query] = hash.split('?');
    const params = Object.fromEntries(new URLSearchParams(query || ''));
    const view = LL.views[name] || LL.views.today;
    LL.onKey = null;
    LL.speech.stop();
    document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#/' + name));
    document.documentElement.lang = LL.settings().lang;
    view(app, params);
    window.scrollTo(0, 0);
  }

  function drawLang() {
    const l = LL.settings().lang;
    document.querySelectorAll('#langSwitch button').forEach(b => b.classList.toggle('active', b.dataset.lang === l));
  }
  document.getElementById('langSwitch').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    const s = LL.settings();
    s.lang = b.dataset.lang;
    LL.saveSettings(s);
    drawLang();
    route();
  });

  document.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    // Number keys inside a text box are typing, not grading.
    if (/^[1-4r ]$/.test(e.key) && e.target.matches('input[type=text], textarea')) return;
    if (LL.onKey) LL.onKey(e);
  });

  window.addEventListener('hashchange', route);
  drawLang();
  route();
})();
