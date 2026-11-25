/* argent.js (écran) — volet Argent (caisse, aujourd'hui, semaines, loyer et charges), bilans du soir et de la semaine, faillite.
   On l'ouvre en touchant la caisse, en haut à gauche. */
UI.agOnglet = 'jour';   /* jour | semaine | charges */

UI.ligneAg = function (lib, montant, classe, signe) {
  const txt = signe ? (montant > 0.004 ? '−' : '') + B.euros(Math.abs(montant)) : B.euros(montant);
  return '<div class="ligne-ag' + (classe ? ' ' + classe : '') + '"><span>' + UI.esc(lib) + '</span><b>' + UI.esc(txt) + '</b></div>';
};
/* Lignes « Recettes, puis chaque dépense non nulle, puis bénéfice » */
UI.lignesComptes = function (recettes, dep, resultat, enCours) {
  let h = UI.ligneAg(B.t('ag_recettes'), recettes, 'plus');
  B.argent.POSTES.forEach(function (k) { if (Math.abs(dep[k] || 0) > 0.004) h += UI.ligneAg(B.t('ag_poste_' + k), dep[k], 'moins', true); });
  h += UI.ligneAg(B.t(enCours ? 'ag_pour_l_instant' : resultat >= 0 ? 'ag_benefice' : 'ag_perte'), resultat, 'total ' + (resultat >= 0 ? 'vert-txt' : 'rouge-txt'));
  return h;
};
UI.minuscule = function (t) { return /^[A-Z]{2,}/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1); };
UI.texteNiveau = function (S) { return B.t('niveau_' + S.difficulte); };

UI.htmlArgent = function () {
  const S = UI.S;
  let h = '<div class="cagnotte caisse"><span>' + UI.esc(B.t('ag_caisse')) + '<br><small>' + UI.esc(B.t('ag_niveau', { niveau: UI.texteNiveau(S) })) + '</small></span><b class="' + (S.argent < 0 ? 'rouge-txt' : '') + '">' + UI.esc(B.euros(S.argent)) + '</b></div>';
  if (S.decouvert > 0) h += '<div class="alerte-ag">' + UI.esc(B.t('ag_decouvert', { soir: S.decouvert, max: B.DATA.argent.faillite.soirsDeSuite })) + '</div>';
  h += UI.onglets('data-ag-onglet', [['jour', B.t('ag_onglet_jour')], ['semaine', B.t('ag_onglet_semaine')], ['charges', B.t('ag_onglet_charges')]], UI.agOnglet);
  h += '<div class="gros-texte">';
  if (UI.agOnglet === 'semaine') h += UI.htmlAgSemaine();
  else if (UI.agOnglet === 'charges') h += UI.htmlAgCharges();
  else h += UI.htmlAgJour();
  return h + '</div>';
};

UI.htmlAgJour = function () {
  const S = UI.S, j = B.argent.journee(S), P = B.argent.prevision(S);
  let h = '<h3>' + UI.esc(B.t(S.finJour ? 'ag_jour_fini' : 'ag_jour_en_cours', { jour: S.jour })) + '</h3>';
  h += UI.lignesComptes(j.recettes, j.depenses, j.resultat, !S.finJour);
  if (!S.finJour) {
    const inter = B.equipe.interimaires(S).reduce(function (s, p) { return s + B.argent.salaireJour(p); }, 0);
    h += '<p class="sous">' + UI.esc(B.t('ag_ce_soir', { total: B.euros(P.total + inter) })) + (B.argent.niveau(S).tva ? ' ' + UI.esc(B.t('ag_ce_soir_tva')) : '') + '</p>';
  }
  h += '<h3>' + UI.esc(B.t('ag_cout_journee')) + '</h3>';
  [['salaires', P.salaires], ['cotisations', P.cotisations], ['loyer', P.loyer], ['charges', P.charges], ['pret', P.pret]].forEach(function (x) {
    if (x[1] > 0.004 || x[0] === 'loyer' || x[0] === 'salaires') h += UI.ligneAg(B.t('ag_poste_' + x[0]) + (x[0] === 'loyer' && !P.loyer ? ' · ' + B.t('ag_proprietaire') : ''), x[1], 'moins', true);
  });
  h += UI.ligneAg(B.t('ag_total_jour'), P.total, 'total', true);
  const H = (S.historique || []).slice(-7).reverse();
  if (H.length) {
    h += '<h3>' + UI.esc(B.t('ag_derniers_jours')) + '</h3><table class="planning comptes"><tr><th>' + UI.esc(B.t('ag_col_jour')) + '</th><th>' + UI.esc(B.t('ag_col_recettes')) + '</th><th>' + UI.esc(B.t('ag_col_depenses')) + '</th><th>' + UI.esc(B.t('ag_col_benefice')) + '</th></tr>';
    H.forEach(function (x) {
      const dep = Object.keys(x.depenses).reduce(function (s, k) { return s + x.depenses[k]; }, 0);
      h += '<tr><th>' + UI.esc(B.t('ag_jour_n', { n: x.jour })) + '</th><td>' + UI.esc(B.euros(x.recettes)) + '</td><td>' + UI.esc(B.euros(dep)) + '</td><td class="' + (x.resultat < 0 ? 'rouge-txt' : 'vert-txt') + '">' + UI.esc(B.euros(x.resultat)) + '</td></tr>';
    });
    h += '</table>';
  }
  return h;
};

