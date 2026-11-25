/* calendrier.js — étape 6 (v0.8) : dates, jours de la semaine, saisons, jours fériés, vacances scolaires, fêtes,
   tourisme selon le lieu, et l'effet de tout cela sur l'affluence et la clientèle. Données : donnees/calendrier.json.
   Repris de l'ancien jeu Chez YaYa (v7 et v9.6). Tout est calculé à partir de la date : aucun état à sauvegarder. */
B.cal = {};
B.cal.D = function () { return B.DATA.calendrier; };

/* ---------- Dates : un « numéro de jour » (jours depuis 1970) ---------- */
B.cal.serie = function (y, m, d) { return Math.round(Date.UTC(y, m, d) / 864e5); };
B.cal.serieDuJour = function (S, decalage) { return Math.floor(B.dateDuJour(S, decalage).getTime() / 864e5); };
B.cal.date = function (n) { const d = new Date(n * 864e5); return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), js: d.getUTCDay() }; };
B.cal.depuisTexte = function (s) { const p = s.split('-'); return B.cal.serie(+p[0], +p[1] - 1, +p[2]); };
/* Numéro du jour de jeu qui tombe à cette date. */
B.cal.jourDe = function (S, n) { return S.jour + (n - B.cal.serieDuJour(S, 0)); };

B.cal.paques = function (y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mo = Math.floor((h + l - 7 * m + 114) / 31), dd = ((h + l - 7 * m + 114) % 31) + 1;
  return B.cal.serie(y, mo - 1, dd);
};
B.cal.orthodoxe = function (y) {
  const a = y % 4, b = y % 7, c = y % 19, d = (19 * c + 15) % 30, e = (2 * a + 4 * b - d + 34) % 7, mo = Math.floor((d + e + 114) / 31), dd = ((d + e + 114) % 31) + 1;
  return B.cal.serie(y, mo - 1, dd) + 13;
};
B.cal.mmjj = function (s, y) { const p = s.split('-'); return B.cal.serie(y, +p[0] - 1, +p[1]); };
/* Une règle de date (voir l'explication de donnees/calendrier.json) pour l'année y. */
B.cal.regle = function (r, y) {
  if (typeof r === 'string') return B.cal.mmjj(r, y);
  let n;
  if (r.paques != null) n = B.cal.paques(y) + r.paques;
  else if (r.orthodoxe != null) n = B.cal.orthodoxe(y) + r.orthodoxe;
  else if (r.nouvelAnChinois != null || r.chuseok != null) {
    const T = B.cal.D().calendriersAsie[r.nouvelAnChinois != null ? 'nouvelAnChinois' : 'chuseok'];
    n = B.cal.mmjj(T[y] || (r.chuseok != null ? '09-20' : '02-05'), y) + (r.nouvelAnChinois != null ? r.nouvelAnChinois : r.chuseok);
  } else if (r.nieme) {
    const f = B.cal.serie(y, r.nieme[0] - 1, 1);
    n = f + ((r.nieme[1] - B.cal.date(f).js + 7) % 7) + 7 * (r.nieme[2] - 1);
  } else if (r.dernier) {
    const l = B.cal.serie(y, r.dernier[0], 0);
    n = l - ((B.cal.date(l).js - r.dernier[1] + 7) % 7);
  } else if (r.special === 'meres') {
    const pent = B.cal.paques(y) + 49;
    n = B.cal.regle({ dernier: [5, 0] }, y);
    if (n === pent) n = B.cal.regle({ nieme: [6, 0, 1] }, y);
  } else if (r.special === 'epiphanie') {
    const s = B.cal.serie(y, 0, 2);
    n = s + ((7 - B.cal.date(s).js) % 7);
  } else n = B.cal.serie(y, 0, 1);
  return n + (r.plus || 0);
};
/* Fenêtre [début, fin] (numéros de jour) d'une période pour l'année y. */
B.cal.fenetre = function (f, y) {
  if (f.de) {
    const a = B.cal.regle(f.de, y);
    let b = B.cal.regle(f.a, y);
    if (b < a) b = B.cal.regle(f.a, y + 1);
    return [a, b];
  }
  const x = B.cal.regle(f.jour, y);
  return [x - ((f.jours || 1) - 1), x];
};

