/* accueil.js — écran d'accueil : continuer, nouvelle partie, reprendre une partie de l'ancien jeu. */
UI.montrerAccueil = function (vue) {
  UI.pause('accueil', true);
  const el = UI.$('accueil');
  el.hidden = false;
  vue = vue || 'menu';
  let h = '<div class="carte-accueil"><h1>' + UI.esc(B.t('jeu_nom')) + '</h1>';
  const sousTitre = B.t('canal_' + B.CANAL);
  h += '<p class="sous">' + UI.esc(B.t('jeu_sous_titre')) + (sousTitre ? ' · <b>' + UI.esc(sousTitre) + '</b>' : '') + '</p>';
  if (vue === 'menu') {
    if (UI.S) h += '<button type="button" class="gros principal" data-a="continuer">' + UI.esc(B.t('accueil_continuer', { nom: UI.S.nom, lieu: B.lieu(UI.S.lieu).nom, jour: UI.S.jour })) + '</button>';
    if (UI.erreurChargement) h += '<p class="alerte">' + UI.esc(B.t(UI.erreurChargement)) + '</p>';
    h += '<button type="button" class="gros' + (UI.S ? '' : ' principal') + '" data-a="nouvelle">' + UI.esc(B.t('accueil_nouvelle')) + '</button>';
    if (UI.anciennes().length) h += '<button type="button" class="gros" data-a="ancien">' + UI.esc(B.t('accueil_ancien')) + '</button>';
  } else if (vue === 'nouvelle') {
    h += '<h2>' + UI.esc(B.t('nouvelle_titre')) + '</h2>';
    h += '<label>' + UI.esc(B.t('nouvelle_nom')) + '<input id="n-nom" maxlength="40" value="' + UI.esc(B.t('nouvelle_nom_defaut')) + '"></label>';
    h += '<label>' + UI.esc(B.t('nouvelle_lieu')) + '<select id="n-lieu">';
    ['france', 'outre-mer', 'monde'].forEach(function (gr) {
      h += '<optgroup label="' + UI.esc(B.t('nouvelle_groupe_' + gr)) + '">';
      B.DATA.lieux.lieux.filter(function (l) { return l.groupe === gr; }).forEach(function (l) {
        h += '<option value="' + l.id + '">' + UI.esc(l.nom) + '</option>';
      });
      h += '</optgroup>';
    });
    h += '</select></label>';
    h += '<p>' + UI.esc(B.t('nouvelle_difficulte', { capital: B.euros(B.DATA.regles.difficultes.facile.capitalDepart) })) + '</p>';
    h += '<div class="rang"><button type="button" class="gros" data-a="menu">' + UI.esc(B.t('accueil_retour')) + '</button>';
    h += '<button type="button" class="gros principal" data-a="ouvrir">' + UI.esc(B.t('nouvelle_ouvrir')) + '</button></div>';
  } else if (vue === 'ancien') {
    h += '<h2>' + UI.esc(B.t('ancien_titre')) + '</h2>';
    h += '<p class="rassure">' + UI.esc(B.t('ancien_rassure')) + '</p>';
    const A = UI.anciennes();
    if (!A.length) h += '<p>' + UI.esc(B.t('ancien_aucune')) + '</p>';
    A.forEach(function (a, i) {
      const r = a.resume;
      const titre = a.emplacement ? B.t('ancien_emplacement', { n: a.emplacement }) : B.t('ancien_derniere');
      h += '<div class="ancienne"><div><b>' + UI.esc(titre) + (a.derniere && a.emplacement ? ' · ' + UI.esc(B.t('ancien_derniere')) : '') + '</b><br>' +
        UI.esc(B.t('ancien_ligne', { nom: r.nom, lieu: r.lieuNom, jour: r.jour, argent: B.euros(r.argent) })) + '</div>' +
        '<button type="button" class="gros principal" data-a="importer" data-i="' + i + '">' + UI.esc(B.t('ancien_reprendre')) + '</button></div>';
    });
    h += '<p class="petit">' + UI.esc(B.t('ancien_contenu')) + '</p>';
    h += '<button type="button" class="gros" data-a="menu">' + UI.esc(B.t('accueil_retour')) + '</button>';
  }
  h += '</div>';
  el.innerHTML = h;
  el.scrollTop = 0;
};

UI.anciennes = function () { return B.ancien.trouver(UI.lireCase); };

UI.remplacerOk = function () {
  if (!UI.S) return true;
  return window.confirm(B.t('nouvelle_remplace', { nom: UI.S.nom, jour: UI.S.jour }));
};

UI.cacherAccueil = function () {
  UI.$('accueil').hidden = true;
  UI.pause('accueil', false);
  UI.majBarre();
};

UI.demarrer = function (S, cle, vars) {
  UI.S = S;
  UI.selection = null;
  UI.toasts = [];
  B.flux.length = 0;
  if (cle) B.message(S, cle, vars);
  UI.sauver();
  UI.cacherAccueil();
  UI.majDetail();
  UI.majFin();
};

UI.initAccueil = function () {
  UI.$('accueil').addEventListener('click', function (e) {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const a = b.dataset.a;
    if (a === 'continuer') { UI.cacherAccueil(); UI.majFin(); }
    else if (a === 'nouvelle' || a === 'ancien' || a === 'menu') UI.montrerAccueil(a);
    else if (a === 'ouvrir') {
      if (!UI.remplacerOk()) return;
      const S = B.nouvellePartie({ nom: UI.$('n-nom').value || B.t('nouvelle_nom_defaut'), lieu: UI.$('n-lieu').value, date: new Date().toISOString() });
      UI.erreurChargement = null;
      UI.demarrer(S, 'msg_bienvenue', { chez: B.chezNom(S.nom), heure: B.heure(B.DATA.clients.affluence[0].de) });
    } else if (a === 'importer') {
      const choix = UI.anciennes()[+b.dataset.i];
      if (!choix || !UI.remplacerOk()) return;
      const S = B.ancien.convertir(JSON.parse(choix.texte), { cle: choix.cle, date: new Date().toISOString(), graine: Math.floor(Math.random() * 2147483647) });
      try { UI.ecrireCase(UI.cles().copieAncien, choix.texte); } catch (err) { /* la copie de réserve est un plus, pas une obligation */ }
      UI.erreurChargement = null;
      UI.demarrer(S, 'msg_import', { nom: S.nom, jour: S.jour });
    }
  });
};
