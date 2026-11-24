/* partie.js — créer une partie, faire passer le temps, finir la journée. */
B.statsVides = function () {
  return { groupes: 0, arrives: 0, servis: 0, repartis: 0, fileMax: 0, attenteCommande: 0, nbCommandes: 0 };
};

B.nouvellePartie = function (o) {
  o = o || {};
  const R = B.DATA.regles, J = B.DATA.clients.journee, P = B.DATA.salle;
  const diff = R.difficultes.facile;
  return {
    format: 'bistrot',
    version: B.VERSION_SAUVEGARDE,
    jeu: B.VERSION_JEU,
    creeLe: o.date || null,
    nom: (o.nom || B.t('nouvelle_nom_defaut')).trim().slice(0, 40),
    lieu: B.lieu(o.lieu || 'paris').id,
    difficulte: 'facile',
    jour: 1,
    minute: J.ouverture,
    argent: diff.capitalDepart,
    note: diff.noteDepart,
    vitesse: 1,
    graine: (o.graine != null ? o.graine : Math.floor(Math.random() * 2147483647)) | 0,
    prochainId: 1,
    tables: P.tables.map(function (t) { return { id: t.id, places: t.places, groupe: null, sale: false, serveur: null }; }),
    groupes: [],
    equipe: [],
    candidats: [],
    ouvert: false,
    placement: 'auto',
    dejaOuvert: false,
    interimAuto: !!B.DATA.equipe.interim.autoParDefaut.facile,
    equipeReprise: 0,
    stats: { jour: B.statsVides(), totalServis: 0, joursJoues: 0 },
    journal: [],
    finJour: false,
    bilan: null,
    origine: null
  };
};

/* Nouvelle partie complète : le patron seul, et des candidats qui attendent leur entretien. */
B.creerPartie = function (o) {
  const S = B.nouvellePartie(o);
  B.equipe.creerPatron(S);
  B.equipe.genererDepart(S);
  return S;
};

B.ouvrir = function (S) {
  if (S.ouvert || !B.equipe.peutOuvrir(S)) return false;
  S.ouvert = true;
  S.dejaOuvert = true;
  B.message(S, 'msg_ouverture');
  return true;
};

/* Fait passer dt minutes de jeu, par petits pas d'un quart de minute. */
B.avancer = function (S, dt) {
  while (dt > 1e-9 && !S.finJour && S.ouvert) {
    const h = Math.min(0.25, dt);
    dt -= h;
    B.pas(S, h);
  }
};

B.pas = function (S, h) {
  const avant = S.minute;
  S.minute += h;
  B.DATA.clients.annonces.forEach(function (a) {
    if (avant < a.minute && S.minute >= a.minute) B.message(S, a.texte);
  });
  const parMinute = B.clients.affluence(S, S.minute) / 60;
  if (parMinute > 0 && B.hasard(S) < parMinute * h) B.clients.arrivee(S);
  B.clients.placer(S);
  B.clients.avancer(S, h);
  B.cuisine.avancer(S);
  B.service.avancer(S, h);
  B.equipe.departs(S);
  B.finDeJournee(S);
};

B.finDeJournee = function (S) {
  const J = B.DATA.clients.journee;
  if (S.minute >= J.finForcee && S.groupes.length) {
    S.groupes.forEach(function (g) { if (g.aMange && g.etat !== 'depart') S.stats.jour.servis += g.taille; });
    S.groupes = [];
    S.tables.forEach(function (t) { t.groupe = null; t.sale = false; t.serveur = null; });
    S.equipe.forEach(function (w) { w.tache = null; w.chemin = []; });
    B.message(S, 'msg_fin_forcee');
  }
  const salePasFaite = S.tables.some(function (t) { return t.sale; });
  if (S.minute >= J.fermeture && !S.groupes.length && (!salePasFaite || S.minute >= J.finForcee)) {
    S.finJour = true;
    const st = S.stats.jour;
    S.bilan = {
      jour: S.jour, servis: st.servis, repartis: st.repartis,
      attente: st.nbCommandes ? Math.round(st.attenteCommande / st.nbCommandes) : 0
    };
    S.stats.totalServis += st.servis;
    S.stats.joursJoues++;
    B.message(S, 'msg_fin_service');
  }
};

