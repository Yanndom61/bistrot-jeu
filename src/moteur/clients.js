/* clients.js — arrivée des groupes, file à la porte, repas, départ. */
B.clients = {};

B.clients.type = function (id) {
  return B.DATA.clients.types.find(function (t) { return t.id === id; });
};

/* Nombre moyen de groupes qui arrivent par heure à cette minute de la journée. */
B.clients.affluence = function (S, minute) {
  const tr = B.DATA.clients.affluence.find(function (a) { return minute >= a.de && minute < a.a; });
  if (!tr) return 0;
  return tr.groupesParHeure * B.lieu(S.lieu).affluence;
};

B.clients.tirerType = function (S) {
  const T = B.DATA.clients.types;
  let tot = 0; T.forEach(function (t) { tot += t.poids; });
  let r = B.hasard(S) * tot;
  for (const t of T) { r -= t.poids; if (r < 0) return t; }
  return T[T.length - 1];
};

B.clients.arrivee = function (S) {
  const type = B.clients.tirerType(S);
  const taille = B.entier(S, type.taille[0], type.taille[1]);
  const noms = B.lieu(S.lieu).nomsClients;
  const e = B.DATA.salle.entree;
  const g = {
    id: S.prochainId++, type: type.id, taille: taille,
    nom: noms[B.entier(S, 0, noms.length - 1)],
    etat: 'file', depuis: S.minute, arrivee: S.minute,
    patience: B.duree(S, B.DATA.clients.durees.patienceFile),
    tables: null, x: e.x, y: e.y, chemin: [], duree: 0, serveur: null, pret: 0, aMange: false
  };
  S.groupes.push(g);
  S.stats.jour.groupes++;
  S.stats.jour.arrives += taille;
  if (taille >= 5) B.message(S, 'msg_grand_groupe', { taille: taille, groupe: B.t('groupe_' + type.id, { nom: g.nom }) });
};

/* Place les groupes qui attendent à la porte, dans l'ordre d'arrivée, dès qu'une table convient. */
B.clients.placer = function (S) {
  let enFile = 0;
  for (const g of S.groupes) {
    if (g.etat !== 'file') continue;
    const ids = B.salle.chercher(S, g.taille);
    if (ids) {
      ids.forEach(function (id) { B.salle.tableDe(S, id).groupe = g.id; });
      g.tables = ids;
      g.etat = 'marche';
      g.depuis = S.minute;
      g.chemin = B.salle.chemin(g, B.salle.centre(ids));
      if (ids.length > 1) B.message(S, 'msg_installe_rallonge', { num: B.salle.nomTables(ids), taille: g.taille });
    } else if (S.minute - g.depuis > g.patience) {
      g.etat = 'repart';
      g.chemin = [{ x: B.DATA.salle.dehors.x, y: B.DATA.salle.dehors.y }];
      S.stats.jour.repartis += g.taille;
      B.message(S, 'msg_repart', { taille: g.taille });
    } else enFile++;
  }
  S.stats.jour.fileMax = Math.max(S.stats.jour.fileMax, enFile);
};

/* Le groupe quitte sa table : la table devient à débarrasser. */
B.clients.partir = function (S, g) {
  (g.tables || []).forEach(function (id) {
    const t = B.salle.tableDe(S, id);
    t.groupe = null; t.sale = true;
  });
  const c = B.salle.centre(g.tables);
  g.x = c.x; g.y = c.y;
  g.etat = 'depart';
  g.chemin = B.salle.chemin(g, B.DATA.salle.entree).concat([{ x: B.DATA.salle.dehors.x, y: B.DATA.salle.dehors.y }]);
  if (g.aMange) S.stats.jour.servis += g.taille;
};

B.clients.avancer = function (S, h) {
  const D = B.DATA.clients.durees, v = B.DATA.clients.vitesses.clients * h;
  for (const g of S.groupes) {
    const ecoule = S.minute - g.depuis;
    if (g.etat === 'marche') {
      if (B.salle.bouger(g, v)) { g.etat = 'carte'; g.depuis = S.minute; g.duree = B.duree(S, D.lireCarte); }
    } else if (g.etat === 'carte') {
      if (ecoule >= g.duree) { g.etat = 'commande'; g.depuis = S.minute; }
    } else if (g.etat === 'cuisine') {
      if (S.minute >= g.pret) { g.etat = 'pret'; g.depuis = S.minute; }
    } else if (g.etat === 'mange') {
      if (ecoule >= g.duree) { g.etat = 'addition'; g.depuis = S.minute; }
    } else if (g.etat === 'depart' || g.etat === 'repart') {
      if (B.salle.bouger(g, v)) g.parti = true;
    }
  }
  S.groupes = S.groupes.filter(function (g) { return !g.parti; });
};
