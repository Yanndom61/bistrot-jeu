/* service.js — les serveurs : prendre les commandes, servir, encaisser, débarrasser. */
B.service = {};

/* Ordre de priorité : plat prêt (il refroidit), addition, commande, puis table à débarrasser. */
B.service.choisir = function (S, w) {
  let best = null;
  const prop = function (prio, depuis, tache) {
    if (!best || prio < best.prio || (prio === best.prio && depuis < best.depuis)) best = { prio: prio, depuis: depuis, tache: tache };
  };
  for (const g of S.groupes) {
    if (g.serveur) continue;
    if (g.etat === 'pret') prop(0, g.depuis, { type: 'servir', groupe: g.id });
    else if (g.etat === 'addition') prop(1, g.depuis, { type: 'addition', groupe: g.id });
    else if (g.etat === 'commande') prop(2, g.depuis, { type: 'commande', groupe: g.id });
  }
  for (const t of S.tables) {
    if (t.sale && !t.serveur) prop(3, 9999, { type: 'debarrasser', table: t.id });
  }
  return best ? best.tache : null;
};

B.service.groupe = function (S, id) { return S.groupes.find(function (g) { return g.id === id; }); };

/* Prépare les étapes d'une tâche : aller quelque part, puis agir un certain temps. */
B.service.preparer = function (S, w, tache) {
  const D = B.DATA.clients.durees, A = B.DATA.salle.allee;
  const auBord = function (ids) { return { x: B.salle.centre(ids).x, y: A }; };
  tache.etapes = [];
  if (tache.type === 'debarrasser') {
    const t = B.salle.tableDe(S, tache.table);
    t.serveur = w.id;
    tache.etapes.push({ aller: auBord([t.id]) }, { agir: D.debarrasserParTable });
  } else {
    const g = B.service.groupe(S, tache.groupe);
    g.serveur = w.id;
    if (tache.type === 'servir') tache.etapes.push({ aller: { x: B.DATA.salle.passe.x, y: A } }, { agir: D.prendrePlatPasse }, { aller: auBord(g.tables), porte: 'assiette' }, { agir: D.poserPlat, porte: 'assiette' });
    if (tache.type === 'commande') tache.etapes.push({ aller: auBord(g.tables) }, { agir: D.prendreCommande });
    if (tache.type === 'addition') tache.etapes.push({ aller: auBord(g.tables), porte: 'addition' }, { agir: D.addition, porte: 'addition' });
  }
  w.tache = tache;
  w.chemin = [];
};

B.service.terminer = function (S, w) {
  const tache = w.tache, D = B.DATA.clients.durees;
  w.tache = null;
  if (tache.type === 'debarrasser') {
    const t = B.salle.tableDe(S, tache.table);
    t.sale = false; t.serveur = null;
    return;
  }
  const g = B.service.groupe(S, tache.groupe);
  if (!g) return;
  g.serveur = null;
  if (tache.type === 'commande') {
    S.stats.jour.attenteCommande += S.minute - g.depuis;
    S.stats.jour.nbCommandes++;
    g.attenteCommande = S.minute - g.depuis;
    if (!g.commande) B.carte.commander(S, g);
    g.etat = 'cuisine'; g.depuis = S.minute; g.pret = null; g.cuisinier = null;
  } else if (tache.type === 'servir') {
    if (B.carte.verifierService(S, g)) return;
    const type = B.clients.type(g.type);
    g.etat = 'mange'; g.depuis = S.minute; g.duree = B.duree(S, type.repas); g.aMange = true;
  } else if (tache.type === 'addition') {
    B.carte.payer(S, g);
    B.clients.partir(S, g);
  }
};

B.service.avancer = function (S, h) {
  B.equipe.salle(S).forEach(function (w) {
    const f = B.equipe.facteurSalle(w), v = B.DATA.clients.vitesses.serveurs * f;
    let reste = h;
    let garde = 0;
    while (reste > 1e-9 && garde++ < 20) {
      if (!w.tache) {
        if (w.partant) return;
        const t = B.service.choisir(S, w);
        if (t) B.service.preparer(S, w, t);
        else {
          const base = B.equipe.base(S, w);
          if (!w.chemin.length && (Math.abs(w.x - base.x) > 1 || Math.abs(w.y - base.y) > 1)) w.chemin = B.salle.chemin(w, base);
          B.salle.bouger(w, v * reste);
          return;
        }
      }
      const e = w.tache.etapes[0];
      if (!e) { B.service.terminer(S, w); continue; }
      if (e.aller) {
        if (!w.chemin.length) w.chemin = B.salle.chemin(w, e.aller);
        const besoin = B.service.longueur(w) / v;
        if (besoin <= reste) { reste -= besoin; w.x = e.aller.x; w.y = e.aller.y; w.chemin = []; w.tache.etapes.shift(); }
        else { B.salle.bouger(w, v * reste); reste = 0; }
      } else if (e.agir != null) {
        if (e.agir / f <= reste) { reste -= e.agir / f; w.tache.etapes.shift(); }
        else { e.agir -= reste * f; reste = 0; }
      }
    }
  });
};

B.service.longueur = function (w) {
  let x = w.x, y = w.y, L = 0;
  for (const p of w.chemin) { L += Math.hypot(p.x - x, p.y - y); x = p.x; y = p.y; }
  return L;
};
