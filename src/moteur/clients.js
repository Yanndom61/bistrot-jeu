/* clients.js — arrivée des groupes, file à la porte, repas, départ. */
B.clients = {};

B.clients.type = function (id) {
  return B.DATA.clients.types.find(function (t) { return t.id === id; });
};

/* Nombre moyen de groupes qui arrivent par heure à cette minute de la journée. */
B.clients.affluence = function (S, minute) {
  const tr = B.DATA.clients.affluence.find(function (a) { return minute >= a.de && minute < a.a; });
  if (!tr) return 0;
  return tr.groupesParHeure * B.lieu(S.lieu).affluence * B.argent.niveau(S).affluence * (S.carte ? B.carte.facteurAffluence(S) : 1) * (S.cal ? B.cal.facteur(S, minute) : 1) * B.rep.facteurAffluence(S);
};

/* v0.8 : la part de touristes dépend du lieu, de la saison et des vacances ; les familles viennent plus
   les jours fériés, pendant les vacances et pour les fêtes des mères et des pères (ancien jeu). */
B.clients.poidsTypes = function (S) {
  const T = B.DATA.clients.types;
  if (!S.cal) return T.map(function (t) { return t.poids; });
  const n = B.cal.serieDuJour(S, 0), pt = B.cal.partTouristes(S, n), ff = B.cal.facteurFamilles(S, n, S.minute);
  const autres = T.filter(function (t) { return t.id !== 'touristes'; });
  let tot = 0; autres.forEach(function (t) { tot += t.poids * (t.id === 'famille' ? ff : 1); });
  return T.map(function (t) { return t.id === 'touristes' ? (pt >= 1 ? 1 : tot * pt / (1 - pt)) : t.poids * (t.id === 'famille' ? ff : 1); });
};
B.clients.tirerType = function (S) {
  const T = B.DATA.clients.types, W = B.clients.poidsTypes(S);
  let tot = 0; W.forEach(function (w) { tot += w; });
  let r = B.hasard(S) * tot;
  for (let k = 0; k < T.length; k++) { r -= W[k]; if (r < 0) return T[k]; }
  return T[T.length - 1];
};

B.clients.arrivee = function (S, o) {
  o = o || {};
  const type = o.type ? B.clients.type(o.type) : B.clients.tirerType(S);
  const taille = B.entier(S, type.taille[0], type.taille[1]);
  const noms = B.lieu(S.lieu).nomsClients;
  const e = B.DATA.salle.entree;
  const g = {
    id: S.prochainId++, type: type.id, taille: taille,
    nom: noms[B.entier(S, 0, noms.length - 1)],
    etat: 'file', depuis: S.minute, arrivee: S.minute,
    patience: B.duree(S, B.DATA.clients.durees.patienceFile) * (o.patience || 1),
    tables: null, x: e.x, y: e.y, chemin: [], duree: 0, serveur: null, cuisinier: null, pret: null, aMange: false
  };
  S.groupes.push(g);
  S.stats.jour.groupes++;
  S.stats.jour.arrives += taille;
  /* salle sale : certains font demi-tour en entrant */
  const fuite = B.planning.fuiteProprete(S);
  if (fuite > 0 && B.hasard(S) < fuite) {
    g.etat = 'repart';
    g.chemin = [{ x: B.DATA.salle.dehors.x, y: B.DATA.salle.dehors.y }];
    S.stats.jour.repartis += taille; S.stats.jour.partisSale = (S.stats.jour.partisSale || 0) + taille;
    B.rep.parti(S, 'sale');
    B.noter(S, 'msg_repart_sale', { taille: taille });
    return;
  }
  if (taille >= 5) B.message(S, 'msg_grand_groupe', { taille: taille, groupe: B.t('groupe_' + type.id, { nom: g.nom }) });
};

/* Place les groupes qui attendent à la porte, dans l'ordre d'arrivée, dès qu'une table convient. */
B.clients.placer = function (S) {
  let enFile = 0;
  for (const g of S.groupes) {
    if (g.etat !== 'file') continue;
    const ids = S.placement === 'manuel' ? null : B.salle.chercher(S, g.taille);
    if (ids) {
      B.clients.installer(S, g, ids);
    } else if (S.minute - g.depuis > g.patience) {
      g.etat = 'repart';
      g.chemin = [{ x: B.DATA.salle.dehors.x, y: B.DATA.salle.dehors.y }];
      S.stats.jour.repartis += g.taille;
      B.rep.parti(S, 'file');
      B.message(S, 'msg_repart', { taille: g.taille });
    } else enFile++;
  }
  S.stats.jour.fileMax = Math.max(S.stats.jour.fileMax, enFile);
};

B.clients.installer = function (S, g, ids) {
  ids.forEach(function (id) { B.salle.tableDe(S, id).groupe = g.id; });
  g.tables = ids;
  g.etat = 'marche';
  g.depuis = S.minute;
  g.chemin = B.salle.chemin(g, B.salle.centre(ids));
  if (ids.length > 1) B.message(S, 'msg_installe_rallonge', { num: B.salle.nomTables(ids), taille: g.taille });
};

/* Placement par le joueur : un groupe de la file sur une table touchée. Renvoie { ok } ou { erreur, vars }. */
B.clients.placerManuel = function (S, groupeId, tableId) {
  const g = S.groupes.find(function (x) { return x.id === groupeId && x.etat === 'file'; });
  const t = B.salle.tableDe(S, tableId);
  if (!g || !t) return { erreur: 'placement_occupee', vars: { num: tableId } };
  const libre = function (id) { const x = B.salle.tableDe(S, id); return x && !x.groupe && !x.sale && !x.reserve; };
  if (!libre(tableId)) return { erreur: 'placement_occupee', vars: { num: tableId } };
  if (t.places >= g.taille) { B.clients.installer(S, g, [tableId]); return { ok: true }; }
  const r = B.DATA.salle.rallonges.find(function (r) { return r.indexOf(tableId) >= 0; });
  if (r) {
    const total = r.reduce(function (s, id) { return s + B.salle.tableDe(S, id).places; }, 0);
    if (total >= g.taille && r.every(libre)) { B.clients.installer(S, g, r.slice()); return { ok: true }; }
    if (total >= g.taille) { const autre = r.find(function (id) { return id !== tableId; }); return { erreur: 'placement_occupee', vars: { num: autre } }; }
  }
  if (g.taille >= 5) return { erreur: 'placement_rallonge', vars: { taille: g.taille } };
  return { erreur: 'placement_trop_petite', vars: { num: tableId, places: t.places, taille: g.taille } };
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
      if (g.cuisinier && g.pret != null && S.minute >= g.pret) { B.carte.finirCuisson(S, g); g.etat = 'pret'; g.depuis = S.minute; g.cuisinier = null; }
    } else if (g.etat === 'mange') {
      if (ecoule >= g.duree) { g.etat = 'addition'; g.depuis = S.minute; }
    } else if (g.etat === 'depart' || g.etat === 'repart') {
      if (B.salle.bouger(g, v)) g.parti = true;
    }
  }
  S.groupes = S.groupes.filter(function (g) { return !g.parti; });
};
