// French conjugation engine: regular patterns + table of common irregulars.
LL.conj = LL.conj || {};
LL.conj.fr = (function () {
  const PRON = ['je', 'tu', 'il/elle', 'nous', 'vous', 'ils/elles'];
  const TENSES = [
    { id: 'pres', name: 'présent' },
    { id: 'pc', name: 'passé composé' },
    { id: 'impf', name: 'imparfait' },
    { id: 'pqp', name: 'plus-que-parfait' },
    { id: 'fut', name: 'futur simple' },
    { id: 'cond', name: 'conditionnel' },
    { id: 'subj', name: 'subjonctif présent' },
    { id: 'ps', name: 'passé simple' },
  ];

  // Irregular data. pres: 6 forms; pp; aux; fut: future stem; subj: 6 forms (optional, else derived);
  // ps: [stem, type] where type is 'a' (-er), 'i', 'u' or 'in'; impf: stem override.
  const IRR = {
    'être': { en: 'to be', pres: 'suis es est sommes êtes sont', pp: 'été', fut: 'ser', subj: 'sois sois soit soyons soyez soient', ps: ['f', 'u'], impf: 'ét' },
    'avoir': { en: 'to have', pres: 'ai as a avons avez ont', pp: 'eu', fut: 'aur', subj: 'aie aies ait ayons ayez aient', ps: ['e', 'u'] },
    'aller': { en: 'to go', pres: 'vais vas va allons allez vont', pp: 'allé', aux: 'être', fut: 'ir', subj: 'aille ailles aille allions alliez aillent', ps: ['all', 'a'] },
    'faire': { en: 'to do/make', pres: 'fais fais fait faisons faites font', pp: 'fait', fut: 'fer', subj: 'fasse fasses fasse fassions fassiez fassent', ps: ['f', 'i'] },
    'dire': { en: 'to say', pres: 'dis dis dit disons dites disent', pp: 'dit', fut: 'dir', ps: ['d', 'i'] },
    'pouvoir': { en: 'to be able', pres: 'peux peux peut pouvons pouvez peuvent', pp: 'pu', fut: 'pourr', subj: 'puisse puisses puisse puissions puissiez puissent', ps: ['p', 'u'] },
    'vouloir': { en: 'to want', pres: 'veux veux veut voulons voulez veulent', pp: 'voulu', fut: 'voudr', subj: 'veuille veuilles veuille voulions vouliez veuillent', ps: ['voul', 'u'] },
    'savoir': { en: 'to know', pres: 'sais sais sait savons savez savent', pp: 'su', fut: 'saur', subj: 'sache saches sache sachions sachiez sachent', ps: ['s', 'u'] },
    'devoir': { en: 'to have to / owe', pres: 'dois dois doit devons devez doivent', pp: 'dû', fut: 'devr', ps: ['d', 'u'] },
    'venir': { en: 'to come', pres: 'viens viens vient venons venez viennent', pp: 'venu', aux: 'être', fut: 'viendr', ps: ['v', 'in'] },
    'devenir': { en: 'to become', pres: 'deviens deviens devient devenons devenez deviennent', pp: 'devenu', aux: 'être', fut: 'deviendr', ps: ['dev', 'in'] },
    'revenir': { en: 'to come back', pres: 'reviens reviens revient revenons revenez reviennent', pp: 'revenu', aux: 'être', fut: 'reviendr', ps: ['rev', 'in'] },
    'tenir': { en: 'to hold', pres: 'tiens tiens tient tenons tenez tiennent', pp: 'tenu', fut: 'tiendr', ps: ['t', 'in'] },
    'voir': { en: 'to see', pres: 'vois vois voit voyons voyez voient', pp: 'vu', fut: 'verr', ps: ['v', 'i'] },
    'prendre': { en: 'to take', pres: 'prends prends prend prenons prenez prennent', pp: 'pris', fut: 'prendr', ps: ['pr', 'i'] },
    'comprendre': { en: 'to understand', pres: 'comprends comprends comprend comprenons comprenez comprennent', pp: 'compris', fut: 'comprendr', ps: ['compr', 'i'] },
    'apprendre': { en: 'to learn', pres: 'apprends apprends apprend apprenons apprenez apprennent', pp: 'appris', fut: 'apprendr', ps: ['appr', 'i'] },
    'mettre': { en: 'to put', pres: 'mets mets met mettons mettez mettent', pp: 'mis', fut: 'mettr', ps: ['m', 'i'] },
    'partir': { en: 'to leave', pres: 'pars pars part partons partez partent', pp: 'parti', aux: 'être', ps: ['part', 'i'] },
    'sortir': { en: 'to go out', pres: 'sors sors sort sortons sortez sortent', pp: 'sorti', aux: 'être', ps: ['sort', 'i'] },
    'dormir': { en: 'to sleep', pres: 'dors dors dort dormons dormez dorment', pp: 'dormi', ps: ['dorm', 'i'] },
    'sentir': { en: 'to feel/smell', pres: 'sens sens sent sentons sentez sentent', pp: 'senti', ps: ['sent', 'i'] },
    'croire': { en: 'to believe', pres: 'crois crois croit croyons croyez croient', pp: 'cru', fut: 'croir', ps: ['cr', 'u'] },
    'connaître': { en: 'to know (person/place)', pres: 'connais connais connaît connaissons connaissez connaissent', pp: 'connu', fut: 'connaîtr', ps: ['conn', 'u'] },
    'vivre': { en: 'to live', pres: 'vis vis vit vivons vivez vivent', pp: 'vécu', fut: 'vivr', ps: ['véc', 'u'] },
    'écrire': { en: 'to write', pres: 'écris écris écrit écrivons écrivez écrivent', pp: 'écrit', fut: 'écrir', ps: ['écriv', 'i'] },
    'lire': { en: 'to read', pres: 'lis lis lit lisons lisez lisent', pp: 'lu', fut: 'lir', ps: ['l', 'u'] },
    'boire': { en: 'to drink', pres: 'bois bois boit buvons buvez boivent', pp: 'bu', fut: 'boir', ps: ['b', 'u'] },
    'ouvrir': { en: 'to open', pres: 'ouvre ouvres ouvre ouvrons ouvrez ouvrent', pp: 'ouvert', ps: ['ouvr', 'i'] },
    'mourir': { en: 'to die', pres: 'meurs meurs meurt mourons mourez meurent', pp: 'mort', aux: 'être', fut: 'mourr', ps: ['mour', 'u'] },
    'naître': { en: 'to be born', pres: 'nais nais naît naissons naissez naissent', pp: 'né', aux: 'être', fut: 'naîtr', ps: ['naqu', 'i'] },
    'recevoir': { en: 'to receive', pres: 'reçois reçois reçoit recevons recevez reçoivent', pp: 'reçu', fut: 'recevr', ps: ['reç', 'u'] },
    'suivre': { en: 'to follow', pres: 'suis suis suit suivons suivez suivent', pp: 'suivi', fut: 'suivr', ps: ['suiv', 'i'] },
    'courir': { en: 'to run', pres: 'cours cours court courons courez courent', pp: 'couru', fut: 'courr', ps: ['cour', 'u'] },
    'plaire': { en: 'to please', pres: 'plais plais plaît plaisons plaisez plaisent', pp: 'plu', fut: 'plair', ps: ['pl', 'u'] },
  };

  const REG = {
    'parler': 'to speak', 'aimer': 'to love/like', 'regarder': 'to watch', 'chercher': 'to look for',
    'trouver': 'to find', 'penser': 'to think', 'demander': 'to ask', 'laisser': 'to leave/let',
    'passer': 'to pass/spend', 'rester': 'to stay', 'arriver': 'to arrive/happen', 'tomber': 'to fall',
    'entrer': 'to enter', 'rentrer': 'to go home', 'oublier': 'to forget', 'travailler': 'to work',
    'jouer': 'to play', 'écouter': 'to listen', 'manger': 'to eat', 'commencer': 'to begin',
    'voyager': 'to travel', 'raconter': 'to tell', 'quitter': 'to leave (sb/sth)', 'embrasser': 'to kiss',
    'finir': 'to finish', 'choisir': 'to choose', 'réussir': 'to succeed', 'réfléchir': 'to think over',
    'attendre': 'to wait', 'entendre': 'to hear', 'répondre': 'to answer', 'perdre': 'to lose',
    'vendre': 'to sell', 'descendre': 'to go down', 'rendre': 'to give back',
  };
  const ETRE_REG = new Set(['rester', 'arriver', 'tomber', 'entrer', 'rentrer', 'descendre']);

  const split = s => s.split(' ');
  const isVowel = c => /^[aeéèêiîoôuûhœ]/i.test(c);
  // Soften stem before a/o: mange-ons, commenç-ons.
  function soft(stem, ending) {
    if (/^[aoâ]/.test(ending)) {
      if (stem.endsWith('g')) return stem + 'e';
      if (stem.endsWith('c')) return stem.slice(0, -1) + 'ç';
    }
    return stem;
  }
  function group(inf) {
    if (inf.endsWith('er')) return 'er';
    if (inf.endsWith('ir')) return 'ir';
    return 're';
  }

  function present(inf) {
    if (IRR[inf]) return split(IRR[inf].pres);
    const g = group(inf), st = inf.slice(0, -2);
    if (g === 'er') return ['e', 'es', 'e', 'ons', 'ez', 'ent'].map(e => soft(st, e) + e);
    if (g === 'ir') return ['is', 'is', 'it', 'issons', 'issez', 'issent'].map(e => st + e);
    return ['s', 's', '', 'ons', 'ez', 'ent'].map(e => st + e);
  }
  function impfStem(inf) {
    if (IRR[inf] && IRR[inf].impf) return IRR[inf].impf;
    return present(inf)[3].replace(/ons$/, '').replace(/ge$/, 'g').replace(/ç$/, 'c');
  }
  function imparfait(inf) {
    const st = impfStem(inf);
    return ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'].map(e => soft(st, e) + e);
  }
  function futStem(inf) {
    if (IRR[inf] && IRR[inf].fut) return IRR[inf].fut;
    return inf.endsWith('re') ? inf.slice(0, -1) : inf;
  }
  const futur = inf => ['ai', 'as', 'a', 'ons', 'ez', 'ont'].map(e => futStem(inf) + e);
  const cond = inf => ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'].map(e => futStem(inf) + e);
  function subj(inf) {
    if (IRR[inf] && IRR[inf].subj) return split(IRR[inf].subj);
    const st = present(inf)[5].replace(/ent$/, '');
    const ist = impfStem(inf);
    return [st + 'e', st + 'es', st + 'e', ist + 'ions', ist + 'iez', st + 'ent'];
  }
  function passeSimple(inf) {
    let stem, type;
    if (IRR[inf]) [stem, type] = IRR[inf].ps;
    else {
      const g = group(inf);
      stem = inf.slice(0, -2);
      type = g === 'er' ? 'a' : 'i';
    }
    if (type === 'a') return ['ai', 'as', 'a', 'âmes', 'âtes', 'èrent'].map(e => soft(stem, e) + e);
    if (type === 'i') return ['is', 'is', 'it', 'îmes', 'îtes', 'irent'].map(e => stem + e);
    if (type === 'u') return ['us', 'us', 'ut', 'ûmes', 'ûtes', 'urent'].map(e => stem + e);
    return ['ins', 'ins', 'int', 'înmes', 'întes', 'inrent'].map(e => stem + e);
  }
  function aux(inf) {
    if (IRR[inf]) return IRR[inf].aux || 'avoir';
    return ETRE_REG.has(inf) ? 'être' : 'avoir';
  }
  function pp(inf) {
    if (IRR[inf]) return IRR[inf].pp;
    const g = group(inf), st = inf.slice(0, -2);
    return g === 'er' ? st + 'é' : g === 'ir' ? st + 'i' : st + 'u';
  }
  function compound(inf, auxTense) {
    const a = aux(inf);
    const auxForms = auxTense === 'pres' ? present(a) : imparfait(a);
    const p = pp(inf);
    return auxForms.map((f, i) => f + ' ' + (a === 'être' && i >= 3 ? p + 's' : p));
  }

  function conjugate(inf, tense) {
    switch (tense) {
      case 'pres': return present(inf);
      case 'impf': return imparfait(inf);
      case 'fut': return futur(inf);
      case 'cond': return cond(inf);
      case 'subj': return subj(inf);
      case 'ps': return passeSimple(inf);
      case 'pc': return compound(inf, 'pres');
      case 'pqp': return compound(inf, 'impf');
    }
  }
  // All acceptable answers (être-verb past participle agreement variants).
  function accepted(inf, tense, person) {
    const form = conjugate(inf, tense)[person];
    if ((tense === 'pc' || tense === 'pqp') && aux(inf) === 'être') {
      const auxPart = form.slice(0, form.lastIndexOf(' ') + 1);
      const sfx = person === 4 ? ['', 'e', 's', 'es'] : person >= 3 ? ['s', 'es'] : ['', 'e'];
      return [form].concat(sfx.map(x => auxPart + pp(inf) + x).filter(a => a !== form));
    }
    return [form];
  }
  function pronoun(person, form) {
    if (person === 0) return isVowel(form) ? "j'" : 'je';
    return PRON[person];
  }
  // Strip a leading pronoun the user may have typed.
  function stripPronoun(ans) {
    return ans.replace(/^\s*(j'|je |tu |il |elle |on |nous |vous |ils |elles |que |qu'il |qu'elle |qu'ils |qu'elles )/i, '');
  }

  const verbs = Object.keys(IRR).map(v => ({ inf: v, en: IRR[v].en, irregular: true }))
    .concat(Object.keys(REG).map(v => ({ inf: v, en: REG[v], irregular: false })));

  return { PRON, TENSES, verbs, conjugate, accepted, pronoun, stripPronoun, aux, pp, subjPrefix: p => (p === 0 || p === 1 || p === 3 || p === 4 ? 'que' : 'qu\'') };
})();
