/* equipe.js (écran) — volet Équipe : ton équipe, les candidats, les entretiens et l'ouverture du restaurant. */
UI.candidatCourant = null;
UI.renvoiCourant = null;   /* id de l'employé dont on confirme le renvoi */
UI.renvoiRefus = null;     /* { id, texte } : pourquoi on ne peut pas le renvoyer */
UI.prenom = function (p) { return String(p.nom).split(' ')[0]; };
UI.tGenre = function (cle, p, vars) { return B.tChoix(cle, 0, vars, p.genre); };

UI.htmlEquipe = function () {
  const S = UI.S;
  if (UI.candidatCourant) return UI.htmlEntretien(UI.candidatCourant);
  const aRenvoyer = UI.renvoiCourant != null && S.equipe.find(function (x) { return x.id === UI.renvoiCourant; });
  if (aRenvoyer) return UI.htmlRenvoi(aRenvoyer);
  let h = '';
  if (!S.ouvert) {
    h += '<div class="alerte-equipe">' + UI.esc(B.t('equipe_avant_ouverture'));
    if (!B.equipe.actifs(S, 'salle').length) h += '<br><b>' + UI.esc(B.t('equipe_manque_salle')) + '</b>';
    if (!B.equipe.actifs(S, 'cuisine').length) h += '<br><b>' + UI.esc(B.t('equipe_manque_cuisine')) + '</b>';
    h += '</div>';
    h += '<button type="button" class="gros principal" data-eq="ouvrir"' + (B.equipe.peutOuvrir(S) ? '' : ' disabled') + '>' + UI.esc(B.t('equipe_ouvrir')) + '</button>';
  }
  h += '<h3>' + UI.esc(B.t('equipe_ton_equipe')) + '</h3>';
  const ef = B.equipe.effectif(S), G = B.DATA.equipe.effectif.groupes;
  h += '<p class="sous effectif">' + UI.esc(B.t('equipe_effectif', { n: ef.n, total: ef.total, salle: ef.groupes.salle, maxSalle: G.salle, cuisine: ef.groupes.cuisine, maxCuisine: G.cuisine, nett: ef.groupes.nettoyage, maxNett: G.nettoyage })) + '</p>';
  S.equipe.forEach(function (p) {
    const service = B.t('equipe_service_' + p.service);
    if (p.patron) {
      const peut = B.equipe.patronPeutChanger(S);
      h += '<div class="personne"><div><div class="nom">' + UI.esc(B.t('equipe_patron_ligne', { service: service })) + '</div>' +
        (peut ? '' : '<div class="sous">' + UI.esc(B.t('equipe_patron_bloque')) + '</div>') + '</div>' +
        '<button type="button" class="petit-btn" data-eq="patron"' + (peut ? '' : ' disabled') + '>' +
        UI.esc(B.t(p.service === 'salle' ? 'equipe_patron_vers_cuisine' : 'equipe_patron_vers_salle')) + '</button></div>';
    } else {
      h += '<div class="personne"><div><div class="nom">' + UI.esc(p.nom) + '</div><div class="sous">' +
        UI.esc(p.interim ? B.t('equipe_interim_ligne', { poste: B.equipe.nomPoste(p), service: service, salaire: B.equipe.euroHeure(p.salaire) })
          : B.t('equipe_membre_ligne', { poste: B.equipe.nomPoste(p), service: service, note: p.note, salaire: B.equipe.euroHeure(p.salaire) })) + '</div>' +
        (p.partant ? '<div class="sous partant">' + UI.esc(UI.tGenre('equipe_partant', p)) + '</div>' : '') +
        (UI.renvoiRefus && UI.renvoiRefus.id === p.id ? '<div class="refus">' + UI.esc(UI.renvoiRefus.texte) + '</div>' : '') + '</div>' +
        (p.partant ? '' : '<button type="button" class="petit-btn" data-eq="renvoyer" data-id="' + p.id + '">' + UI.esc(B.t('equipe_renvoyer')) + '</button>') + '</div>';
    }
  });
  if (S.equipe.length > 1) h += '<p>' + UI.esc(B.t('equipe_cout', { mois: B.euros(B.equipe.coutMensuel(S)) })) + ' <i>' + UI.esc(B.t('equipe_cout_info')) + '</i></p>';
  h += '<h3>' + UI.esc(B.t('equipe_candidats')) + '</h3>';
  if (!S.candidats.length) h += '<p>' + UI.esc(B.t('equipe_aucun_candidat')) + '</p>';
  S.candidats.forEach(function (c) {
    const pl = B.equipe.place(c.poste), libre = B.equipe.placeLibre(S, c.poste);
    h += '<div class="personne"><div><div class="nom">' + UI.esc(c.nom) + '</div><div class="sous">' +
      UI.esc(B.t('equipe_candidat_ligne', { poste: B.equipe.nomPoste(c), age: c.age, experience: B.equipe.texteExperience(c) })) + ' · ' +
      UI.esc(B.t('equipe_candidat_perso', { adj: B.equipe.adj(c) })) + '</div>' +
      (libre ? '' : '<div class="sous partant">' + UI.esc(B.t('equipe_poste_complet', { n: B.equipe.occupes(S, pl), max: pl.nombre })) + '</div>') + '</div>' +
      (libre ? '<button type="button" class="petit-btn principal" data-eq="entretien" data-id="' + c.id + '">' + UI.esc(B.t('equipe_entretien')) + '</button>' : '') + '</div>';
  });
  /* Intérim : un remplaçant pour la journée sur une place vide */
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
    return UI.esc(B.t(B.equipe.placeRecrutable(pl) ? 'equipe_place_ligne' : 'equipe_place_a_venir', { nom: pl.nom, n: B.equipe.occupes(S, pl), max: pl.nombre }));
  }).join('<br>') + '</p>';
  return h;
};

UI.htmlEntretien = function (c) {
  const S = UI.S, service = B.equipe.poste(c.poste).service;
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
  h += '<p class="sous">' + UI.esc(B.t('renvoi_indemnite')) + '</p>';
  h += '<div class="offre"><button type="button" class="petit-btn principal" data-eq="renvoi-oui">' + UI.esc(UI.tGenre('renvoi_oui', p, v)) + '</button>' +
    '<button type="button" class="petit-btn" data-eq="renvoi-non">' + UI.esc(UI.tGenre('renvoi_non', p, v)) + '</button></div>';
  return h + '</div>';
};

UI.rafraichirEquipe = function (enHaut) {
  if (UI.voletOuvert !== 'equipe') return;
  const r = UI.renvoiCourant != null && UI.S && UI.S.equipe.find(function (x) { return x.id === UI.renvoiCourant; });
  UI.$('volet-titre').textContent = UI.candidatCourant ? B.t('entretien_titre', { nom: UI.candidatCourant.nom }) : r ? B.t('renvoi_titre', { nom: r.nom }) : B.t('equipe_titre');
  const corps = UI.$('volet-corps'), y = corps.scrollTop;
  corps.innerHTML = UI.htmlEquipe();
  corps.scrollTop = enHaut ? 0 : y;
};

UI.initEquipe = function () {
  UI.$('volet-corps').addEventListener('click', function (e) {
    const b = e.target.closest('[data-eq]');
    if (!b || !UI.S || b.disabled) return;
    const S = UI.S, a = b.dataset.eq, c = UI.candidatCourant;
    if (a === 'ouvrir') {
      if (B.ouvrir(S)) { UI.sauver(); UI.fermerVolet(); UI.majBarre(); UI.majDetail(); }
      return;
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
        else B.equipe.renvoyer(S, p);
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
