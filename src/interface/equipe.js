/* equipe.js (écran) — volet Équipe : ton équipe, les candidats, les entretiens et l'ouverture du restaurant. */
UI.candidatCourant = null;
UI.renvoiCourant = null;   /* id de l'employé dont on confirme le renvoi */
UI.renvoiRefus = null;     /* { id, texte } : pourquoi on ne peut pas le renvoyer */
UI.prenom = function (p) { return String(p.nom).split(' ')[0]; };
UI.tGenre = function (cle, p, vars) { return B.tChoix(cle, 0, vars, p.genre); };

UI.eqOnglet = 'equipe';   /* equipe | embauche | planning | formations | cagnotte */
UI.ficheCourante = null;  /* id de l'employé dont la fiche est ouverte */
UI.eqMsg = null;          /* { texte, ok } : réponse à la dernière action */

UI.htmlEquipe = function () {
  const S = UI.S;
  if (UI.candidatCourant) return UI.htmlEntretien(UI.candidatCourant);
  const aRenvoyer = UI.renvoiCourant != null && S.equipe.find(function (x) { return x.id === UI.renvoiCourant; });
  if (aRenvoyer) return UI.htmlRenvoi(aRenvoyer);
  const fiche = UI.ficheCourante != null && S.equipe.find(function (x) { return x.id === UI.ficheCourante; });
  if (fiche) return UI.htmlFicheEmploye(fiche);
  let h = '';
  if (!S.ouvert) {
    h += '<div class="alerte-equipe">' + UI.esc(B.t('equipe_avant_ouverture'));
    if (!B.equipe.actifs(S, 'salle').length) h += '<br><b>' + UI.esc(B.t('equipe_manque_salle')) + '</b>';
    if (!B.equipe.actifs(S, 'cuisine').length) h += '<br><b>' + UI.esc(B.t('equipe_manque_cuisine')) + '</b>';
    h += '</div>';
    h += '<button type="button" class="gros principal" data-eq="ouvrir"' + (B.equipe.peutOuvrir(S) ? '' : ' disabled') + '>' + UI.esc(B.t('equipe_ouvrir')) + '</button>';
  }
  h += UI.onglets('data-eq-onglet', [['equipe', B.t('eq_onglet_equipe')], ['embauche', B.t('eq_onglet_embauche')], ['planning', B.t('eq_onglet_planning')], ['formations', B.t('eq_onglet_formations')], ['cagnotte', B.t('eq_onglet_cagnotte')]], UI.eqOnglet);
  if (UI.eqMsg) h += '<div class="refus' + (UI.eqMsg.ok ? ' ok' : '') + '">' + UI.esc(UI.eqMsg.texte) + '</div>';
  h += '<div class="gros-texte">';
  if (UI.eqOnglet === 'embauche') h += UI.htmlEmbauche();
  else if (UI.eqOnglet === 'planning') h += UI.htmlPlanning();
  else if (UI.eqOnglet === 'formations') h += UI.htmlFormations();
  else if (UI.eqOnglet === 'cagnotte') h += UI.htmlCagnotte();
  else h += UI.htmlTonEquipe();
  return h + '</div>';
};

/* Jours de repos en toutes lettres : « lundi et mardi ». */
UI.texteRepos = function (p) {
  const J = B.DATA.textes.jours_semaine;
  return p.repos ? B.t('eq_repos_jours', { a: J[p.repos[0]], b: J[p.repos[1]] }) : '';
};
/* Prochain jour où la personne travaille (pour une formation), en date lisible. */
UI.prochainJourTravaille = function (S, p) {
  for (let d = 1; d <= 8; d++) if (!B.planning.estRepos(p, B.jourSemaine(S, S.jour + d))) return B.texteDate(S, d);
  return B.texteDate(S, 1);
};
UI.etatDuJour = function (S, p) {
  if (p.partant) return UI.tGenre('equipe_partant', p);
  if (p.absent === 'repos') return B.t('eq_aujourdhui_repos');
  if (p.absent === 'malade') return B.t('eq_aujourdhui_malade');
  if (p.demission) return B.t('eq_demission');
  if (p.absent === 'formation') return B.t('eq_aujourdhui_formation', { formation: B.t('form_nom_' + p.formation.id) });
  let t = B.t('eq_aujourdhui_travail');
  if (p.formation) t += ' · ' + B.t('eq_formation_prevue', { formation: B.t('form_nom_' + p.formation.id), jour: UI.prochainJourTravaille(S, p) });
  return t;
};

