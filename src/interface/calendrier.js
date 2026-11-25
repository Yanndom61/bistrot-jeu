/* calendrier.js (écran) — étape 6 (v0.8) : le bouton météo et date (en haut à droite), le volet Calendrier
   (aujourd'hui, 7 jours, le mois, fêtes et événements), la fenêtre des événements du jour et les tables réservées. */
UI.calOnglet = 'jour';    /* jour | semaine | mois | evenements */
UI.calMois = 0;           /* décalage en mois pour l'onglet Mois */
UI.calPrive = null;       /* événement privé ouvert */

UI.pct = function (f) { const p = Math.round((f - 1) * 100); return (p > 0 ? '+' : p < 0 ? '−' : '') + Math.abs(p) + ' %'; };
UI.texteMeteo = function (m) { return m.emoji + ' ' + m.temp + '° · ' + B.t('ciel_' + m.ciel); };
UI.dateCourte = function (S, dec) { const d = B.dateDuJour(S, dec), T = B.DATA.textes; return T.jours_court[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + T.mois_court[d.getUTCMonth()]; };
/* Ce qu'il y a de spécial un jour : férié, fête, événement privé, vacances (le plus important d'abord) */
UI.marquesDuJour = function (S, i) {
  const out = [];
  (S.cal ? S.cal.prives : []).forEach(function (e) { if (e.etat === 'reserve' && e.jour === i.jour) out.push({ cls: 'prive', txt: B.ev.typePrive(S, e.type).emoji + ' ' + B.heure(e.debut) + ' ' + B.ev.typePrive(S, e.type).nom }); });
  if (i.ferie) out.push({ cls: 'ferie', txt: '🔴 ' + i.ferie.nom });
  else if (i.fete) out.push({ cls: 'fete', txt: i.fete.emoji + ' ' + i.fete.nom });
  for (const id in (S.cal ? S.cal.fetes : {})) { const f = S.cal.fetes[id]; if (f.etat === 'oui' && i.jour >= f.debut && i.jour <= f.fin) { const m = B.ev.infoMenu(S, f.k); out.push({ cls: 'menu', txt: m.emoji + ' ' + m.nom }); } }
  if (i.vacances) out.push({ cls: 'vac', txt: i.vacances.emoji + ' ' + B.t('cal_vacances_court', { nom: i.vacances.nom }) });
  return out;
};
UI.aDecider = function (S) { return S && S.cal ? B.ev.fetesEnAttente(S).length + B.ev.ouverts(S).length : 0; };

/* ---------- Le bouton (en haut du panneau de droite) ---------- */
UI.majCalendrier = function () {
  const S = UI.S, b = UI.$('btn-calendrier');
  if (!S || !S.cal) return;
  const i = B.cal.infos(S, 0), mq = UI.marquesDuJour(S, i), n = UI.aDecider(S);
  const tag = mq.length ? mq[0] : { cls: 'saison', txt: B.t('saison_' + i.saison) };
  const html = '<span class="cal-l1">' + UI.esc(i.meteo.emoji + ' ' + i.meteo.temp + '°') + '<small>' + UI.esc(B.t('ciel_' + i.meteo.ciel)) + '</small></span>' +
    '<span class="cal-l2">' + UI.esc(UI.dateCourte(S, 0)).replace(/^(\S+) /, '<span class="jsem">$1 </span>') + '</span>' +
    '<span class="cal-l3 ' + tag.cls + '">' + UI.esc(tag.txt) + '</span>' + (n ? '<i class="pastille">' + n + '</i>' : '');
  if (b._html !== html) { b.innerHTML = html; b._html = html; b.setAttribute('aria-label', B.t('cal_titre')); }
};

/* ---------- Le volet ---------- */
UI.htmlCalendrier = function () {
  const S = UI.S;
  if (UI.calPrive != null && B.ev.prive(S, UI.calPrive)) return UI.htmlPrive(B.ev.prive(S, UI.calPrive));
  const n = UI.aDecider(S);
  let h = UI.onglets('data-cal-onglet', [['jour', B.t('cal_onglet_jour')], ['semaine', B.t('cal_onglet_semaine')], ['mois', B.t('cal_onglet_mois')], ['evenements', B.t('cal_onglet_evenements') + (n ? ' (' + n + ')' : '')]], UI.calOnglet);
  h += '<div class="gros-texte">';
  if (UI.calOnglet === 'semaine') h += UI.htmlCalSemaine();
  else if (UI.calOnglet === 'mois') h += UI.htmlCalMois();
  else if (UI.calOnglet === 'evenements') h += UI.htmlCalEvenements();
  else h += UI.htmlCalJour();
  return h + '</div>';
};

UI.htmlCalJour = function () {
  const S = UI.S, i = B.cal.infos(S, 0), l = B.lieu(S.lieu), n = i.serie;
  let h = '<div class="cal-tete"><b>' + UI.esc(UI.texteMeteo(i.meteo)) + '</b><span>' + UI.esc(B.texteDate(S, 0) + ' · ' + B.t('saison_' + i.saison)) + '</span></div>';
  const fTot = i.facteur * B.rep.facteurAffluence(S);   /* v1.0 : la réputation compte aussi */
  h += '<div class="ligne-ag total"><span>' + UI.esc(B.t('cal_affluence_jour')) + '</span><b class="' + (fTot >= 1 ? 'vert-txt' : 'rouge-txt') + '">' + UI.esc(UI.pct(fTot)) + '</b></div>';
  h += '<h3>' + UI.esc(B.t('cal_pourquoi')) + '</h3>';
  const js = B.cal.date(n).js, cj = B.DATA.calendrier.joursSemaine.coef[js];
  h += UI.ligneCal(B.t('cal_effet_jour', { jour: B.DATA.textes.jours_semaine[js] }), cj);
  h += UI.ligneCal(B.t('cal_effet_meteo', { meteo: B.t('ciel_' + i.meteo.ciel) }), i.meteo.affluence);
  const ft = B.cal.facteurTourisme(S, n);
  if (Math.abs(ft - 1) > 0.004) h += UI.ligneCal(B.t(ft > 1 ? 'cal_effet_tourisme_plus' : 'cal_effet_tourisme_moins', { tourisme: l.tourisme }), ft);
  if (i.vacances) h += UI.ligneCal(B.t('cal_effet_vacances', { nom: i.vacances.nom }), 1 + B.DATA.calendrier.effets.vacancesParZone);
  if (i.ferie) h += '<p>' + UI.esc(B.t('cal_effet_ferie', { nom: i.ferie.nom, midi: UI.pct(B.cal.coefJour(S, n, 700)), soir: UI.pct(B.cal.coefJour(S, n, 1200)) })) + '</p>';
  else if (i.fete && B.DATA.calendrier.effets.fetesQuiComptent.indexOf(i.fete.id) >= 0) h += '<p>' + UI.esc(B.t('cal_effet_fete', { nom: i.fete.nom, midi: UI.pct(B.cal.coefJour(S, n, 700)), soir: UI.pct(B.cal.coefJour(S, n, 1200)) })) + '</p>';
  h += UI.ligneCal(B.t('cal_effet_reputation', { note: UI.noteTexte(B.rep.note(S)) }), B.rep.facteurAffluence(S));   /* v1.0 */
  (S.cal.effets || []).forEach(function (x) { if (x.jusqua >= S.jour) h += UI.ligneCal(B.t('cal_effet_' + x.k, { heure: B.heure(x.de || 0), jusqua: B.ev.texteJour(S, x.jusqua) }), x.m); });
  const pa = B.ev.panne(S), gr = B.ev.greve(S);
  if (pa) h += '<p class="alerte-ag">' + UI.esc(B.t('cal_panne', { objet: B.t('ev_panne_' + pa.type), effet: B.t('ev_panne_effet_' + pa.type), jusqua: B.ev.texteJour(S, pa.jusqua) })) + '</p>';
  if (gr) h += '<p class="alerte-ag">' + UI.esc(B.t('cal_greve', { four: B.stock.nomFournisseur(S, gr.four), jusqua: B.ev.texteJour(S, gr.jusqua) })) + '</p>';
  (S.cal.flambees || []).forEach(function (f) { if (f.jusqua >= S.jour) h += '<p class="alerte-ag">' + UI.esc(B.t('cal_flambee', { produit: B.stock.ing(f.ing).nom, jusqua: B.ev.texteJour(S, f.jusqua) })) + '</p>'; });
  h += '<p class="sous">' + UI.esc(B.t('cal_effet_note')) + '</p>';
  h += '<h3>' + UI.esc(B.t('cal_commandes_titre')) + '</h3><p>' + UI.esc(B.t('cal_commandes_' + i.meteo.ressenti)) + '</p>';
  h += '<h3>' + UI.esc(B.t('cal_clientele_titre')) + '</h3>';
  h += '<p>' + UI.esc(B.t('cal_touristes', { pct: Math.round(B.cal.partTouristes(S, n) * 100) })) + (B.cal.facteurFamilles(S, n, 700) > 1.001 ? ' ' + UI.esc(B.t('cal_familles')) : '') + '</p>';
  h += '<h3>' + UI.esc(B.t('cal_lieu_titre', { lieu: l.nom })) + '</h3>';
  h += '<p>' + UI.esc(B.t('cal_lieu_infos', { meteo: l.meteo, tourisme: l.tourisme, calendrier: l.calendrier })) + '</p>';
  const mq = UI.marquesDuJour(S, i);
  if (mq.length) h += '<p>' + mq.map(function (m) { return '<span class="marque ' + m.cls + '">' + UI.esc(m.txt) + '</span>'; }).join(' ') + '</p>';
  return h;
};
UI.ligneCal = function (lib, f) { return '<div class="ligne-ag"><span>' + UI.esc(lib) + '</span><b class="' + (f > 1.004 ? 'vert-txt' : f < 0.996 ? 'rouge-txt' : '') + '">' + UI.esc(Math.abs(f - 1) < 0.004 ? '=' : UI.pct(f)) + '</b></div>'; };

UI.htmlCalSemaine = function () {
  const S = UI.S;
  let h = '<p class="sous">' + UI.esc(B.t('cal_semaine_intro')) + '</p><table class="planning cal-7"><tr><th>' + UI.esc(B.t('cal_col_jour')) + '</th><th>' + UI.esc(B.t('cal_col_meteo')) + '</th><th>' + UI.esc(B.t('cal_col_affluence')) + '</th><th>' + UI.esc(B.t('cal_col_note')) + '</th></tr>';
  for (let d = 0; d < 7; d++) {
    const i = B.cal.infos(S, d), mq = UI.marquesDuJour(S, i);
    h += '<tr' + (d === 0 ? ' class="auj"' : '') + '><th>' + UI.esc(d === 0 ? B.t('cal_aujourdhui') : d === 1 ? B.t('cal_demain') : UI.dateCourte(S, d)) + '</th><td>' + UI.esc(i.meteo.emoji + ' ' + i.meteo.temp + '°') + '</td>' +
      '<td class="' + (i.facteur >= 1 ? 'vert-txt' : 'rouge-txt') + '">' + UI.esc(UI.pct(i.facteur)) + '</td><td class="gauche">' + mq.map(function (m) { return '<span class="marque ' + m.cls + '">' + UI.esc(m.txt) + '</span>'; }).join(' ') + '</td></tr>';
  }
  return h + '</table>';
};

UI.htmlCalMois = function () {
  const S = UI.S, T = B.DATA.textes, d0 = B.dateDuJour(S, 0);
  const premier = new Date(Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth() + UI.calMois, 1, 12));
  const nbJours = new Date(Date.UTC(premier.getUTCFullYear(), premier.getUTCMonth() + 1, 0, 12)).getUTCDate();
  const decal0 = Math.round((premier - d0) / 864e5);
  let h = '<div class="cal-nav"><button type="button" class="petit-btn mini" data-cal-mois="-1" aria-label="' + UI.esc(B.t('cal_mois_avant')) + '">◀</button><b>' + UI.esc(T.mois_noms[premier.getUTCMonth()] + ' ' + premier.getUTCFullYear()) + '</b><button type="button" class="petit-btn mini" data-cal-mois="1" aria-label="' + UI.esc(B.t('cal_mois_apres')) + '">▶</button></div>';
  h += '<div class="cal-grille">' + [1, 2, 3, 4, 5, 6, 0].map(function (j) { return '<div class="cal-entete">' + UI.esc(T.jours_court[j]) + '</div>'; }).join('');
  const vide = (premier.getUTCDay() + 6) % 7;
  for (let k = 0; k < vide; k++) h += '<div class="cal-case vide"></div>';
  for (let j = 1; j <= nbJours; j++) {
    const dec = decal0 + j - 1, i = B.cal.infos(S, dec), mq = UI.marquesDuJour(S, i);
    const cls = 'cal-case' + (dec === 0 ? ' auj' : '') + (dec < 0 ? ' passe' : '') + (i.ferie ? ' ferie' : '') + (i.vacances ? ' vac' : '');
    h += '<div class="' + cls + '"><span class="num">' + j + (dec >= 0 && dec < 15 ? ' <small>' + UI.esc(i.meteo.emoji) + '</small>' : '') + '</span>' +
      mq.filter(function (m) { return m.cls !== 'vac'; }).slice(0, 2).map(function (m) { return '<span class="ev ' + m.cls + '">' + UI.esc(m.txt) + '</span>'; }).join('') + '</div>';
  }
  h += '</div><p class="sous">' + UI.esc(B.t('cal_legende')) + '</p>';
  return h;
};