/* ---------- Le lieu ---------- */
B.cal.lieu = function (S) { return B.cal.D().lieux[S.lieu] || {}; };
B.cal.genre = function (S) { const g = B.lieu(S.lieu).groupe; return g === 'france' ? 'fr' : g === 'outre-mer' ? 'dom' : 'monde'; };
B.cal.zone = function (S) { const m = /Zone ([ABC])/.exec(B.lieu(S.lieu).calendrier || ''); return m ? m[1] : 'C'; };

/* ---------- Saison (hiver, printemps, été, automne), inversée dans l'hémisphère sud ---------- */
B.cal.saison = function (S, decalage) {
  let m = B.mois(S, decalage);
  if (B.lieu(S.lieu).hemisphereSud) m = (m + 6) % 12;
  return ['hiver', 'hiver', 'printemps', 'printemps', 'printemps', 'ete', 'ete', 'ete', 'automne', 'automne', 'automne', 'hiver'][m];
};

/* ---------- Jours fériés et fêtes (calculés une fois par lieu et par année) ---------- */
B.cal._annees = {};
B.cal.annee = function (S, y) {
  const cle = S.lieu + ':' + y;
  if (B.cal._annees[cle]) return B.cal._annees[cle];
  const D = B.cal.D(), L = B.cal.lieu(S), genre = B.cal.genre(S), feries = {}, fetes = {};
  const poser = function (table, n, v) { if (!table[n]) table[n] = v; };
  if (genre !== 'monde') D.feriesFrance.forEach(function (f) { poser(feries, B.cal.regle(f.date, y), { id: f.id, nom: f.nom }); });
  (L.feries || []).forEach(function (f) { poser(feries, B.cal.regle(f.date, y), { id: 'local', nom: f.nom }); });
  if (genre === 'monde') {
    if (D.feriesMonde.jourDeLAn) poser(feries, B.cal.serie(y, 0, 1), { id: 'an', nom: B.t('cal_jour_de_l_an') });
    if (D.feriesMonde.noelSaufA.indexOf(S.lieu) < 0) poser(feries, B.cal.serie(y, 11, 25), { id: 'noel', nom: B.t('cal_noel') });
  } else D.fetesFrance.forEach(function (f) { poser(fetes, B.cal.regle(f.date, y), { id: f.id, nom: f.nom, emoji: f.emoji }); });
  B.cal._annees[cle] = { feries: feries, fetes: fetes };
  return B.cal._annees[cle];
};
B.cal.ferie = function (S, n) { return B.cal.annee(S, B.cal.date(n).y).feries[n] || null; };
B.cal.fete = function (S, n) { return B.cal.annee(S, B.cal.date(n).y).fetes[n] || null; };