UI.htmlSemaine = function (w, enCours) {
  let h = '<h3>' + UI.esc(B.t(enCours ? 'ag_semaine_en_cours' : 'ag_semaine_titre', { n: w.numero, a: w.debut, b: w.fin, j: w.jours, max: B.DATA.argent.semaine.jours })) + '</h3>';
  h += '<p>' + UI.esc(B.t('ag_semaine_clients', { n: w.servis, r: w.repartis })) + '</p>';
  h += UI.lignesComptes(w.recettes, w.depenses, w.resultat, enCours);
  if (!enCours && w.avant != null) h += '<p class="sous">' + UI.esc(B.t('ag_semaine_avant', { total: B.euros(w.avant) })) + '</p>';
  return h;
};
UI.htmlAgSemaine = function () {
  const S = UI.S;
  let h = '';
  if (S.semaine && S.semaine.jours) h += UI.htmlSemaine(S.semaine, true);
  else h += '<p class="sous">' + UI.esc(B.t('ag_semaine_vide', { jour: S.semaine ? S.semaine.debut : S.jour })) + '</p>';
  (S.semaines || []).forEach(function (w) { h += UI.htmlSemaine(w, false); });
  return h;
};

UI.htmlAgCharges = function () {
  const S = UI.S, N = B.argent.niveau(S), A = B.DATA.argent;
  let h = '<h3>' + UI.esc(B.t('ag_par_mois')) + '</h3>';
  const loyer = B.argent.loyerMois(S);
  h += UI.ligneAg(loyer ? B.t('ag_loyer_mois', { m2: A.loyer.surface }) : B.t('ag_poste_loyer') + ' · ' + B.t('ag_proprietaire'), loyer, 'moins', true);
  B.argent.chargesMois(S).forEach(function (c) { h += UI.ligneAg(B.t('ag_charge_' + c.id), c.mois, 'moins', true); });
  const sal = B.equipe.coutMensuel(S);
  h += UI.ligneAg(B.t('ag_salaires_mois'), sal, 'moins', true);
  if (N.cotisations) h += UI.ligneAg(B.t('ag_cotisations_mois', { taux: Math.round(N.cotisations * 100) }), sal * N.cotisations, 'moins', true);
  if (S.pret && S.pret.restant > 0) h += UI.ligneAg(B.t('ag_poste_pret'), S.pret.mensualite, 'moins', true);
  h += '<p class="sous">' + UI.esc(B.t('ag_paye_chaque_soir')) + '</p>';
  if (N.tva) h += '<p>' + UI.esc(B.t('ag_tva_regle', { taux: Math.round(N.tva * 100) })) + '</p>';
  else h += '<p>' + UI.esc(B.t('ag_sans_tva')) + '</p>';
  if (S.pret) {
    h += '<h3>' + UI.esc(B.t('ag_pret_titre')) + '</h3>';
    h += UI.ligneAg(B.t('ag_pret_montant'), S.pret.montant) + UI.ligneAg(B.t('ag_pret_restant'), S.pret.restant) + UI.ligneAg(B.t('ag_pret_interets'), S.pret.interets);
    h += '<p class="sous">' + UI.esc(B.t('ag_pret_regle', { taux: String(Math.round(S.pret.taux * 1000) / 10).replace('.', ','), mois: S.pret.mois, mensualite: B.euros(S.pret.mensualite) })) + '</p>';
  }
  h += '<h3>' + UI.esc(B.t('ag_regles_titre')) + '</h3>';
  h += '<p>' + UI.esc(B.t('ag_regle_indemnite', { essai: A.indemnites.essaiJours, jours: A.indemnites.joursDeSalaire })) + '</p>';
  h += '<p>' + UI.esc(B.t('ag_regle_faillite', { soirs: A.faillite.soirsDeSuite, decouvert: B.euros(A.decouvertAutorise) })) + '</p>';
  return h;
};