UI.htmlCalEvenements = function () {
  const S = UI.S, C = S.cal, P = B.DATA.calendrier.evenementsPrives;
  let h = '';
  const F = B.ev.fetesEnAttente(S);
  h += '<h3>' + UI.esc(B.t('cal_fetes_titre')) + '</h3>';
  if (!F.length) h += '<p class="sous">' + UI.esc(B.t('cal_fetes_aucune')) + '</p>';
  F.forEach(function (f) {
    const m = B.ev.infoMenu(S, f.k), plats = B.ev.platsDeFete(S).filter(function (d) { return d.fete === f.k; });
    h += '<div class="carte-ev"><b>' + UI.esc(m.emoji + ' ' + m.nom + (f.vac ? ' · ' + f.vac : '')) + '</b><span>' + UI.esc(B.t('cal_fete_dates', { de: B.ev.texteJour(S, f.debut), a: B.ev.texteJour(S, f.fin) })) + '</span>';
    h += '<span class="sous">' + UI.esc(B.t('cal_fete_chef')) + '</span><ul>' + plats.map(function (d) { return '<li>' + UI.esc(d.emoji + ' ' + d.nom + ' · ' + B.prix(B.carte.prixConseille(S, d))) + '</li>'; }).join('') + '</ul>';
    h += '<div class="rang"><button type="button" class="gros principal" data-cal-fete="' + f.id + '" data-oui="1">' + UI.esc(B.t('cal_fete_oui')) + '</button><button type="button" class="gros" data-cal-fete="' + f.id + '" data-oui="0">' + UI.esc(B.t('cal_fete_non')) + '</button></div></div>';
  });
  const enCours = Object.keys(C.fetes).map(function (id) { return C.fetes[id]; }).filter(function (f) { return f.etat === 'oui' && f.fin >= S.jour; });
  enCours.forEach(function (f) { const m = B.ev.infoMenu(S, f.k); h += '<p>' + UI.esc(B.t(S.jour >= f.debut ? 'cal_fete_en_cours' : 'cal_fete_prevue', { nom: m.emoji + ' ' + m.nom, de: B.ev.texteJour(S, f.debut), a: B.ev.texteJour(S, f.fin) })) + '</p>'; });
  h += '<h3>' + UI.esc(B.t('cal_prives_titre')) + '</h3>';
  const ouverts = B.ev.ouverts(S), resa = C.prives.filter(function (e) { return e.etat === 'reserve'; }).sort(function (a, b) { return a.jour - b.jour; });
  if (!ouverts.length && !resa.length) h += '<p class="sous">' + UI.esc(B.t('cal_prives_aucun', { jour: P.aPartirDuJour })) + '</p>';
  ouverts.concat(resa).forEach(function (e) {
    const T = B.ev.typePrive(S, e.type);
    h += '<button type="button" class="ligne-prive' + (e.etat === 'reserve' ? '' : ' a-faire') + '" data-cal-prive="' + e.id + '"><b>' + UI.esc(T.emoji + ' ' + T.nom + ' · ' + e.nom) + '</b><span>' +
      UI.esc(B.t('cal_prive_resume', { n: e.n, date: B.ev.texteJour(S, e.jour), heure: B.heure(e.debut) })) + '</span><span class="etat">' + UI.esc(B.t('cal_prive_etat_' + e.etat, { date: B.ev.texteJour(S, e.expire) })) + '</span></button>';
  });
  const passes = C.prives.filter(function (e) { return e.etat === 'fini' || e.etat === 'perdu'; }).slice(-4).reverse();
  if (passes.length) h += '<p class="sous">' + passes.map(function (e) { return UI.esc(B.ev.typePrive(S, e.type).emoji + ' ' + e.nom + ' : ' + B.t('cal_prive_etat_' + e.etat) + (e.etat === 'fini' ? ' (' + B.euros(e.n * e.prix) + ')' : '')); }).join('<br>') + '</p>';
  h += '<p class="sous">' + UI.esc(B.t('cal_prives_regle', { acompte: Math.round(P.acompte * 100) })) + '</p>';
  return h;
};

