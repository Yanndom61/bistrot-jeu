/* partie.js — créer une partie, faire passer le temps, finir la journée. */
B.statsVides = function () {
  return { groupes: 0, arrives: 0, servis: 0, repartis: 0, fileMax: 0, attenteCommande: 0, nbCommandes: 0,
    recettes: 0, pourboires: 0, couverts: 0, tickets: 0, coutMatiere: 0, platsRenvoyes: 0, platsVendus: {},
    achats: 0, gaspillage: 0, gaspillagePortions: 0, jetes: [], ruptures: 0, partisRupture: 0, mdjVendus: 0, emporter: 0, boissons: 0,
    formations: 0, partisSale: 0, avis: 0, repDelta: 0, salaires: 0, interim: 0, cotisations: 0, loyer: 0, charges: 0, tva: 0, pret: 0, indemnites: 0, divers: 0, prives: 0 };
};

B.nouvellePartie = function (o) {
  o = o || {};
  const R = B.DATA.regles, J = B.DATA.clients.journee, P = B.DATA.salle;
  const niveau = B.DATA.argent.niveaux[o.difficulte] ? o.difficulte : 'facile';
  const diff = B.DATA.argent.niveaux[niveau];
  void R;
  return {
    format: 'bistrot',
    version: B.VERSION_SAUVEGARDE,
    jeu: B.VERSION_JEU,
    creeLe: o.date || null,
    calendrier: { debut: (o.debut || o.date || '2026-11-25').slice(0, 10) },
    nom: (o.nom || B.t('nouvelle_nom_defaut')).trim().slice(0, 40),
    lieu: B.lieu(o.lieu || 'paris').id,
    difficulte: niveau,
    jour: 1,
    minute: J.ouverture,
    argent: diff.capital,
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
    interimAuto: !!B.DATA.equipe.interim.autoParDefaut[niveau],
    equipeReprise: 0,
    carte: null,
    stocks: null,
    cagnotte: 0,
    partages: [],
    proprete: B.DATA.equipe.effets.proprete.depart,
    tickets: [],
    stats: { jour: B.statsVides(), totalServis: 0, joursJoues: 0 },
    journal: [],
    finJour: false,
    bilan: null,
    origine: null,
    pret: null,
    decouvert: 0,
    faillite: null,
    historique: [],
    semaine: null,
    semaines: [],
    reporte: {},
    cal: B.ev.etatVide(),
    objectifs: { faits: {} },
    avis: [],
    totalAvis: 0,
    michelin: null
  };
};

/* Nouvelle partie complète : le patron seul, et des candidats qui attendent leur entretien. */
B.creerPartie = function (o) {
  const S = B.nouvellePartie(o);
  S.pret = B.argent.creerPret(S);
  S.semaine = B.argent.semaineVide(S, 1, S.jour);
  B.equipe.creerPatron(S);
  B.equipe.genererDepart(S);
  B.carte.creer(S);
  B.stock.creer(S);
  B.ev.matin(S);
  return S;
};

B.ouvrir = function (S) {
  if (S.ouvert || S.faillite || !B.equipe.peutOuvrir(S)) return false;
  S.ouvert = true;
  S.dejaOuvert = true;
  B.message(S, 'msg_ouverture');
  if (S.objectifs) B.objectifs.verifier(S);
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
  B.ev.pas(S);
  B.stock.livrer(S);
  B.menuJour.emporter(S, h);
  B.clients.placer(S);
  if (S.objectifs) B.objectifs.verifier(S);
  B.clients.avancer(S, h);
  B.cuisine.avancer(S);
  B.service.avancer(S, h);
  B.equipe.departs(S);
  B.finDeJournee(S);
};