/* ---------- Vacances scolaires ---------- */
B.cal._vac = null;
B.cal.vacancesFrance = function (S, n) {
  const V = B.cal.D().vacancesFrance, z = B.cal.zone(S);
  if (!B.cal._vac) B.cal._vac = V.periodes.map(function (p) { const o = { nom: p.nom, emoji: p.emoji }; ['A', 'B', 'C'].forEach(function (k) { o[k] = [B.cal.depuisTexte(p[k][0]), B.cal.depuisTexte(p[k][1])]; }); return o; });
  /* au-delà des dates connues : mêmes dates qu'en 2027-2028, décalées d'autant d'années */
  const debut = B.cal.depuisTexte(V.repriseDepuis), fin = B.cal.depuisTexte(V.fin);
  let x = n, decale = 0;
  if (n > fin || n < B.cal.depuisTexte(V.avantPremiere)) {
    const d = B.cal.date(n);
    for (let k = -30; k <= 30; k++) {
      const t = B.cal.serie(d.y - k, d.m, Math.min(d.d, 28 + (d.m === 1 ? 0 : 3)));
      if (t >= debut && t <= fin) { x = t; decale = k; break; }
    }
  }
  const p = B.cal._vac.find(function (v) { return x >= v[z][0] && x <= v[z][1]; });
  if (!p) return null;
  return { nom: p.nom, emoji: p.emoji, zone: z, debut: p[z][0] + (n - x), fin: p[z][1] + (n - x), approx: decale !== 0 };
};
B.cal.vacancesAilleurs = function (S, n) {
  const V = B.cal.D().vacancesAilleurs, d = B.cal.date(n), mois = d.m + 1;
  const sud = B.lieu(S.lieu).hemisphereSud && V.sudSauf.indexOf(S.lieu) < 0;
  const ete = sud ? V.grandes.sud : V.grandes.nord;
  const dans = function (de, a) { const x = mois * 100 + d.d, p = +de.replace('-', ''), q = +a.replace('-', ''); return p <= q ? x >= p && x <= q : x >= p || x <= q; };
  const bornes = function (de, a) {
    const p0 = B.cal.mmjj(de, d.y), q0 = B.cal.mmjj(a, d.y);
    if (p0 <= q0) return [p0, q0];
    return n >= p0 ? [p0, B.cal.mmjj(a, d.y + 1)] : [B.cal.mmjj(de, d.y - 1), q0];
  };
  if (ete.indexOf(mois) >= 0) {
    const m1 = ete[0], m2 = ete[ete.length - 1];
    const de = String(m1).padStart(2, '0') + '-01', a = String(m2).padStart(2, '0') + '-' + new Date(Date.UTC(2001, m2, 0)).getUTCDate();
    const b = bornes(de, a);
    return { nom: V.grandes.nom, emoji: V.grandes.emoji, zone: null, debut: b[0], fin: b[1] };
  }
  if (dans(V.finDAnnee.de, V.finDAnnee.a)) { const b = bornes(V.finDAnnee.de, V.finDAnnee.a); return { nom: V.finDAnnee.nom, emoji: V.finDAnnee.emoji, zone: null, debut: b[0], fin: b[1] }; }
  if (dans(V.pause.de, V.pause.a)) { const b = bornes(V.pause.de, V.pause.a); return { nom: V.pause.nom, emoji: V.pause.emoji, zone: null, debut: b[0], fin: b[1] }; }
  return null;
};
B.cal.vacances = function (S, n) { return B.cal.genre(S) === 'fr' ? B.cal.vacancesFrance(S, n) : B.cal.vacancesAilleurs(S, n); };

/* ---------- Tourisme (forte saison selon la description du lieu) ---------- */
B.cal.coefTourisme = function (lieu, n) {
  const T = B.cal.D().tourisme, t = String(lieu.tourisme || '').toLowerCase(), mois = B.cal.date(n).m + 1;
  if (T.faible.indexOf(t) >= 0) return T.coefFaible;
  let pic = [];
  T.motifs.forEach(function (x) { if (new RegExp(x.motif).test(t)) pic = pic.concat(x.mois); });
  if (lieu.hemisphereSud && lieu.groupe === 'monde' && pic.length) pic = pic.map(function (x) { return (x + 5) % 12 + 1; });
  if (pic.indexOf(mois) >= 0) return T.coefPic;
  return new RegExp(T.toutelAnnee).test(t) ? T.coefToutelAnnee : T.coefAutre;
};
B.cal.facteurTourisme = function (S, n) { return B.cal.coefTourisme(B.lieu(S.lieu), n) / B.cal.coefTourisme(B.lieu(B.cal.D().tourisme.lieuReference), n); };
B.cal.forteSaison = function (S, n) { return B.cal.coefTourisme(B.lieu(S.lieu), n) >= B.cal.D().tourisme.coefPic; };

