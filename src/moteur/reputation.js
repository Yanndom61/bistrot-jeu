/* reputation.js (v1.0) — la réputation du restaurant (note sur 5) et les avis des clients, comme dans l'ancien jeu.
   Chaque repas tire la note vers ses étoiles (petit poids), un avis publié compte un peu plus, le critique beaucoup plus.
   Les clients partis sans manger, l'inspection, l'influenceuse et l'étoile Michelin la font aussi bouger. */
B.rep = {};
B.rep.D = function () { return B.DATA.reputation; };
B.rep.borne = function (n) { const D = B.rep.D(); return Math.max(D.min, Math.min(D.max, n)); };
B.rep.note = function (S) { return S.note == null ? B.rep.D().depart : S.note; };

/* La note se rapproche de « etoiles » avec le poids donné (repUpdate de l'ancien jeu). */
B.rep.maj = function (S, etoiles, poids) {
  const avant = B.rep.note(S);
  S.note = Math.round(B.rep.borne(avant + (etoiles - avant) * poids) * 10000) / 10000;
  S.stats.jour.repDelta = Math.round(((S.stats.jour.repDelta || 0) + S.note - avant) * 10000) / 10000;
  return S.note;
};
B.rep.facteurAffluence = function (S) {
  const A = B.rep.D().affluence;
  return (A.base + A.parEtoile * B.rep.note(S)) / A.reference;
};

/* Ce que la table a pensé de chaque point (0 = très mauvais, 1 = parfait), pour écrire l'avis. */
B.rep.points = function (S, g) {
  const lignes = g.commande || [];
  const rates = lignes.filter(function (l) { return l.cuisson && l.servie && l.servie !== l.cuisson; }).length + lignes.filter(function (l) { return l.renvoye; }).length;
  const plats = Math.max(1, lignes.filter(function (l) { return l.cat !== 'boisson'; }).length);
  const prix = g.idxPrix || 1;
  return {
    cuisine: Math.max(0, 1 - rates / plats * 1.5),
    attente: Math.max(0, Math.min(1, 1 - ((g.attenteCommande || 0) - 5) / 25)),
    prix: Math.max(0, Math.min(1, 1.5 - prix)),
    proprete: Math.max(0, Math.min(1, (S.proprete == null ? 100 : S.proprete) / 100)),
    service: Math.max(0, Math.min(1, (g.amabN ? g.amabS / g.amabN : 5) / 10))
  };
};

/* Le texte d'un avis : une phrase selon les étoiles, parfois un point fort ou un point faible. */
B.rep.texte = function (S, etoiles, g, points) {
  const T = B.DATA.textes, r = Math.max(1, Math.min(5, Math.round(etoiles)));
  const ordre = { plat: 0, menu: 1, entree: 2, dessert: 3 };
  const plat = (g.commande || []).filter(function (l) { return l.nom && ordre[l.cat] != null; }).sort(function (a, b) { return ordre[a.cat] - ordre[b.cat] || b.prix - a.prix; })[0];
  const liste = T['avis_' + r].split('|').filter(function (x) { return plat || x.indexOf('{plat}') < 0; });
  let t = liste[B.entier(S, 0, liste.length - 1)].replace('{plat}', plat ? plat.nom : '');
  const ks = Object.keys(points).sort(function (a, b) { return points[a] - points[b]; });
  if (r >= 4 && B.hasard(S) < 0.6) t += ' ' + B.t('avis_fort_' + ks[ks.length - 1]);
  else if (r <= 3 && points[ks[0]] < 0.6) t += ' ' + B.t('avis_faible_' + ks[0]);
  return t;
};
B.rep.publier = function (S, etoiles, texte, auteur) {
  const R = B.rep.D().avis;
  S.avis = S.avis || [];
  const a = { jour: S.jour, minute: Math.floor(S.minute), etoiles: Math.max(1, Math.min(5, Math.round(etoiles))), texte: texte, auteur: auteur };
  S.avis.unshift(a);
  if (S.avis.length > R.garder) S.avis.length = R.garder;
  S.stats.jour.avis = (S.stats.jour.avis || 0) + 1;
  S.totalAvis = (S.totalAvis || 0) + 1;
  return a;
};
B.rep.auteur = function (S) { const L = B.t('avis_auteurs').split('|'); return L[B.entier(S, 0, L.length - 1)]; };