UI.htmlTonEquipe = function () {
  const S = UI.S, ef = B.equipe.effectif(S), G = B.DATA.equipe.effectif.groupes;
  let h = '<p class="effectif">' + UI.esc(B.t('equipe_effectif', { n: ef.n, total: ef.total, salle: ef.groupes.salle, maxSalle: G.salle, cuisine: ef.groupes.cuisine, maxCuisine: G.cuisine, nett: ef.groupes.nettoyage, maxNett: G.nettoyage })) + '</p>';
  const pr = S.proprete == null ? 80 : S.proprete;
  h += '<p>' + UI.esc(B.t('eq_proprete', { n: pr })) + '<span class="jauge"><i style="width:' + pr + '%" class="' + (pr < 25 ? 'rouge' : pr < 50 ? 'orange' : '') + '"></i></span>' + (pr < B.DATA.equipe.effets.proprete.seuilEtoiles ? '<br><b class="rouge-txt">' + UI.esc(B.t('eq_proprete_basse')) + '</b>' : '') + '</p>';
  const ordre = { salle: 0, bar: 1, cuisine: 2, plonge: 3, nettoyage: 4 };
  S.equipe.slice().sort(function (a, b) { return (b.patron ? 1 : 0) - (a.patron ? 1 : 0) || (ordre[a.service] - ordre[b.service]); }).forEach(function (p) {
    const service = B.t('equipe_service_' + p.service);
    if (p.patron) {
      const peut = B.equipe.patronPeutChanger(S);
      h += '<div class="personne"><div><div class="nom">' + UI.esc(B.t('equipe_patron_ligne', { service: service })) + '</div>' +
        '<div class="sous">' + UI.esc(B.t('eq_patron_repos')) + '</div>' +
        (peut ? '' : '<div class="sous">' + UI.esc(B.t('equipe_patron_bloque')) + '</div>') + '</div>' +
        '<button type="button" class="petit-btn" data-eq="patron"' + (peut ? '' : ' disabled') + '>' +
        UI.esc(B.t(p.service === 'salle' ? 'equipe_patron_vers_cuisine' : 'equipe_patron_vers_salle')) + '</button></div>';
      return;
    }
    h += '<div class="personne' + (p.absent ? ' absent' : '') + '"><div><div class="nom">' + UI.esc(p.nom) + '</div><div class="sous">' +
      UI.esc(p.interim ? B.t('equipe_interim_ligne', { poste: B.equipe.nomPoste(p), service: service, salaire: B.equipe.euroHeure(p.salaire) })
        : B.t('equipe_membre_ligne', { poste: B.equipe.nomPoste(p), service: service, note: p.note, salaire: B.equipe.euroHeure(p.salaire) })) + '</div>' +
      (p.interim ? '' : '<div class="etat">' + UI.esc(UI.etatDuJour(S, p)) + '</div><div class="sous">' + UI.esc(UI.texteRepos(p)) + '</div>') +
      (UI.renvoiRefus && UI.renvoiRefus.id === p.id ? '<div class="refus">' + UI.esc(UI.renvoiRefus.texte) + '</div>' : '') + '</div>' +
      (p.interim || p.partant ? '' : '<button type="button" class="petit-btn" data-eq="fiche" data-id="' + p.id + '">' + UI.esc(B.t('eq_fiche')) + '</button>') +
      (p.partant ? '' : '<button type="button" class="petit-btn" data-eq="renvoyer" data-id="' + p.id + '">' + UI.esc(B.t('equipe_renvoyer')) + '</button>') + '</div>';
  });
  if (S.equipe.length > 1) h += '<p>' + UI.esc(B.t('equipe_cout', { mois: B.euros(B.equipe.coutMensuel(S)) })) + ' <i>' + UI.esc(B.t('equipe_cout_info')) + '</i></p>';
  return h;
};

