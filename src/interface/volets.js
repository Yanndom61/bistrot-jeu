/* volets.js — panneaux qui s'ouvrent par-dessus la salle (Journal, Menu) et se ferment d'un geste.
   Le jeu se met en pause pendant la lecture (réglage), et reprend à la fermeture. */
UI.voletOuvert = null;

UI.ouvrirVolet = function (quoi) {
  UI.voletOuvert = quoi;
  const v = UI.$('volet');
  v.classList.toggle('large', quoi === 'equipe' || quoi === 'carte' || quoi === 'stocks' || quoi === 'argent' || quoi === 'calendrier' || quoi === 'aide');
  if (quoi === 'equipe') { UI.candidatCourant = null; UI.renvoiCourant = null; UI.renvoiRefus = null; UI.ficheCourante = null; UI.eqMsg = null; UI.eqOnglet = UI.S && UI.S.dejaOuvert ? 'equipe' : 'embauche'; UI.rafraichirEquipe(true); }
  else if (quoi === 'carte') { UI.platCourant = null; UI.carteRefus = null; UI.rafraichirCarte(true); }
  else if (quoi === 'stocks') { UI.stMsg = null; UI.rafraichirStocks(true); }
  else if (quoi === 'argent') { UI.agOnglet = 'jour'; UI.rafraichirArgent(true); }
  else if (quoi === 'calendrier') { UI.rafraichirCalendrier(true); }
  else if (quoi === 'aide') { UI.rafraichirAide(true); }
  else if (quoi === 'ticket') {
    const g = UI.S.groupes.find(function (x) { return x.id === UI.ticketGroupe; });
    UI.$('volet-titre').textContent = B.t('ticket_titre');
    UI.$('volet-corps').innerHTML = g ? UI.htmlTicket(g) : '';
  }
  else {
    UI.$('volet-titre').textContent = B.t(quoi === 'journal' ? 'journal_titre' : 'menu_titre');
    UI.$('volet-corps').innerHTML = quoi === 'journal' ? UI.htmlJournal() : UI.htmlMenu();
  }
  clearTimeout(UI._cacheVolet);
  UI.$('voile').hidden = false;
  v.hidden = false;
  requestAnimationFrame(function () { v.classList.add('ouvert'); if (quoi === 'equipe' || quoi === 'argent' || quoi === 'calendrier') UI.$('volet-corps').scrollTop = 0; });
  if (UI.reglages.pauseAuto) UI.pause('volet', true);
  UI.sauver();
};

UI.fermerVolet = function () {
  const v = UI.$('volet');
  v.classList.remove('ouvert');
  UI.$('voile').hidden = true;
  clearTimeout(UI._cacheVolet);
  UI._cacheVolet = setTimeout(function () { if (!v.classList.contains('ouvert')) v.hidden = true; }, 220);
  UI.voletOuvert = null;
  UI.candidatCourant = null;
  UI.renvoiCourant = null;
  UI.renvoiRefus = null;
  UI.ficheCourante = null;
  UI.eqMsg = null;
  UI.platCourant = null;
  UI.carteRefus = null;
  UI.ticketGroupe = null;
  UI.stMsg = null;
  UI.mdjChoix = null;
  UI.mdjMsg = null;
  UI.calPrive = null;
  UI.pause('volet', false);
  UI.majDetail();
};

UI.htmlMenu = function () {
  const S = UI.S;
  let h = S ? '<button type="button" class="gros principal" data-action="aide">' + UI.esc(B.t('menu_aide')) + '</button>' : '';
  h += '<h3>' + UI.esc(B.t('menu_reglages')) + '</h3>';
  h += '<div class="ligne-reglage"><span>' + UI.esc(B.t('menu_pause_auto')) + '</span>' +
    '<button type="button" class="bascule' + (UI.reglages.pauseAuto ? ' on' : '') + '" data-action="pause-auto">' +
    UI.esc(B.t(UI.reglages.pauseAuto ? 'menu_oui' : 'menu_non')) + '</button></div>';
  const manuel = S && S.placement === 'manuel';
  h += '<div class="ligne-reglage"><span>' + UI.esc(B.t('menu_placement')) + '</span>' +
    '<button type="button" class="bascule' + (manuel ? ' on' : '') + '" data-action="placement">' + UI.esc(B.t(manuel ? 'menu_oui' : 'menu_non')) + '</button></div>';
  h += '<h3>' + UI.esc(B.t('menu_partie')) + '</h3>';
  if (UI.derniereSauvegarde != null) h += '<p>' + UI.esc(B.t('menu_sauve', { heure: B.heure(UI.derniereSauvegarde) })) + '</p>';
  if (S && S.origine) h += '<p>' + UI.esc(B.t('menu_origine', { v: S.origine.versionSauvegarde })) + '</p>';
  h += '<button type="button" class="gros" data-action="accueil">' + UI.esc(B.t('menu_accueil')) + '</button>';
  h += '<p class="version">' + UI.esc(B.t('menu_version', { version: B.VERSION_JEU, canal: B.t('canal_' + B.CANAL) })) + '</p>';
  return h;
};

UI.initVolets = function () {
  UI.$('volet-fermer').textContent = B.t('btn_fermer');
  UI.$('volet-fermer').addEventListener('click', UI.fermerVolet);
  UI.$('voile').addEventListener('click', UI.fermerVolet);
  UI.$('volet-corps').addEventListener('click', function (e) {
    const b = e.target.closest('[data-action]');
    if (!b) return;
    if (b.dataset.action === 'pause-auto') {
      UI.reglages.pauseAuto = !UI.reglages.pauseAuto;
      UI.sauverReglages();
      if (!UI.reglages.pauseAuto) UI.pause('volet', false);
      UI.$('volet-corps').innerHTML = UI.htmlMenu();
    } else if (b.dataset.action === 'placement' && UI.S) {
      UI.S.placement = UI.S.placement === 'manuel' ? 'auto' : 'manuel';
      UI.groupeChoisi = null;
      UI.majPlacement(); UI.sauver();
      UI.$('volet-corps').innerHTML = UI.htmlMenu();
    } else if (b.dataset.action === 'aide') {
      UI.ouvrirAide('objectifs');
    } else if (b.dataset.action === 'accueil') {
      UI.fermerVolet();
      UI.sauver();
      UI.montrerAccueil();
    }
  });
  /* Glisser le volet vers la droite pour le fermer */
  let x0 = null;
  const v = UI.$('volet');
  v.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
  v.addEventListener('pointerup', function (e) { if (x0 != null && e.clientX - x0 > 60) UI.fermerVolet(); x0 = null; });
  v.addEventListener('pointercancel', function () { x0 = null; });
};