B.finDeJournee = function (S) {
  const J = B.DATA.clients.journee;
  if (S.minute >= J.finForcee && S.groupes.length) {
    S.groupes.forEach(function (g) {
      if (g.aMange && g.etat !== 'depart') { S.stats.jour.servis += g.taille; B.carte.payer(S, g); }
      else if (!g.aMange && g.etat !== 'depart' && g.etat !== 'repart') S.stats.jour.repartis += g.taille;   /* v0.8.1 : pas encore mangé à la fermeture forcée = reparti */
    });
    S.groupes = [];
    S.tables.forEach(function (t) { t.groupe = null; t.sale = false; t.serveur = null; t.reserve = null; });
    S.equipe.forEach(function (w) { w.tache = null; w.chemin = []; });
    B.message(S, 'msg_fin_forcee');
  }
  const salePasFaite = S.tables.some(function (t) { return t.sale; });
  if (S.minute >= J.fermeture && !S.groupes.length && (!salePasFaite || S.minute >= J.finForcee)) {
    S.finJour = true;
    B.stock.soir(S);
    const st = S.stats.jour;
    const net = B.planning.nettoyageDuSoir(S);
    const partage = B.planning.dernierJourDuMois(S) ? B.planning.partager(S) : null;
    const compte = B.argent.soir(S);
    S.bilan = {
      jour: S.jour, servis: st.servis, repartis: st.repartis,
      attente: st.nbCommandes ? Math.round(st.attenteCommande / st.nbCommandes) : 0,
      recettes: st.recettes, couverts: st.couverts, tickets: st.tickets, pourboires: st.pourboires,
      ticketMoyen: st.tickets ? Math.round(st.recettes / st.tickets * 100) / 100 : 0,
      coutMatiere: Math.round(st.coutMatiere * 100) / 100, platsRenvoyes: st.platsRenvoyes,
      meilleurPlat: B.carte.meilleurPlat(S),
      achats: B.r2(st.achats), gaspillage: st.gaspillage, gaspillagePortions: st.gaspillagePortions, jetes: st.jetes,
      ruptures: Object.keys(S.stocks.ruptures).map(function (id) { const r = S.stocks.ruptures[id]; return { nom: r.nom, cause: r.cause, vars: r.vars, refus: r.refus, debut: r.debut, fin: r.fin, manque: r.manque }; }),
      prives: st.prives || 0,
      partisRupture: st.partisRupture, mdjVendus: st.mdjVendus, emporter: st.emporter, boissons: st.boissons,
      resultat: compte.resultat, depenses: compte.depenses, totalDepenses: compte.totalDepenses, caisse: S.argent,
      formations: B.r2(st.formations || 0), partisSale: st.partisSale || 0,
      proprete: net, partage: partage, cagnotte: S.cagnotte,
      absents: S.equipe.filter(function (p) { return p.absent; }).map(function (p) { return { nom: p.nom, pourquoi: p.absent }; }),
      reputation: B.rep.note(S), repDelta: st.repDelta || 0, nbAvis: st.avis || 0,
      avisJour: (S.avis || []).filter(function (a) { return a.jour === S.jour; }),
      autoCommande: S.stocks.derniereAuto && S.stocks.derniereAuto.jour === S.jour ? S.stocks.derniereAuto.total : 0
    };
    const cl = B.argent.cloturer(S, compte, st.servis, st.repartis);
    S.bilan.semaine = cl.semaine; S.bilan.alerte = cl.alerte; S.bilan.faillite = cl.faillite;
    S.stats.totalServis += st.servis;
    S.stats.joursJoues++;
    B.message(S, 'msg_fin_service');
    if (cl.faillite) { S.ouvert = false; B.message(S, 'msg_faillite'); }
    else if (cl.alerte) B.message(S, 'msg_decouvert', { soir: cl.alerte.soir, max: cl.alerte.max });
    if (S.objectifs) B.objectifs.verifier(S);
  }
};