UI.htmlPrive = function (e) {
  const S = UI.S, T = B.ev.typePrive(S, e.type), cpp = B.ev.coutParPersonne(S, e);
  let h = '<button type="button" class="petit-btn" data-cal-retour="1">' + UI.esc(B.t('cal_retour')) + '</button><div class="gros-texte">';
  h += '<h3>' + UI.esc(T.emoji + ' ' + T.nom + ' · ' + e.nom) + '</h3>';
  h += '<p>' + UI.esc(B.t('cal_prive_detail', { n: e.n, date: B.ev.texteJour(S, e.jour), service: B.t('cal_service_' + e.service), de: B.heure(e.debut), a: B.heure(e.fin) })) + '</p>';
  h += '<p class="sous">' + UI.esc(B.t('cal_prive_etat_' + e.etat, { date: B.ev.texteJour(S, e.expire) })) + '</p>';
  h += '<h3>' + UI.esc(B.t('cal_prive_menu')) + '</h3><ul class="menu-prive">' + e.plats.map(function (id) { const d = B.carte.plat(S, id); return d ? '<li>' + UI.esc(d.emoji + ' ' + d.nom) + '</li>' : ''; }).join('') + '</ul>';
  h += UI.ligneAg(B.t('cal_prive_cout'), cpp);
  if (e.etat === 'appel' || e.etat === 'nego') {
    if (e.etat === 'nego') h += '<p class="alerte-ag">' + UI.esc(B.t('cal_prive_trop_cher')) + '</p>';
    h += '<p class="sous">' + UI.esc(B.t('cal_prive_conseil', { prix: B.euros(B.ev.prixConseille(S, e)) })) + '</p>';
    h += '<div class="prix-prive"><button type="button" class="petit-btn gros-mini" data-cal-prix="-1" aria-label="' + UI.esc(B.t('carte_moins')) + '">−</button><b class="gros-prix">' + UI.esc(B.euros(e.prix)) + '</b><button type="button" class="petit-btn gros-mini" data-cal-prix="1" aria-label="' + UI.esc(B.t('carte_plus')) + '">+</button><span>' + UI.esc(B.t('cal_par_personne')) + '</span></div>';
    h += '<p>' + UI.esc(B.t('cal_prive_total', { total: B.euros(e.prix * e.n), marge: B.euros((e.prix - cpp) * e.n), acompte: B.euros(Math.round(e.prix * e.n * B.DATA.calendrier.evenementsPrives.acompte)) })) + '</p>';
    h += '<div class="rang"><button type="button" class="gros principal" data-cal-action="proposer">' + UI.esc(B.t('cal_prive_proposer')) + '</button><button type="button" class="gros" data-cal-action="decliner">' + UI.esc(B.t('cal_prive_decliner')) + '</button></div>';
  } else if (e.etat === 'contre') {
    h += '<p class="alerte-ag">' + UI.esc(B.t('cal_prive_contre', { prix: B.euros(e.contre), marge: B.euros((e.contre - cpp) * e.n) })) + '</p>';
    h += '<div class="rang"><button type="button" class="gros principal" data-cal-action="contre">' + UI.esc(B.t('cal_prive_accepter', { prix: B.euros(e.contre) })) + '</button><button type="button" class="gros" data-cal-action="decliner">' + UI.esc(B.t('cal_prive_refuser')) + '</button></div>';
  } else if (e.etat === 'reserve') {
    h += '<p>' + UI.esc(B.t('cal_prive_reserve', { prix: B.euros(e.prix), total: B.euros(e.prix * e.n), acompte: B.euros(e.acompte) })) + '</p>';
    h += '<p class="sous">' + UI.esc(B.t('cal_prive_stock')) + '</p>';
  }
  if (S.finJour && ['appel', 'nego', 'contre'].indexOf(e.etat) >= 0) h += '<p class="sous">' + UI.esc(B.t('cal_prive_demain')) + '</p>';
  return h + '</div>';
};

