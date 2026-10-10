// Spanish conjugation engine: regular endings, stem changes, spelling changes, irregular overrides.
LL.conj = LL.conj || {};
LL.conj.es = (function () {
  const PRON = ['yo', 'tú', 'él/ella/usted', 'nosotros', 'vosotros', 'ellos/ustedes'];
  const TENSES = [
    { id: 'pres', name: 'presente' },
    { id: 'pret', name: 'pretérito indefinido' },
    { id: 'impf', name: 'imperfecto' },
    { id: 'perf', name: 'pretérito perfecto' },
    { id: 'fut', name: 'futuro' },
    { id: 'cond', name: 'condicional' },
    { id: 'subj', name: 'subjuntivo presente' },
    { id: 'subji', name: 'subjuntivo imperfecto' },
  ];
  const S = s => s.split(' ');

  // sc: stem change (e>ie, o>ue, e>i, u>ue). pres/pret/impf/subj: full overrides.
  // yo: irregular yo form (subjunctive builds on it for all persons). fut: future stem. pp: participle.
  const VERBS = {
    'ser': { en: 'to be', pres: 'soy eres es somos sois son', pret: 'fui fuiste fue fuimos fuisteis fueron', impf: 'era eras era éramos erais eran', subj: 'sea seas sea seamos seáis sean' },
    'estar': { en: 'to be (state/location)', pres: 'estoy estás está estamos estáis están', pret: 'estuve estuviste estuvo estuvimos estuvisteis estuvieron', subj: 'esté estés esté estemos estéis estén' },
    'ir': { en: 'to go', pres: 'voy vas va vamos vais van', pret: 'fui fuiste fue fuimos fuisteis fueron', impf: 'iba ibas iba íbamos ibais iban', subj: 'vaya vayas vaya vayamos vayáis vayan' },
    'haber': { en: 'to have (aux)', pres: 'he has ha hemos habéis han', pret: 'hube hubiste hubo hubimos hubisteis hubieron', fut: 'habr', subj: 'haya hayas haya hayamos hayáis hayan' },
    'tener': { en: 'to have', sc: 'e>ie', yo: 'tengo', pret: 'tuve tuviste tuvo tuvimos tuvisteis tuvieron', fut: 'tendr' },
    'hacer': { en: 'to do/make', yo: 'hago', pret: 'hice hiciste hizo hicimos hicisteis hicieron', fut: 'har', pp: 'hecho' },
    'poder': { en: 'to be able', sc: 'o>ue', pret: 'pude pudiste pudo pudimos pudisteis pudieron', fut: 'podr' },
    'querer': { en: 'to want/love', sc: 'e>ie', pret: 'quise quisiste quiso quisimos quisisteis quisieron', fut: 'querr' },
    'decir': { en: 'to say', pres: 'digo dices dice decimos decís dicen', yo: 'digo', pret: 'dije dijiste dijo dijimos dijisteis dijeron', fut: 'dir', pp: 'dicho' },
    'venir': { en: 'to come', sc: 'e>ie', yo: 'vengo', pret: 'vine viniste vino vinimos vinisteis vinieron', fut: 'vendr' },
    'poner': { en: 'to put', yo: 'pongo', pret: 'puse pusiste puso pusimos pusisteis pusieron', fut: 'pondr', pp: 'puesto' },
    'saber': { en: 'to know', yo: 'sé', pret: 'supe supiste supo supimos supisteis supieron', fut: 'sabr', subj: 'sepa sepas sepa sepamos sepáis sepan' },
    'dar': { en: 'to give', pres: 'doy das da damos dais dan', pret: 'di diste dio dimos disteis dieron', subj: 'dé des dé demos deis den' },
    'ver': { en: 'to see', pres: 'veo ves ve vemos veis ven', yo: 'veo', pret: 'vi viste vio vimos visteis vieron', impf: 'veía veías veía veíamos veíais veían', pp: 'visto' },
    'salir': { en: 'to go out', yo: 'salgo', fut: 'saldr' },
    'traer': { en: 'to bring', yo: 'traigo', pret: 'traje trajiste trajo trajimos trajisteis trajeron' },
    'oír': { en: 'to hear', pres: 'oigo oyes oye oímos oís oyen', yo: 'oigo', pret: 'oí oíste oyó oímos oísteis oyeron', pp: 'oído' },
    'conocer': { en: 'to know (person/place)', yo: 'conozco' },
    'conducir': { en: 'to drive', yo: 'conduzco', pret: 'conduje condujiste condujo condujimos condujisteis condujeron' },
    'leer': { en: 'to read', pret: 'leí leíste leyó leímos leísteis leyeron', pp: 'leído' },
    'creer': { en: 'to believe', pret: 'creí creíste creyó creímos creísteis creyeron', pp: 'creído' },
    'seguir': { en: 'to follow/continue', sc: 'e>i', yo: 'sigo' },
    'pedir': { en: 'to ask for', sc: 'e>i' },
    'dormir': { en: 'to sleep', sc: 'o>ue' },
    'morir': { en: 'to die', sc: 'o>ue', pp: 'muerto' },
    'sentir': { en: 'to feel', sc: 'e>ie' },
    'preferir': { en: 'to prefer', sc: 'e>ie' },
    'pensar': { en: 'to think', sc: 'e>ie' },
    'empezar': { en: 'to begin', sc: 'e>ie' },
    'cerrar': { en: 'to close', sc: 'e>ie' },
    'entender': { en: 'to understand', sc: 'e>ie' },
    'perder': { en: 'to lose', sc: 'e>ie' },
    'volver': { en: 'to return', sc: 'o>ue', pp: 'vuelto' },
    'encontrar': { en: 'to find', sc: 'o>ue' },
    'recordar': { en: 'to remember', sc: 'o>ue' },
    'contar': { en: 'to tell/count', sc: 'o>ue' },
    'jugar': { en: 'to play', sc: 'u>ue' },
    'hablar': { en: 'to speak' }, 'trabajar': { en: 'to work' }, 'mirar': { en: 'to look at' },
    'tomar': { en: 'to take/drink' }, 'llamar': { en: 'to call' }, 'esperar': { en: 'to wait/hope' },
    'llevar': { en: 'to carry/wear' }, 'dejar': { en: 'to leave/let' }, 'pasar': { en: 'to pass/happen' },
    'quedar': { en: 'to remain/meet' }, 'necesitar': { en: 'to need' }, 'buscar': { en: 'to look for' },
    'llegar': { en: 'to arrive' }, 'pagar': { en: 'to pay' }, 'tocar': { en: 'to touch/play' },
    'comer': { en: 'to eat' }, 'beber': { en: 'to drink' }, 'aprender': { en: 'to learn' },
    'comprender': { en: 'to understand' }, 'vender': { en: 'to sell' }, 'deber': { en: 'to owe/must' },
    'vivir': { en: 'to live' }, 'escribir': { en: 'to write', pp: 'escrito' }, 'abrir': { en: 'to open', pp: 'abierto' },
    'recibir': { en: 'to receive' }, 'decidir': { en: 'to decide' }, 'subir': { en: 'to go up' },
    'romper': { en: 'to break', pp: 'roto' },
  };
  const IRREG = new Set(['ser', 'estar', 'ir', 'haber', 'tener', 'hacer', 'poder', 'querer', 'decir', 'venir', 'poner', 'saber', 'dar', 'ver', 'salir', 'traer', 'oír', 'conocer', 'conducir', 'leer', 'creer', 'seguir', 'morir', 'volver', 'escribir', 'abrir', 'romper']);

  const ACC = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' };
  const deaccent = s => s.normalize('NFD').replace(/[́]/g, '').normalize('NFC');
  const cls = inf => deaccent(inf).slice(-2); // ar | er | ir
  const stemOf = inf => deaccent(inf).slice(0, -2);

  // Apply the stem change to the last matching vowel of the stem.
  function changeStem(stem, sc, weak) {
    if (!sc) return stem;
    let [from, to] = sc.split('>');
    if (weak) to = from === 'e' ? 'i' : 'u'; // -ir weak change (sintió, durmió, pidamos)
    const i = stem.lastIndexOf(from);
    if (i < 0) return stem;
    return stem.slice(0, i) + to + stem.slice(i + from.length);
  }
  // Spelling changes before e: busc-é → busqu-é, lleg-é → llegu-é, empez-é → empec-é.
  function ortho(stem, ending) {
    if (/^[eé]/.test(ending)) {
      if (stem.endsWith('c')) return stem.slice(0, -1) + 'qu';
      if (stem.endsWith('g') && !stem.endsWith('gu')) return stem + 'u';
      if (stem.endsWith('z')) return stem.slice(0, -1) + 'c';
    }
    return stem;
  }

  function present(inf) {
    const v = VERBS[inf] || {};
    if (v.pres) return S(v.pres);
    const c = cls(inf), st = stemOf(inf);
    const end = c === 'ar' ? S('o as a amos áis an') : c === 'er' ? S('o es e emos éis en') : S('o es e imos ís en');
    const out = end.map((e, i) => (i === 3 || i === 4 ? st : changeStem(st, v.sc)) + e);
    if (v.yo) out[0] = v.yo;
    return out;
  }
  function preterite(inf) {
    const v = VERBS[inf] || {};
    if (v.pret) return S(v.pret);
    const c = cls(inf), st = stemOf(inf);
    const end = c === 'ar' ? S('é aste ó amos asteis aron') : S('í iste ió imos isteis ieron');
    return end.map((e, i) => {
      let s = st;
      if (c === 'ir' && v.sc && (i === 2 || i === 5)) s = changeStem(st, v.sc, true);
      if (c === 'ar' && i === 0) s = ortho(s, e);
      return s + e;
    });
  }
  function imperfect(inf) {
    const v = VERBS[inf] || {};
    if (v.impf) return S(v.impf);
    const c = cls(inf), st = stemOf(inf);
    const end = c === 'ar' ? S('aba abas aba ábamos abais aban') : S('ía ías ía íamos íais ían');
    return end.map(e => st + e);
  }
  const futStem = inf => (VERBS[inf] && VERBS[inf].fut) || deaccent(inf);
  const future = inf => S('é ás á emos éis án').map(e => futStem(inf) + e);
  const conditional = inf => S('ía ías ía íamos íais ían').map(e => futStem(inf) + e);
  function subjunctive(inf) {
    const v = VERBS[inf] || {};
    if (v.subj) return S(v.subj);
    const c = cls(inf), st = stemOf(inf);
    const end = c === 'ar' ? S('e es e emos éis en') : S('a as a amos áis an');
    return end.map((e, i) => {
      let s;
      if (v.yo) s = v.yo.replace(/o$/, '');
      else if (i === 3 || i === 4) s = c === 'ir' && v.sc ? changeStem(st, v.sc, true) : st;
      else s = changeStem(st, v.sc);
      return ortho(s, e) + e;
    });
  }
  function subjImperfect(inf) {
    const base = preterite(inf)[5].replace(/ron$/, '');
    return S('ra ras ra ramos rais ran').map((e, i) => {
      if (i === 3) return base.slice(0, -1) + ACC[base.slice(-1)] + e;
      return base + e;
    });
  }
  function participle(inf) {
    const v = VERBS[inf] || {};
    if (v.pp) return v.pp;
    return stemOf(inf) + (cls(inf) === 'ar' ? 'ado' : 'ido');
  }
  const perfect = inf => S('he has ha hemos habéis han').map(h => h + ' ' + participle(inf));

  function conjugate(inf, tense) {
    switch (tense) {
      case 'pres': return present(inf);
      case 'pret': return preterite(inf);
      case 'impf': return imperfect(inf);
      case 'perf': return perfect(inf);
      case 'fut': return future(inf);
      case 'cond': return conditional(inf);
      case 'subj': return subjunctive(inf);
      case 'subji': return subjImperfect(inf);
    }
  }
  const accepted = (inf, tense, person) => [conjugate(inf, tense)[person]];
  const pronoun = person => PRON[person];
  const stripPronoun = ans => ans.replace(/^\s*(yo |tú |tu |él |el |ella |usted |nosotros |nosotras |vosotros |vosotras |ellos |ellas |ustedes |que )/i, '');

  const verbs = Object.keys(VERBS).map(inf => ({
    inf, en: VERBS[inf].en,
    irregular: IRREG.has(inf) || !!VERBS[inf].sc,
  }));

  return { PRON, TENSES, verbs, conjugate, accepted, pronoun, stripPronoun, pp: participle };
})();