UI.htmlEmbauche = function () {
  const S = UI.S;
  let h = '<h3>' + UI.esc(B.t('equipe_candidats')) + '</h3>';
  if (!S.candidats.length) h += '<p>' + UI.esc(B.t('equipe_aucun_candidat')) + '</p>';
  S.candidats.forEach(function (c) {
    const pl = B.equipe.place(c.poste), libre = B.equipe.placeLibre(S, c.poste);
    h += '<div class="personne"><div><div class="nom">' + UI.esc(c.nom) + '</div><div class="sous">' +
      UI.esc(B.t('equipe_candidat_ligne', { poste: B.equipe.nomPoste(c), age: c.age, experience: B.equipe.texteExperience(c) })) + ' · ' +
      UI.esc(B.t('equipe_candidat_perso', { adj: B.equipe.adj(c) })) + '</div>' +
      (libre ? '' : '<div class="sous partant">' + UI.esc(B.t('equipe_poste_complet', { n: B.equipe.occupes(S, pl), max: pl.nombre })) + '</div>') + '</div>' +
      (libre ? '<button type="button" class="petit-btn principal" data-eq="entretien" data-id="' + c.id + '">' + UI.esc(B.t('equipe_entretien')) + '</button>' : '') + '</div>';
  });
  /* Intérim : un remplaçant pour la journée sur une place vide ou une personne absente */
  h += '<h3>' + UI.esc(B.t('equipe_interim_titre')) + '</h3><p class="sous">' + UI.esc(B.t('equipe_interim_info')) + '</p>';
  ['salle', 'cuisine'].forEach(function (sv) {
    const non = B.equipe.interimPossible(S, sv);
    h += '<div class="personne"><div>' + (non ? '<div class="sous">' + UI.esc(B.t(non)) + '</div>' : '') + '</div>' +
      '<button type="button" class="petit-btn" data-eq="interim" data-sv="' + sv + '"' + (non ? ' disabled' : '') + '>' +
      UI.esc(B.t('equipe_interim_' + sv, { salaire: B.equipe.euroHeure(B.equipe.salaireInterim(S, sv)) })) + '</button></div>';
  });
  h += '<div class="ligne-reglage"><span>' + UI.esc(B.t('equipe_interim_auto')) + '</span>' +
    '<button type="button" class="bascule' + (S.interimAuto ? ' on' : '') + '" data-eq="interim-auto">' + UI.esc(B.t(S.interimAuto ? 'menu_oui' : 'menu_non')) + '</button></div>';
  /* Les 16 places fixées dans Chez YaYa */
  h += '<h3>' + UI.esc(B.t('equipe_places_titre')) + '</h3><p class="sous">';
  h += B.DATA.equipe.effectif.places.map(function (pl) {
    return UI.esc(B.t('equipe_place_ligne', { nom: pl.nom, n: B.equipe.occupes(S, pl), max: pl.nombre }));
  }).join('<br>') + '</p>';
  return h;
};

/* Planning : qui travaille chaque jour de la semaine, et les 2 jours de repos de chacun. */
UI.htmlPlanning = function () {
  const S = UI.S, J = B.DATA.textes.jours_semaine, auj = B.jourSemaine(S);
  const jours = [1, 2, 3, 4, 5, 6, 0];
  let h = '<p>' + UI.esc(B.t('eq_planning_intro')) + '</p>';
  h += '<table class="planning"><thead><tr><th></th>' + jours.map(function (j) { return '<th' + (j === auj ? ' class="auj"' : '') + '>' + UI.esc(J[j].slice(0, 3)) + '</th>'; }).join('') + '</tr></thead><tbody>';
  const cv = {}; jours.forEach(function (j) { cv[j] = B.planning.couverture(S, j); });
  ['salle', 'bar', 'cuisine', 'plonge', 'nettoyage'].forEach(function (sv) {
    h += '<tr><th>' + UI.esc(B.t('eq_service_court_' + sv)) + '</th>' + jours.map(function (j) {
      const n = cv[j][sv] || 0, rouge = n === 0 && (sv === 'salle' || sv === 'cuisine');
      return '<td class="' + (rouge ? 'vide' : '') + (j === auj ? ' auj' : '') + '">' + n + '</td>';
    }).join('') + '</tr>';
  });
  h += '</tbody></table>';
  const trous = jours.filter(function (j) { return !cv[j].salle || !cv[j].cuisine; });
  if (trous.length) h += '<div class="alerte">' + UI.esc(B.t(S.interimAuto ? 'eq_planning_trou_interim' : 'eq_planning_trou', { jours: trous.map(function (j) { return J[j]; }).join(', ') })) + '</div>';
  const gens = S.equipe.filter(function (p) { return B.equipe.aDesRepos(p) && !p.partant; });
  if (!gens.length) h += '<p>' + UI.esc(B.t('eq_personne')) + '</p>';
  gens.forEach(function (p) {
    h += '<div class="personne"><div><div class="nom">' + UI.esc(p.nom) + ' <span class="sous">· ' + UI.esc(B.equipe.nomPoste(p)) + '</span></div>' +
      '<div class="etat">' + UI.esc(UI.texteRepos(p)) + '</div></div>' +
      '<button type="button" class="petit-btn mini gros-mini" data-eq="repos-moins" data-id="' + p.id + '" aria-label="' + UI.esc(B.t('eq_repos_avant')) + '">◀</button>' +
      '<button type="button" class="petit-btn mini gros-mini" data-eq="repos-plus" data-id="' + p.id + '" aria-label="' + UI.esc(B.t('eq_repos_apres')) + '">▶</button></div>';
  });
  return h;
};

