/* equipe.js (écran) — volet Équipe : ton équipe, les candidats, les entretiens et l'ouverture du restaurant. */
UI.candidatCourant = null;

UI.htmlEquipe = function () {
  const S = UI.S;
  if (UI.candidatCourant) return UI.htmlEntretien(UI.candidatCourant);
  let h = '';
  if (!S.ouvert) {
    h += '<div class="alerte-equipe">' + UI.esc(B.t('equipe_avant_ouverture'));
    if (!B.equipe.salle(S).length) h += '<br><b>' + UI.esc(B.t('equipe_manque_salle')) + '</b>';
    if (!B.equipe.cuisine(S).length) h += '<br><b>' + UI.esc(B.t('equipe_manque_cuisine')) + '</b>';
    h += '</div>';
    h += '<button type="button" class="gros principal" data-eq="ouvrir"' + (B.equipe.peutOuvrir(S) ? '' : ' disabled') + '>' + UI.esc(B.t('equipe_ouvrir')) + '</button>';
  }
  h += '<h3>' + UI.esc(B.t('equipe_ton_equipe')) + '</h3>';
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
        UI.esc(B.t('equipe_membre_ligne', { poste: B.equipe.nomPoste(p), service: service, note: p.note, salaire: B.equipe.euroHeure(p.salaire) })) + '</div></div></div>';
    }
  });
  if (S.equipe.length > 1) h += '<p>' + UI.esc(B.t('equipe_cout', { mois: B.euros(B.equipe.coutMensuel(S)) })) + ' <i>' + UI.esc(B.t('equipe_cout_info')) + '</i></p>';
  h += '<h3>' + UI.esc(B.t('equipe_candidats')) + '</h3>';
  if (!S.candidats.length) h += '<p>' + UI.esc(B.t('equipe_aucun_candidat')) + '</p>';
  S.candidats.forEach(function (c) {
    h += '<div class="personne"><div><div class="nom">' + UI.esc(c.nom) + '</div><div class="sous">' +
      UI.esc(B.t('equipe_candidat_ligne', { poste: B.equipe.nomPoste(c), age: c.age, experience: B.equipe.texteExperience(c) })) + ' · ' +
      UI.esc(B.t('equipe_candidat_perso', { adj: B.equipe.adj(c) })) + '</div></div>' +
      '<button type="button" class="petit-btn principal" data-eq="entretien" data-id="' + c.id + '">' + UI.esc(B.t('equipe_entretien')) + '</button></div>';
  });
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

UI.rafraichirEquipe = function (enHaut) {
  if (UI.voletOuvert !== 'equipe') return;
  UI.$('volet-titre').textContent = UI.candidatCourant ? B.t('entretien_titre', { nom: UI.candidatCourant.nom }) : B.t('equipe_titre');
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
    if (a === 'patron') { B.equipe.changerPatron(S); UI.sauver(); UI.rafraichirEquipe(); return; }
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