UI.rafraichirCalendrier = function (enHaut) {
  if (UI.voletOuvert !== 'calendrier') return;
  UI.$('volet-titre').textContent = B.t('cal_titre');
  const c = UI.$('volet-corps'), y = c.scrollTop;
  c.innerHTML = UI.htmlCalendrier();
  c.scrollTop = enHaut ? 0 : y;
  UI.majCalendrier();
};

/* ---------- Événement du jour : une fenêtre avec de gros boutons (le jeu attend ta réponse) ---------- */
UI.majEvenement = function () {
  const S = UI.S, el = UI.$('evenement');
  const a = S && S.cal && S.cal.attente;
  if (!a || S.finJour) { if (!el.hidden) { el.hidden = true; UI.pause('evenement', false); } return; }
  if (!el.hidden && el._id === a.id + ':' + a.minute) return;
  el._id = a.id + ':' + a.minute;
  const suffixe = a.variante ? '_' + a.variante : '';
  const vars = Object.assign({ sport: a.sport || '' }, a.vars || {});
  const emoji = a.id === 'resultat' || a.id === 'match' ? a.emoji : B.t('ev_' + a.id + '_emoji');
  const titre = a.id === 'resultat' ? a.titre : 'ev_' + a.id + '_titre' + suffixe, texte = a.id === 'resultat' ? a.texte : 'ev_' + a.id + '_texte' + suffixe;
  let h = '<div class="carte-fin carte-evenement"><h2>' + UI.esc(emoji + ' ' + B.t(titre, vars)) + '</h2>';
  h += '<p class="gros-texte">' + UI.esc(B.t(texte, vars)) + '</p>';
  B.ev.choix(S, a).forEach(function (c, k) {
    const v = Object.assign({}, vars, { prix: c.prix ? B.euros(c.prix) : '' }), effet = B.t(c.cle + '_effet', v);
    h += '<button type="button" class="gros' + (k === 0 ? ' principal' : '') + '" data-ev-choix="' + k + '">' + UI.esc(B.t(c.cle, v)) +
      (effet ? '<small>' + UI.esc(effet) + '</small>' : '') + '</button>';
  });
  el.innerHTML = h + '</div>';
  el.hidden = false;
  UI.pause('evenement', true);
};

