/* meteo.js — étape 6 (v0.8) : le temps qu'il fait, selon le lieu et la date, et son effet sur l'affluence
   et sur ce que les clients commandent. Données : donnees/meteo.json. Repris de l'ancien jeu (v7 et v9.6).
   Le temps d'un jour ne dépend que de la date et du lieu : il est donc toujours le même, et on peut le prévoir. */
B.meteo = {};
B.meteo.D = function () { return B.DATA.meteo; };
B.meteo.hacher = function (n) {
  let h = Math.imul(n, 2654435761) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
  return (h ^ (h >>> 13)) >>> 0;
};
B.meteo._cache = {};
/* Météo du jour n (numéro de jour depuis 1970) dans le lieu de la partie. */
B.meteo.du = function (S, n) {
  const cle = S.lieu + ':' + n;
  if (B.meteo._cache[cle]) return B.meteo._cache[cle];
  const M = B.meteo.D(), lieux = B.DATA.lieux.lieux, l = B.lieu(S.lieu), idx = Math.max(0, lieux.indexOf(l));
  const h = B.meteo.hacher(n * 7 + idx * 991 + 7919), r = (h % 1000) / 1000, r2 = ((h >>> 10) % 1000) / 1000;
  const m = (B.cal.date(n).m + (l.hemisphereSud ? 6 : 0)) % 12, Bz = M.base;
  let temp = Bz.temperature[m], pluie, soleil, ciel;
  const vers = function (v) { return Array.isArray(v) ? v[m] : v; };
  if (Bz.lieux.indexOf(l.id) >= 0) {
    pluie = Bz.pluie[m]; soleil = Bz.soleil[m];
    ciel = r < pluie ? 'pluie' : r < pluie + soleil ? 'soleil' : 'nuages';
    temp += Math.floor(r2 * (2 * Bz.ecart + 1)) - Bz.ecart + (ciel === 'soleil' ? Bz.soleilPlus : ciel === 'pluie' ? -Bz.pluieMoins : 0);
  } else {
    const txt = String(l.meteo || '').toLowerCase();
    pluie = M.parDefaut.pluie; soleil = M.parDefaut.soleil;
    const c = M.climats.find(function (x) { return new RegExp(x.motif).test(txt); });
    if (c) {
      if (c.temperature) temp = c.temperature[m];
      if (c.plusChaud) temp += c.plusChaud;
      if (c.tresFroid && /très froid/.test(txt)) temp -= c.tresFroid;
      if (c.pluieEte != null) pluie = m > 4 && m < 9 ? c.pluieEte : c.pluieAutre;
      else if (c.pluie != null) pluie = vers(c.pluie);
      if (c.soleil != null) soleil = vers(c.soleil);
    }
    if (M.temperatureFixe[l.id] != null) temp = M.temperatureFixe[l.id];
    ciel = r < pluie ? 'pluie' : r < pluie + soleil ? 'soleil' : 'nuages';
    temp += Math.floor(r2 * (2 * Bz.ecart + 1)) - Bz.ecart;
  }
  if (ciel === 'pluie' && temp <= M.neigeSous) ciel = 'neige';
  const R = M.ressenti;
  const ressenti = temp >= R.chaudDes || (ciel === 'soleil' && temp >= R.chaudSoleilDes) ? 'chaud' : (temp <= R.froidJusqua || ciel === 'pluie' || ciel === 'neige') ? 'froid' : 'doux';
  const o = { ciel: ciel, emoji: M.ciels[ciel].emoji, temp: temp, affluence: M.ciels[ciel].affluence, ressenti: ressenti };
  B.meteo._cache[cle] = o;
  return o;
};
B.meteo.aujourdhui = function (S) { return B.meteo.du(S, B.cal.serieDuJour(S, 0)); };

/* ---------- Ce que les clients commandent ---------- */
B.meteo._genre = {};
/* « frais » (salade, tartare…), « chaud » (soupe, gratin…) ou rien, d'après le nom du plat (comme l'ancien jeu). */
B.meteo.genrePlat = function (d) {
  if (B.meteo._genre[d.id] != null) return B.meteo._genre[d.id];
  const C = B.meteo.D().commandes, n = String(d.nom || '').toLowerCase();
  const g = new RegExp(C.motifFrais).test(n) ? 'frais' : new RegExp(C.motifChaud).test(n) ? 'chaud' : '';
  B.meteo._genre[d.id] = g;
  return g;
};
B.meteo.coefPlat = function (S, d) {
  const C = B.meteo.D().commandes, r = B.meteo.aujourdhui(S).ressenti, g = B.meteo.genrePlat(d);
  if (!g || r === 'doux') return 1;
  return (r === 'chaud') === (g === 'frais') ? C.platAdapte : C.platContraire;
};
B.meteo.coefBoisson = function (S, type) {
  const C = B.meteo.D().commandes, r = B.meteo.aujourdhui(S).ressenti;
  const t = r === 'chaud' ? C.boissonsChaud : r === 'froid' ? C.boissonsFroid : null;
  return t && t[type] != null ? t[type] : 1;
};