B.jourSuivant = function (S) {
  const P = B.DATA.salle;
  if (S.faillite) return false;
  S.jour++;
  S.minute = B.DATA.clients.journee.ouverture;
  S.stats.jour = B.statsVides();
  for (const k in (S.reporte || {})) S.stats.jour[k] = B.r2((S.stats.jour[k] || 0) + S.reporte[k]);
  S.reporte = {};
  S.finJour = false;
  B.stock.matin(S);
  S.bilan = null;
  S.groupes = [];
  B.equipe.matin(S);
  S.tables.forEach(function (t) { t.groupe = null; t.sale = false; t.serveur = null; t.reserve = null; });
  B.ev.matin(S);
  B.rep.michelinMatin(S);   /* v1.0 : étoile Michelin (ancien jeu) */
  S.equipe.forEach(function (w) { const b = B.equipe.base(S, w); w.x = b.x; w.y = b.y; w.chemin = []; w.tache = null; });
  B.equipe.nouveauxCandidats(S);
  S.ouvert = B.equipe.peutOuvrir(S);
  void P;
  return true;
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
  if (!isFinite(S.argent)) pb.push('argent impossible');
  if (S.stocks) for (const i in S.stocks.lots) S.stocks.lots[i].forEach(function (l) { if (!(l.q >= -1e-6)) pb.push('stock négatif : ' + i); });
  ['groupes', 'arrives', 'servis', 'repartis', 'fileMax', 'attenteCommande', 'nbCommandes', 'recettes', 'pourboires', 'couverts', 'coutMatiere', 'platsRenvoyes', 'achats', 'gaspillage'].forEach(function (k) {
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
    if (t.groupe && t.reserve) pb.push('table ' + t.id + ' réservée et occupée à la fois');
  });
  S.groupes.forEach(function (g) {
    const assis = ['marche', 'carte', 'commande', 'cuisine', 'pret', 'mange', 'addition'].indexOf(g.etat) >= 0;
    if (assis && !(g.tables && g.tables.length)) pb.push('groupe ' + g.id + ' sans table');
    if (assis) {
      const places = g.tables.reduce(function (s, id) { return s + B.salle.geo(id).places; }, 0);
      if (places < g.taille) pb.push('groupe ' + g.id + ' trop nombreux pour sa table');
    }
    if (['commande', 'pret', 'addition', 'cuisine'].indexOf(g.etat) >= 0 && S.minute - g.depuis > 120 * (g.etat === 'cuisine' ? B.ev.facteurCuisine(S) : 1)) pb.push('groupe ' + g.id + ' oublié depuis plus de 90 min (' + g.etat + ')');
  });
  S.equipe.forEach(function (w) {
    if (w.tache && w.tache.groupe && !S.groupes.find(function (g) { return g.id === w.tache.groupe; })) pb.push('serveur ' + w.nom + ' sert un groupe disparu');
    if (w.service === 'salle' && w.salaire < 0) pb.push('salaire négatif');
  });
  if (S.equipe.filter(function (p) { return p.patron; }).length !== 1) pb.push('il faut exactement un patron');
  S.equipe.forEach(function (p) {
    if (p.absent && (p.tache || S.groupes.some(function (g) { return g.cuisinier === p.id && g.etat === 'cuisine'; }))) pb.push(p.nom + ' travaille alors qu’il est absent');
    if (!B.equipe.aDesRepos(p)) { if (p.absent) pb.push(p.nom + ' (patron ou intérim) ne devrait pas être absent'); return; }
    if (!p.repos || p.repos.length !== 2 || (p.repos[0] + 1) % 7 !== p.repos[1]) pb.push(p.nom + ' : les 2 jours de repos ne se suivent pas');
    if (p.absent === 'repos' && !B.planning.estRepos(p, B.jourSemaine(S))) pb.push(p.nom + ' en repos un jour travaillé');
  });
  if (!(S.cagnotte >= -0.001)) pb.push('cagnotte négative');
  if (!(S.proprete >= 0 && S.proprete <= 100)) pb.push('propreté hors limites');
  S.groupes.forEach(function (g) {
    if (g.cuisinier && !S.equipe.find(function (p) { return p.id === g.cuisinier && p.service === 'cuisine'; })) pb.push('groupe ' + g.id + ' attend un cuisinier absent');
  });
  if (!B.DATA.argent.niveaux[S.difficulte]) pb.push('difficulté inconnue');
  if (S.pret && !(S.pret.restant >= 0 && S.pret.restant <= S.pret.montant + 0.01)) pb.push('prêt impossible');
  if (S.argent < -B.DATA.argent.decouvertAutorise - 50000) pb.push('argent bien trop négatif sans faillite');
  if ((S.decouvert || 0) >= B.DATA.argent.faillite.soirsDeSuite && !S.faillite) pb.push('faillite oubliée');
  S.equipe.forEach(function (p) { if (!p.patron && !p.interim && !(p.embauche >= 1)) pb.push(p.nom + ' sans jour d’embauche'); });
  if (!S.cal) pb.push('calendrier absent');
  else {
    S.cal.prives.forEach(function (e) { if (e.etat === 'reserve' && !(e.prix > 0 && e.n > 0)) pb.push('événement privé sans prix'); });
    if (S.cal.attente && S.cal.attente.id !== 'resultat' && S.cal.attente.id !== 'michelin' && !B.ev.defEvenement(S.cal.attente.id)) pb.push('événement du jour inconnu');
  }
  if (!(B.rep.note(S) >= B.rep.D().min - 1e-9 && B.rep.note(S) <= B.rep.D().max + 1e-9)) pb.push('réputation impossible');
  if (!Array.isArray(S.avis)) pb.push('avis absents');
  return pb;
};