/* ---------- Fin de journée : le temps de demain ---------- */
UI.texteDemain = function (S) {
  if (!S.cal) return '';
  const i = B.cal.infos(S, 1), mq = UI.marquesDuJour(S, i);
  return B.t('fin_demain', { date: B.texteDate(S, 1), meteo: UI.texteMeteo(i.meteo), affluence: UI.pct(i.facteur) }) + (mq.length ? ' · ' + mq.map(function (m) { return m.txt; }).join(' · ') : '');
};

UI.initCalendrier = function () {
  UI.$('btn-calendrier').addEventListener('click', function () { if (UI.S && UI.S.cal) { UI.calOnglet = UI.aDecider(UI.S) ? 'evenements' : 'jour'; UI.calMois = 0; UI.calPrive = null; UI.ouvrirVolet('calendrier'); } });
  UI.$('evenement').addEventListener('click', function (e) {
    const b = e.target.closest('[data-ev-choix]');
    if (!b || !UI.S) return;
    B.ev.choisir(UI.S, +b.dataset.evChoix);
    UI.$('evenement').hidden = true;
    UI.pause('evenement', false);
    UI.sauver(); UI.majBarre(); UI.majCalendrier();
  });
  UI.$('volet-corps').addEventListener('click', function (e) {
    if (UI.voletOuvert !== 'calendrier' || !UI.S) return;
    const S = UI.S;
    const o = e.target.closest('[data-cal-onglet]');
    if (o) { UI.calOnglet = o.dataset.calOnglet; UI.calPrive = null; UI.rafraichirCalendrier(true); return; }
    const m = e.target.closest('[data-cal-mois]');
    if (m) { UI.calMois = Math.max(-1, Math.min(12, UI.calMois + +m.dataset.calMois)); UI.rafraichirCalendrier(false); return; }
    const f = e.target.closest('[data-cal-fete]');
    if (f) { B.ev.repondreFete(S, f.dataset.calFete, f.dataset.oui === '1'); UI.sauver(); UI.rafraichirCalendrier(false); return; }
    const p = e.target.closest('[data-cal-prive]');
    if (p) { UI.calPrive = +p.dataset.calPrive; UI.rafraichirCalendrier(true); return; }
    if (e.target.closest('[data-cal-retour]')) { UI.calPrive = null; UI.rafraichirCalendrier(true); return; }
    const x = e.target.closest('[data-cal-prix]');
    if (x && UI.calPrive != null) { B.ev.changerPrix(S, UI.calPrive, +x.dataset.calPrix); UI.rafraichirCalendrier(false); return; }
    const a = e.target.closest('[data-cal-action]');
    if (a && UI.calPrive != null) {
      const k = a.dataset.calAction;
      if (k === 'proposer') B.ev.proposer(S, UI.calPrive);
      else if (k === 'contre') B.ev.accepterContre(S, UI.calPrive);
      else if (k === 'decliner') B.ev.decliner(S, UI.calPrive);
      UI.sauver(); UI.majBarre(); UI.rafraichirCalendrier(false);
    }
  });
};