/* Une table paie : la réputation bouge, et parfois le client écrit un avis (le critique est traité à part). */
B.rep.apresRepas = function (S, g, etoiles) {
  const P = B.rep.D().poids, A = B.rep.D().avis;
  if (g.critique) return;
  B.rep.maj(S, etoiles, P.client);
  const p = A.base + A.parEcart * Math.abs(Math.round(etoiles) - 3) / 2;
  if (B.hasard(S) < p) {
    B.rep.publier(S, etoiles, B.rep.texte(S, etoiles, g, B.rep.points(S, g)), B.rep.auteur(S));
    B.rep.maj(S, etoiles, P.avis);
  }
};
/* Clients partis sans manger. */
B.rep.parti = function (S, pourquoi) {
  const P = B.rep.D().poids, N = B.rep.D().notes;
  if (pourquoi === 'file') B.rep.maj(S, N.fileRepart, P.fileRepart);
  else if (pourquoi === 'sale') B.rep.maj(S, N.salleSale, P.salleSale);
  else if (pourquoi === 'rupture') {
    B.rep.maj(S, N.rupture, P.rupture);
    B.rep.publier(S, 1, B.t('avis_rupture'), B.rep.auteur(S));
  }
};

/* Étoile Michelin (ancien jeu) : brigade complète et au sommet, au moins 30 jours après l'ouverture. */
B.rep.michelinPret = function (S) {
  const M = B.rep.D().michelin;
  if (S.michelin && (S.michelin.etoile || S.michelin.propose === S.jour)) return false;
  if ((S.stats.joursJoues || 0) < M.jours) return false;
  const st = S.equipe.filter(function (p) { return !p.patron && !p.interim && !p.partant; });
  if (st.length < M.employes) return false;
  const F = B.DATA.equipe.formations.liste.filter(function (f) { return f.stat; });
  return st.every(function (p) {
    const stats = F.filter(function (f) { return f.services.indexOf(p.service) >= 0; }).map(function (f) { return f.stat; });
    return stats.length > 0 && stats.every(function (k) { return (p[k] || 0) >= M.niveau; });
  });
};
/* Le matin : si la brigade est prête, l'inspecteur demande à venir (une fois par jour ; « Plus tard » → il revient demain). */
B.rep.michelinMatin = function (S) {
  if (!S.cal || S.cal.attente || !B.rep.michelinPret(S)) return;
  S.michelin = Object.assign({}, S.michelin || {}, { propose: S.jour });
  S.cal.attente = { id: 'michelin', minute: Math.floor(S.minute), vars: { reception: B.euros(B.rep.D().michelin.reception) } };
  B.message(S, 'msg_michelin_inspecteur');
  if (B.ev.choixAuto) B.ev.choisir(S, 0);   /* simulateur : le joueur accepte */
};
B.rep.michelinRecevoir = function (S) {
  const M = B.rep.D().michelin;
  S.michelin = { etoile: S.jour, propose: S.michelin && S.michelin.propose };
  S.note = Math.round(Math.min(B.rep.D().max, B.rep.note(S) + M.bonus) * 10000) / 10000;
  B.argent.payer(S, 'divers', M.reception);
  B.message(S, 'msg_michelin_obtenue', { prix: B.euros(M.reception) });
};

/* Moyenne des avis gardés (pour l'écran). */
B.rep.moyenneAvis = function (S) {
  const A = S.avis || [];
  return A.length ? Math.round(A.reduce(function (s, a) { return s + a.etoiles; }, 0) / A.length * 10) / 10 : null;
};