UI.htmlFormations = function () {
  const S = UI.S;
  let h = '<p>' + UI.esc(B.t('eq_formations_intro')) + '</p>';
  const gens = S.equipe.filter(function (p) { return B.equipe.aDesRepos(p) && !p.partant; });
  if (!gens.length) h += '<p>' + UI.esc(B.t('eq_personne')) + '</p>';
  gens.forEach(function (p) {
    const fam = B.equipe.famille(p.service);
    const q = B.t('eq_qualites_court', { v: p.vitesse, a: fam === 'salle' ? B.t('entretien_amabilite') : B.t('entretien_qualite'), n: fam === 'salle' ? p.amabilite : p.qualite }) + (p.sommelier ? ' · ' + B.t('eq_sommelier') : '');
    h += '<div class="personne"><div><div class="nom">' + UI.esc(p.nom) + ' <span class="sous">· ' + UI.esc(B.equipe.nomPoste(p)) + '</span></div>' +
      '<div class="sous">' + UI.esc(q) + '</div>' +
      (p.formation ? '<div class="etat">' + UI.esc(p.absent === 'formation' ? B.t('eq_aujourdhui_formation', { formation: B.t('form_nom_' + p.formation.id) }) : B.t('eq_formation_prevue', { formation: B.t('form_nom_' + p.formation.id), jour: UI.prochainJourTravaille(S, p) })) + '</div>' : '') + '</div>' +
      '<button type="button" class="petit-btn principal" data-eq="fiche" data-id="' + p.id + '">' + UI.esc(B.t('eq_choisir_formation')) + '</button></div>';
  });
  return h;
};

UI.dernierSoirDuMois = function (S) {
  for (let d = 0; d < 32; d++) if (B.mois(S, d + 1) !== B.mois(S, d)) return d;
  return 0;
};
UI.htmlCagnotte = function () {
  const S = UI.S, gens = B.planning.beneficiaires(S), pot = S.cagnotte || 0;
  let h = '<div class="cagnotte"><span>' + UI.esc(B.t('eq_cagnotte_montant')) + '</span><b>' + UI.esc(B.prix(pot)) + '</b></div>';
  const d = UI.dernierSoirDuMois(S), passe = d === 0 && S.finJour;
  h += '<p>' + UI.esc(B.t('eq_cagnotte_regle')) + '</p>';
  if (gens.length && pot < gens.length) h += '<p><b>' + UI.esc(B.t('eq_cagnotte_prochain_court', { date: passe ? B.texteDate(S, UI.dernierSoirDuMois({ jour: S.jour + 1, calendrier: S.calendrier }) + 1) : B.texteDate(S, d), n: gens.length })) + '</b></p>';
  else if (gens.length) h += '<p><b>' + UI.esc(B.t('eq_cagnotte_prochain', { date: passe ? B.texteDate(S, UI.dernierSoirDuMois({ jour: S.jour + 1, calendrier: S.calendrier }) + 1) : B.texteDate(S, d), n: gens.length, part: B.prix(Math.floor(pot / gens.length * 100) / 100) })) + '</b></p>';
  else h += '<p><b>' + UI.esc(B.t('eq_cagnotte_personne')) + '</b></p>';
  h += '<h3>' + UI.esc(B.t('eq_cagnotte_historique')) + '</h3>';
  if (!(S.partages || []).length) h += '<p class="sous">' + UI.esc(B.t('eq_cagnotte_aucun')) + '</p>';
  (S.partages || []).forEach(function (r) {
    h += '<div class="ligne-st"><span>' + UI.esc(B.DATA.textes.mois_noms[r.mois] + ' ' + r.annee) + '</span><span class="qte"><b>' + UI.esc(B.prix(r.total)) + '</b><span class="sous">' + UI.esc(B.t('eq_cagnotte_parts', { n: r.n, part: B.prix(r.part) })) + '</span></span></div>';
  });
  if (gens.length) {
    h += '<h3>' + UI.esc(B.t('eq_cagnotte_recu')) + '</h3>';
    gens.forEach(function (p) { h += '<div class="ligne-st"><span>' + UI.esc(p.nom) + '</span><b>' + UI.esc(B.prix(p.pourboires || 0)) + '</b></div>'; });
  }
  return h;
};