UI.rafraichirArgent = function (enHaut) {
  if (UI.voletOuvert !== 'argent') return;
  UI.$('volet-titre').textContent = B.t('ag_titre');
  const c = UI.$('volet-corps'), y = c.scrollTop;
  c.innerHTML = UI.htmlArgent();
  c.scrollTop = enHaut ? 0 : y;
};

/* ---------- Fin de journée : l'argent du jour, l'alerte de découvert, le bilan de la semaine ---------- */
UI.htmlFinArgent = function (b) {
  if (!b.depenses) return '';
  let h = '<div class="fin-argent">' + UI.lignesComptes(b.recettes || 0, b.depenses, b.resultat || 0) + '</div>';
  return h;
};
UI.htmlFinAlerte = function (b) {
  if (!b.alerte) return '';
  return '<div class="alerte-ag">' + UI.esc(B.t('fin_alerte', { argent: B.euros(b.alerte.argent), soir: b.alerte.soir, max: b.alerte.max, reste: b.alerte.max - b.alerte.soir })) +
    '<br><span>' + UI.esc(B.t('fin_alerte_conseil')) + '</span></div>';
};
UI.htmlFinSemaine = function (b) {
  const w = b.semaine;
  if (!w) return '';
  let h = '<div class="fin-semaine"><h3>' + UI.esc(B.t('fin_semaine_titre', { n: w.numero, a: w.debut, b: w.fin })) + '</h3><div class="chiffres">' +
    '<div><b>' + w.servis + '</b><span>' + UI.esc(B.t('fin_servis')) + '</span></div>' +
    '<div><b>' + UI.esc(B.euros(w.recettes)) + '</b><span>' + UI.esc(B.t('fin_recettes')) + '</span></div>' +
    '<div><b class="' + (w.resultat < 0 ? 'rouge-txt' : 'vert-txt') + '">' + UI.esc(B.euros(w.resultat)) + '</b><span>' + UI.esc(B.t(w.resultat < 0 ? 'fin_perte_semaine' : 'fin_benefice_semaine')) + '</span></div></div>';
  h += '<div class="fin-argent">' + UI.lignesComptes(w.recettes, w.depenses, w.resultat) + '</div>';
  if (w.avant != null) h += '<p class="sous">' + UI.esc(B.t('ag_semaine_avant', { total: B.euros(w.avant) })) + '</p>';
  return h + '</div>';
};

/* ---------- Faillite : un message clair, la partie est gardée ---------- */
UI.htmlFaillite = function (S) {
  const f = S.faillite;
  let h = '<div class="carte-fin faillite"><h2>' + UI.esc(B.t('faillite_titre')) + '</h2>';
  h += '<p class="gros-texte">' + UI.esc(B.t('faillite_pourquoi', { soirs: f.soirs, argent: B.euros(f.argent), jour: f.jour })) + '</p>';
  h += '<p class="gros-texte">' + UI.esc(B.t(f.resultat < 0 ? 'faillite_semaine_perte' : 'faillite_semaine', { jours: f.jours, recettes: B.euros(f.recettes), resultat: B.euros(Math.abs(f.resultat)) })) + '</p>';
  if (f.top.length) h += '<p class="gros-texte">' + UI.esc(B.t('faillite_top', { liste: f.top.map(function (x) { return UI.minuscule(B.t('ag_poste_' + x.poste)) + ' ' + B.euros(x.montant); }).join(', ') })) + '</p>';
  h += '<p class="rassure">' + UI.esc(B.t('faillite_garde')) + '</p>';
  h += '<div class="rang"><button type="button" class="gros" id="faillite-accueil">' + UI.esc(B.t('faillite_accueil')) + '</button>' +
    '<button type="button" class="gros principal" id="faillite-nouvelle">' + UI.esc(B.t('faillite_nouvelle')) + '</button></div></div>';
  return h;
};
UI.montrerFaillite = function () {
  const S = UI.S, el = UI.$('fin');
  el.innerHTML = UI.htmlFaillite(S);
  el.hidden = false;
  try { UI.ecrireCase(UI.cles().copieFaillite, B.serialiser(S)); } catch (e) { /* la sauvegarde principale reste là */ }
  UI.sauver();
  UI.$('faillite-accueil').addEventListener('click', function () { el.hidden = true; UI.montrerAccueil(); });
  UI.$('faillite-nouvelle').addEventListener('click', function () { el.hidden = true; UI.montrerAccueil('nouvelle'); });
};

UI.initArgent = function () {
  UI.$('btn-argent').addEventListener('click', function () { if (UI.S) UI.ouvrirVolet('argent'); });
  UI.$('volet-corps').addEventListener('click', function (e) {
    if (UI.voletOuvert !== 'argent') return;
    const o = e.target.closest('[data-ag-onglet]');
    if (o) { UI.agOnglet = o.dataset.agOnglet; UI.rafraichirArgent(true); }
  });
};