/* ---------- Effet sur l'affluence (sans la météo ni les événements du jour) ---------- */
B.cal.coefJour = function (S, n, minute) {
  const E = B.cal.D().effets, f0 = B.cal.ferie(S, n), fe = B.cal.fete(S, n), v = B.cal.vacances(S, n), midi = minute < E.midiAvant;
  let f = 1;
  if (v) f *= 1 + E.vacancesParZone;
  if (f0) { f *= midi ? E.ferieMidi : E.ferieSoir; if (E.ferieCalme.ids.indexOf(f0.id) >= 0) f *= E.ferieCalme.coef; }
  else if (fe && E.fetesQuiComptent.indexOf(fe.id) >= 0) f *= fe.id === 'valent' ? E.valentinMidi : midi ? E.feteMidi : E.feteSoir;
  return f;
};
B.cal.facteurCalendrier = function (S, n, minute) {
  return B.cal.D().joursSemaine.coef[B.cal.date(n).js] * B.cal.coefJour(S, n, minute) * B.cal.facteurTourisme(S, n);
};
/* Affluence prévue d'un jour (moyenne midi et soir), météo comprise : sert à la prévision des commandes et au calendrier. */
B.cal.facteurJour = function (S, decalage) {
  const n = B.cal.serieDuJour(S, decalage || 0);
  const c = (B.cal.facteurCalendrier(S, n, 700) + B.cal.facteurCalendrier(S, n, 1200)) / 2;
  return c * B.meteo.du(S, n).affluence;
};
/* Facteur d'affluence de cette minute : calendrier × météo × événements du jour en cours. */
B.cal.facteur = function (S, minute) {
  const n = B.cal.serieDuJour(S, 0);
  return B.cal.facteurCalendrier(S, n, minute) * B.meteo.du(S, n).affluence * B.evenements.facteur(S, minute);
};

/* ---------- Clientèle : touristes et familles ---------- */
B.cal.partTouristes = function (S, n) {
  const T = B.cal.D().effets.touristes, l = B.lieu(S.lieu), t = B.cal.coefTourisme(l, n);
  let p = B.cal.vacances(S, n) ? T.vacancesBase + T.vacancesParZone : 0;
  p += Math.max(0, t - 1) * T.parPointDeTourisme;
  if (new RegExp(B.cal.D().tourisme.toutelAnnee).test(String(l.tourisme || '').toLowerCase())) p += T.bonusToutelAnnee;
  return Math.max(0, Math.min(T.max, p));
};
B.cal.facteurFamilles = function (S, n, minute) {
  const E = B.cal.D().effets, F = E.familles, midi = minute < E.midiAvant, fe = B.cal.fete(S, n);
  let f = 1;
  if (B.cal.vacances(S, n)) f *= 1 + F.vacancesParZone;
  if (B.cal.ferie(S, n)) f *= midi ? F.ferieMidi : F.ferieSoir;
  if (fe && (fe.id === 'meres' || fe.id === 'peres') && midi) f *= F.feteParentsMidi;
  return f;
};

/* ---------- Ce qui se passe un jour donné (pour l'écran) ---------- */
B.cal.infos = function (S, decalage) {
  const n = B.cal.serieDuJour(S, decalage || 0);
  return {
    serie: n, jour: S.jour + (decalage || 0), js: B.cal.date(n).js, texte: B.texteDate(S, decalage), saison: B.cal.saison(S, decalage),
    ferie: B.cal.ferie(S, n), fete: B.cal.fete(S, n), vacances: B.cal.vacances(S, n), meteo: B.meteo.du(S, n),
    forteSaison: B.cal.forteSaison(S, n), facteur: B.cal.facteurJour(S, decalage || 0)
  };
};