/* Fiche d'un employé : ses qualités et ce qu'elles changent, ses jours de repos, ses formations. */
UI.htmlFicheEmploye = function (p) {
  const S = UI.S, fam = B.equipe.famille(p.service);
  let h = '';
  if (UI.eqMsg) h += '<div class="refus' + (UI.eqMsg.ok ? ' ok' : '') + '">' + UI.esc(UI.eqMsg.texte) + '</div>';
  h += '<div class="gros-texte"><p><b>' + UI.esc(B.equipe.nomPoste(p) + ' · ' + B.t('equipe_service_' + p.service)) + '</b> · ' + UI.esc(B.t('eq_note', { n: p.note })) +
    (p.perso ? ' · ' + UI.esc(B.t('equipe_candidat_perso', { adj: B.equipe.adj(p) })) : '') + '</p>';
  h += '<p class="etat">' + UI.esc(UI.etatDuJour(S, p)) + '</p>';
  if (p.embauche) h += '<p class="sous">' + UI.esc(UI.tGenre(S.jour - p.embauche < B.DATA.argent.indemnites.essaiJours ? 'eq_embauche_essai' : 'eq_embauche', p, { jour: p.embauche, fin: p.embauche + B.DATA.argent.indemnites.essaiJours, jourSalaire: B.euros(B.argent.salaireJour(p)) })) + '</p>';
  h += '<div class="qualites">';
  const ligne = function (nom, v, effet) {
    return '<div class="qualite"><span class="q-nom">' + UI.esc(nom) + '</span><b>' + v + '/10</b><span class="q-effet">' + UI.esc(effet) + '</span></div>';
  };
  h += ligne(B.t('entretien_vitesse'), p.vitesse, B.t('eq_effet_vitesse_' + p.service));
  if (fam === 'salle') h += ligne(B.t('entretien_amabilite'), p.amabilite, B.t(p.service === 'salle' ? 'eq_effet_amabilite' : 'eq_effet_sans'));
  else h += ligne(B.t('entretien_qualite'), p.qualite, B.t(p.service === 'cuisine' ? 'eq_effet_qualite_cuisine' : p.service === 'nettoyage' ? 'eq_effet_qualite_nettoyage' : 'eq_effet_sans'));
  h += '</div>';
  if (B.DATA.textes['eq_effet_poste_' + p.poste]) h += '<p class="sous">' + UI.esc(UI.tGenre('eq_effet_poste_' + p.poste, p)) + '</p>';
  if (fam === 'salle') h += '<p class="sous">' + UI.esc(UI.tGenre(p.sommelier ? 'eq_sommelier_oui' : 'eq_sommelier_non', p)) + '</p>';
  /* Jours de repos */
  h += '<h3>' + UI.esc(B.t('eq_repos_titre')) + '</h3><div class="personne"><div><div class="nom">' + UI.esc(UI.texteRepos(p)) + '</div><div class="sous">' + UI.esc(B.t('eq_repos_effet')) + '</div></div>' +
    '<button type="button" class="petit-btn mini gros-mini" data-eq="repos-moins" data-id="' + p.id + '" aria-label="' + UI.esc(B.t('eq_repos_avant')) + '">◀</button>' +
    '<button type="button" class="petit-btn mini gros-mini" data-eq="repos-plus" data-id="' + p.id + '" aria-label="' + UI.esc(B.t('eq_repos_apres')) + '">▶</button></div>';
  /* Formations */
  h += '<h3>' + UI.esc(B.t('eq_formations_titre')) + '</h3>';
  if (p.formation) {
    h += '<div class="alerte finie">' + UI.esc(p.absent === 'formation' ? B.t('eq_aujourdhui_formation', { formation: B.t('form_nom_' + p.formation.id) })
      : B.t('eq_formation_prevue', { formation: B.t('form_nom_' + p.formation.id), jour: UI.prochainJourTravaille(S, p) })) + '</div>';
    if (p.absent !== 'formation') h += '<button type="button" class="gros" data-eq="form-annuler" data-id="' + p.id + '">' + UI.esc(B.t('eq_formation_annuler', { prix: B.euros(p.formation.prix) })) + '</button>';
  }
  B.planning.formationsPour(S, p).forEach(function (f) {
    const desc = B.t('form_desc_' + f.id, f.stat ? { de: p[f.stat], a: Math.min(10, p[f.stat] + 1) } : null);
    h += '<div class="ligne-st form"><span><b>' + UI.esc(B.t('form_nom_' + f.id)) + '</b><br><span class="sous">' + UI.esc(desc) + '</span>' +
      (f.non && f.non !== 'form_non_inscrit' ? '<br><span class="sous rouge-txt">' + UI.esc(B.t(f.non)) + '</span>' : '') + '</span>' +
      '<button type="button" class="petit-btn principal form-btn" data-eq="form-inscrire" data-id="' + p.id + '" data-f="' + f.id + '"' + (f.non ? ' disabled' : '') + '>' + UI.esc(B.t('eq_formation_inscrire', { prix: B.euros(f.prix) })) + '</button></div>';
  });
  if ((p.formations || []).length) h += '<p class="sous">' + UI.esc(B.t('eq_formations_suivies', { liste: p.formations.map(function (id) { return B.t('form_nom_' + id); }).join(', ') })) + '</p>';
  h += '<p class="sous">' + UI.esc(B.t('eq_pourboires_recus', { total: B.prix(p.pourboires || 0) })) + '</p></div>';
  h += '<div class="rang"><button type="button" class="gros" data-eq="fiche-retour">' + UI.esc(B.t('entretien_retour')) + '</button>' +
    '<button type="button" class="gros" data-eq="renvoyer" data-id="' + p.id + '">' + UI.esc(B.t('equipe_renvoyer')) + '</button></div>';
  if (UI.renvoiRefus && UI.renvoiRefus.id === p.id) h += '<div class="refus">' + UI.esc(UI.renvoiRefus.texte) + '</div>';
  return h;
};