B.jourSuivant = function (S) {
  const P = B.DATA.salle;
  S.jour++;
  S.minute = B.DATA.clients.journee.ouverture;
  S.stats.jour = B.statsVides();
  S.finJour = false;
  S.bilan = null;
  S.groupes = [];
  B.equipe.matin(S);
  S.tables.forEach(function (t) { t.groupe = null; t.sale = false; t.serveur = null; });
  S.equipe.forEach(function (w) { const b = B.equipe.base(S, w); w.x = b.x; w.y = b.y; w.chemin = []; w.tache = null; });
  B.equipe.nouveauxCandidats(S);
  S.ouvert = B.equipe.peutOuvrir(S);
  void P;
};

/* Contrôle de cohérence, utilisé par le simulateur et les tests. Renvoie la liste des problèmes. */
B.verifier = function (S) {
  const pb = [];
  (function scan(o, chemin) {
    if (typeof o === 'number') {
      if (!isFinite(o)) pb.push('valeur impossible à ' + chemin);
      return;
    }
    if (o && typeof o === 'object') for (const k in o) scan(o[k], chemin + '.' + k);
  })(S, 'partie');
  const st = S.stats.jour;
  ['groupes', 'arrives', 'servis', 'repartis', 'fileMax', 'attenteCommande', 'nbCommandes'].forEach(function (k) {
    if (st[k] < 0) pb.push('compteur négatif : ' + k);
  });
  if (st.servis + st.repartis > st.arrives) pb.push('plus de clients sortis que de clients entrés');
  S.tables.forEach(function (t) {
    if (t.groupe) {
      const g = S.groupes.find(function (x) { return x.id === t.groupe; });
      if (!g) pb.push('table ' + t.id + ' occupée par un groupe disparu');
      else if (!g.tables || g.tables.indexOf(t.id) < 0) pb.push('table ' + t.id + ' et groupe ' + g.id + ' ne se correspondent pas');
    }
    if (t.groupe && t.sale) pb.push('table ' + t.id + ' occupée et sale à la fois');
  });
  S.groupes.forEach(function (g) {
    const assis = ['marche', 'carte', 'commande', 'cuisine', 'pret', 'mange', 'addition'].indexOf(g.etat) >= 0;
    if (assis && !(g.tables && g.tables.length)) pb.push('groupe ' + g.id + ' sans table');
    if (assis) {
      const places = g.tables.reduce(function (s, id) { return s + B.salle.geo(id).places; }, 0);
      if (places < g.taille) pb.push('groupe ' + g.id + ' trop nombreux pour sa table');
    }
    if (['commande', 'pret', 'addition', 'cuisine'].indexOf(g.etat) >= 0 && S.minute - g.depuis > 120) pb.push('groupe ' + g.id + ' oublié depuis plus de 90 min (' + g.etat + ')');
  });
  S.equipe.forEach(function (w) {
    if (w.tache && w.tache.groupe && !S.groupes.find(function (g) { return g.id === w.tache.groupe; })) pb.push('serveur ' + w.nom + ' sert un groupe disparu');
    if (w.service === 'salle' && w.salaire < 0) pb.push('salaire négatif');
  });
  if (S.equipe.filter(function (p) { return p.patron; }).length !== 1) pb.push('il faut exactement un patron');
  S.groupes.forEach(function (g) {
    if (g.cuisinier && !S.equipe.find(function (p) { return p.id === g.cuisinier && p.service === 'cuisine'; })) pb.push('groupe ' + g.id + ' attend un cuisinier absent');
  });
  if (S.argent < 0 && S.difficulte === 'facile') pb.push('argent négatif');
  return pb;
};
