/* outils.js — petites fonctions communes : hasard reproductible, textes, heures, euros. */
B.VERSION_JEU = '0.5.0';

/* Hasard reproductible : la graine est rangée dans la partie, donc une partie rechargée continue pareil. */
B.hasard = function (S) {
  let a = (S.graine | 0) + 0x6D2B79F5 | 0;
  S.graine = a;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
B.entre = function (S, a, b) { return a + (b - a) * B.hasard(S); };
B.entier = function (S, a, b) { return Math.floor(a + (b - a + 1) * B.hasard(S)); };
B.duree = function (S, v) { return Array.isArray(v) ? B.entre(S, v[0], v[1]) : v; };

/* Textes : tous viennent de donnees/textes.json. */
B.t = function (cle, vars) {
  const s = B.DATA.textes[cle];
  if (s == null) { B.textesManquants[cle] = true; return cle; }
  return String(s).replace(/\{(\w+)\}/g, function (m, k) {
    return vars && vars[k] != null ? vars[k] : m;
  });
};
B.textesManquants = {};

B.heure = function (minute) {
  const m = Math.floor(minute) % 1440;
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
};
B.euros = function (n) {
  const r = Math.round(n);
  const s = String(Math.abs(r)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
  return (r < 0 ? '-' : '') + s + '\u00A0€';
};

/* Prix au centime : « 19,50 € ». */
B.prix = function (n) {
  const r = Math.round(n * 100) / 100, e = Math.floor(Math.abs(r)), c = Math.round((Math.abs(r) - e) * 100);
  return (r < 0 ? '-' : '') + String(e).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F') + ',' + String(c).padStart(2, '0') + '\u00A0€';
};

/* « Bienvenue chez YaYa », « Bienvenue au Petit Zinc », « Bienvenue à la Brasserie »… */
B.chezNom = function (nom) {
  const n = String(nom || '').trim();
  if (/^chez\s+/i.test(n)) return 'chez ' + n.replace(/^chez\s+/i, '');
  if (/^le\s+/i.test(n)) return 'au ' + n.replace(/^le\s+/i, '');
  if (/^les\s+/i.test(n)) return 'aux ' + n.replace(/^les\s+/i, '');
  if (/^la\s+/i.test(n)) return 'à la ' + n.replace(/^la\s+/i, '');
  if (/^l['’]\s*/i.test(n)) return 'à l’' + n.replace(/^l['’]\s*/i, '');
  return 'chez ' + n;
};

B.lieu = function (id) {
  const L = B.DATA.lieux.lieux;
  return L.find(function (l) { return l.id === id; }) || L[0];
};

/* Messages : rangés dans le journal de la partie, et transmis à l'écran (B.flux). */
B.flux = [];
/* Note dans le journal seulement (sans bulle à l'écran), pour les événements fréquents comme les paiements. */
B.noter = function (S, cle, vars) {
  S.journal.push({ jour: S.jour, minute: Math.floor(S.minute), texte: B.t(cle, vars) });
  if (S.journal.length > 300) S.journal.splice(0, S.journal.length - 300);
};
B.message = function (S, cle, vars) {
  const m = { jour: S.jour, minute: Math.floor(S.minute), texte: B.t(cle, vars) };
  S.journal.push(m);
  if (S.journal.length > 300) S.journal.splice(0, S.journal.length - 300);
  B.flux.push(m);
};