UI.htmlEntretien = function (c) {
  const S = UI.S, service = B.equipe.famille(B.equipe.poste(c.poste).service);
  const encore = S.candidats.some(function (x) { return x.id === c.id; });
  const val = function (cle, v) { return c.revele[cle] ? B.t('entretien_note', { n: v }) : B.t('entretien_inconnu'); };
  let h = '<p><b>' + UI.esc(B.t('entretien_fiche', { poste: B.equipe.nomPoste(c), age: c.age, experience: B.equipe.texteExperience(c), adj: B.equipe.adj(c) })) + '</b></p>';
  h += '<div class="fiche"><span>' + UI.esc(B.t('entretien_vitesse')) + '</span><span>' + UI.esc(val('vitesse', c.vitesse)) + '</span>';
  if (service === 'cuisine') h += '<span>' + UI.esc(B.t('entretien_qualite')) + '</span><span>' + UI.esc(val('qualite', c.qualite)) + '</span>';
  else h += '<span>' + UI.esc(B.t('entretien_amabilite')) + '</span><span>' + UI.esc(val('amabilite', c.amabilite)) + '</span>';
  h += '<span>' + UI.esc(B.t('entretien_salaire')) + '</span><span>' + UI.esc(c.revele.salaire ? B.equipe.euroHeure(c.demande) : B.t('entretien_inconnu')) + '</span></div>';
  c.reponses.forEach(function (r) {
    h += '<div class="reponse"><span class="q">' + UI.esc(B.t('q_' + r.q)) + '</span>' + UI.esc(r.texte) + '</div>';
  });
  if (encore) {
    const reste = B.equipe.questions(c).filter(function (q) { return !c.reponses.some(function (r) { return r.q === q; }); });
    if (reste.length) {
      h += '<h3>' + UI.esc(B.t('entretien_questions')) + '</h3><div class="questions">';
      reste.forEach(function (q) { h += '<button type="button" class="petit-btn" data-eq="question" data-q="' + q + '">' + UI.esc(B.t('q_' + q)) + '</button>'; });
      h += '</div>';
    }
    h += '<h3>' + UI.esc(B.t('entretien_offre')) + '</h3>';
    h += '<p class="sous">' + UI.esc(B.t('entretien_minimum', { min: B.equipe.euroHeure(c.minimum) })) + '</p>';
    h += '<div class="offre"><button type="button" class="petit-btn" data-eq="moins"' + (c.offre <= c.minimum + 0.001 ? ' disabled' : '') + '>' + UI.esc(B.t('entretien_moins')) + '</button>' +
      '<b>' + UI.esc(B.equipe.euroHeure(c.offre)) + '</b>' +
      '<button type="button" class="petit-btn" data-eq="plus">' + UI.esc(B.t('entretien_plus')) + '</button>' +
      '<button type="button" class="petit-btn principal" data-eq="proposer">' + UI.esc(B.t('entretien_proposer', { salaire: B.equipe.euroHeure(c.offre) })) + '</button></div>';
    h += '<p class="sous">' + UI.esc(B.t('entretien_par_mois', { mois: B.euros(B.equipe.parMois(c.offre)) })) + '</p>';
  }
  if (c.dernierMot) h += '<p class="mot">' + UI.esc(c.dernierMot) + '</p>';
  h += '<button type="button" class="gros" data-eq="retour">' + UI.esc(B.t('entretien_retour')) + '</button>';
  return h;
};

/* Confirmation claire avant de renvoyer quelqu'un. */
UI.htmlRenvoi = function (p) {
  const S = UI.S, v = { nom: p.nom, prenom: UI.prenom(p), poste: B.equipe.nomPoste(p), service: B.t('equipe_service_' + p.service) };
  let h = '<div class="confirmation">';
  h += '<p><b>' + UI.esc(UI.tGenre('renvoi_question', p, v)) + '</b></p>';
  h += '<p>' + UI.esc(UI.tGenre('renvoi_definitif', p, v)) + '</p>';
  h += '<p>' + UI.esc(UI.tGenre(B.equipe.enService(S) && B.equipe.occupe(S, p) ? 'renvoi_en_service' : 'renvoi_tout_de_suite', p, v)) + '</p>';
  const ind = B.argent.indemnite(S, p);
  h += '<p class="indemnite">' + UI.esc(UI.tGenre(ind.raison, p, { prenom: UI.prenom(p), montant: B.euros(ind.montant), n: ind.jours })) + '</p>';
  if (S.dejaOuvert && S.ouvert && !S.finJour) h += '<p class="sous">' + UI.esc(UI.tGenre('indem_journee', p, { prenom: UI.prenom(p), montant: B.euros(B.argent.salaireJour(p)) })) + '</p>';
  h += '<div class="offre"><button type="button" class="petit-btn principal" data-eq="renvoi-oui">' + UI.esc(UI.tGenre('renvoi_oui', p, v)) + '</button>' +
    '<button type="button" class="petit-btn" data-eq="renvoi-non">' + UI.esc(UI.tGenre('renvoi_non', p, v)) + '</button></div>';
  return h + '</div>';
};

UI.rafraichirEquipe = function (enHaut) {
  if (UI.voletOuvert !== 'equipe') return;
  const r = UI.renvoiCourant != null && UI.S && UI.S.equipe.find(function (x) { return x.id === UI.renvoiCourant; });
  const f = UI.ficheCourante != null && UI.S && UI.S.equipe.find(function (x) { return x.id === UI.ficheCourante; });
  UI.$('volet-titre').textContent = UI.candidatCourant ? B.t('entretien_titre', { nom: UI.candidatCourant.nom }) : r ? B.t('renvoi_titre', { nom: r.nom }) : f ? B.t('eq_fiche_titre', { nom: f.nom }) : B.t('equipe_titre');
  const corps = UI.$('volet-corps'), y = corps.scrollTop;
  corps.innerHTML = UI.htmlEquipe();
  corps.scrollTop = enHaut ? 0 : y;
};

UI.initEquipe = function () {
  UI.$('volet-corps').addEventListener('click', function (e) {
    const o = e.target.closest('[data-eq-onglet]');
    if (o && UI.voletOuvert === 'equipe') { UI.eqOnglet = o.dataset.eqOnglet; UI.eqMsg = null; UI.renvoiRefus = null; UI.rafraichirEquipe(true); return; }
    const b = e.target.closest('[data-eq]');
    if (!b || !UI.S || b.disabled) return;
    const S = UI.S, a = b.dataset.eq, c = UI.candidatCourant;
    if (a === 'ouvrir') {
      if (B.ouvrir(S)) { UI.sauver(); UI.fermerVolet(); UI.majBarre(); UI.majDetail(); }
      return;
    }
    const pid = b.dataset.id != null ? S.equipe.find(function (x) { return x.id === +b.dataset.id; }) : null;
    if (a === 'fiche') { if (pid) { UI.ficheCourante = pid.id; UI.eqMsg = null; UI.renvoiRefus = null; } UI.rafraichirEquipe(true); return; }
    if (a === 'fiche-retour') { UI.ficheCourante = null; UI.eqMsg = null; UI.renvoiRefus = null; UI.rafraichirEquipe(true); return; }
    if (a === 'repos-moins' || a === 'repos-plus') {
      if (pid && B.planning.decaler(S, pid, a === 'repos-plus' ? 1 : -1)) UI.eqMsg = { ok: true, texte: B.t('eq_repos_change', { prenom: UI.prenom(pid), a: B.DATA.textes.jours_semaine[pid.repos[0]], b: B.DATA.textes.jours_semaine[pid.repos[1]] }) };
      UI.sauver(); UI.rafraichirEquipe(); return;
    }
    if (a === 'form-inscrire' && pid) {
      const r = B.planning.inscrire(S, pid, b.dataset.f);
      UI.eqMsg = r.ok ? { ok: true, texte: B.t('eq_formation_ok', { prenom: UI.prenom(pid), formation: B.t('form_nom_' + b.dataset.f), jour: UI.prochainJourTravaille(S, pid) }) } : { ok: false, texte: B.t(r.erreur) };
      UI.sauver(); UI.majBarre(); UI.rafraichirEquipe(true); return;
    }
    if (a === 'form-annuler' && pid) {
      if (B.planning.annuler(S, pid)) UI.eqMsg = { ok: true, texte: B.t('eq_formation_annulee', { prenom: UI.prenom(pid) }) };
      UI.sauver(); UI.majBarre(); UI.rafraichirEquipe(true); return;
    }
    if (a === 'patron') { UI.renvoiRefus = null; B.equipe.changerPatron(S); UI.sauver(); UI.rafraichirEquipe(); return; }
    if (a === 'renvoyer') {
      const p = S.equipe.find(function (x) { return x.id === +b.dataset.id; });
      if (!p) return;
      const non = B.equipe.peutRenvoyer(S, p);
      if (non) { UI.renvoiRefus = { id: p.id, texte: UI.tGenre(non, p, { prenom: UI.prenom(p) }) }; UI.rafraichirEquipe(); return; }
      UI.renvoiRefus = null; UI.renvoiCourant = p.id; UI.rafraichirEquipe(true); return;
    }
    if (a === 'interim') { B.equipe.appelerInterim(S, b.dataset.sv, false); UI.sauver(); UI.rafraichirEquipe(); UI.majBarre(); UI.dessin.dynamique(); return; }
    if (a === 'interim-auto') { S.interimAuto = !S.interimAuto; UI.sauver(); UI.rafraichirEquipe(); return; }
    if (a === 'renvoi-non') { UI.renvoiCourant = null; UI.rafraichirEquipe(true); return; }
    if (a === 'renvoi-oui') {
      const p = S.equipe.find(function (x) { return x.id === UI.renvoiCourant; });
      UI.renvoiCourant = null;
      if (p) {
        const non = B.equipe.peutRenvoyer(S, p);
        if (non) UI.renvoiRefus = { id: p.id, texte: UI.tGenre(non, p, { prenom: UI.prenom(p) }) };
        else { B.equipe.renvoyer(S, p); if (UI.ficheCourante === p.id) UI.ficheCourante = null; }
      }
      UI.sauver(); UI.rafraichirEquipe(true); UI.majBarre(); UI.majDetail(); UI.dessin.dynamique();
      return;
    }
    if (a === 'entretien') {
      UI.candidatCourant = S.candidats.find(function (x) { return x.id === +b.dataset.id; }) || null;
      if (UI.candidatCourant) UI.candidatCourant.dernierMot = null;
      UI.rafraichirEquipe(true); return;
    }
    if (a === 'retour') { UI.candidatCourant = null; UI.rafraichirEquipe(true); return; }
    if (!c) return;
    if (a === 'question') B.equipe.repondre(S, c, b.dataset.q);
    else if (a === 'moins') c.offre = Math.max(c.minimum, Math.round((c.offre - 0.1) * 100) / 100);
    else if (a === 'plus') c.offre = Math.round((c.offre + 0.1) * 100) / 100;
    else if (a === 'proposer') B.equipe.proposer(S, c, c.offre);
    UI.sauver();
    UI.rafraichirEquipe(a === 'proposer');
  });
};
