/* avis.js (v1.0) — la réputation et les avis des clients : onglet « ⭐ Avis » du Journal, ligne du panneau, bilan du soir.
   Gros textes, étoiles bien visibles, phrases courtes. */
UI.jrOnglet = 'journal';   /* journal | avis */

UI.etoiles = function (n) {
  const r = Math.max(0, Math.min(5, Math.round(n)));
  return '★★★★★'.slice(0, r) + '☆☆☆☆☆'.slice(0, 5 - r);
};
UI.noteTexte = function (n) { return (Math.round(n * 10) / 10).toFixed(1).replace('.', ','); };
UI.deltaTexte = function (d) {
  const v = Math.round((d || 0) * 100) / 100;
  return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(2).replace('.', ',');
};

UI.htmlVoletJournal = function () {
  const tabs = UI.onglets('data-jr-onglet', [['journal', B.t('jr_onglet_journal')], ['avis', B.t('jr_onglet_avis')]], UI.jrOnglet);
  return tabs + (UI.jrOnglet === 'avis' ? UI.htmlAvis() : UI.htmlJournal());
};

UI.htmlAvis = function () {
  const S = UI.S;
  if (!S) return '';
  const n = B.rep.note(S), M = B.rep.D().michelin;
  let h = '<div class="rep-tete"><span class="rep-etoiles" aria-hidden="true">' + UI.etoiles(n) + '</span><b>' + UI.esc(B.t('avis_reputation', { note: UI.noteTexte(n) })) + '</b></div>';
  h += '<p class="rep-ligne">' + UI.esc(B.t('avis_aujourdhui', { delta: UI.deltaTexte(S.stats.jour.repDelta) })) + ' · ' + UI.esc(B.t('avis_affluence', { pct: UI.pct(B.rep.facteurAffluence(S)) })) + '</p>';
  if (S.michelin && S.michelin.etoile) h += '<p class="rep-michelin">' + UI.esc(B.t('avis_michelin', { date: B.ev.texteJour(S, S.michelin.etoile) })) + '</p>';
  /* d'abord les avis (le plus intéressant), puis l'explication */
  const A = (S.avis || []).slice(0, 30);
  h += '<h3>' + UI.esc(B.t('avis_titre_liste')) + '</h3>';
  if (!A.length) h += '<p class="rep-explique">' + UI.esc(B.t('avis_vide')) + '</p>';
  else {
    h += '<p class="rep-ligne">' + UI.esc(B.t('avis_moyenne', { n: S.avis.length, moy: UI.noteTexte(B.rep.moyenneAvis(S)) })) + '</p>';
    h += '<ul class="avis-liste">' + A.map(function (a) {
      return '<li class="avis e' + a.etoiles + '"><div class="avis-tete"><span class="avis-etoiles" aria-label="' + a.etoiles + ' / 5">' + UI.etoiles(a.etoiles) + '</span>' +
        '<span class="avis-qui">' + UI.esc(B.t('avis_ligne_tete', { auteur: a.auteur, jour: a.jour, heure: B.heure(a.minute) })) + '</span></div>' +
        '<p>' + UI.esc(a.texte) + '</p></li>';
    }).join('') + '</ul>';
  }
  h += '<h3>' + UI.esc(B.t('avis_comment')) + '</h3><p class="rep-explique">' + UI.esc(B.t('avis_explication')) + '</p>';
  if (!(S.michelin && S.michelin.etoile)) h += '<p class="rep-explique">' + UI.esc(B.t('avis_michelin_pas', { jours: M.jours, employes: M.employes })) + '</p>';
  return h;
};

UI.ouvrirAvis = function () { UI.jrOnglet = 'avis'; UI.ouvrirVolet('journal'); };

/* Bilan du soir : la réputation du jour et le meilleur / le moins bon avis. */
UI.htmlFinAvis = function (b) {
  if (b.reputation == null) return '';
  let h = '<div class="fin-avis"><b>' + UI.esc(B.t('fin_reputation', { note: UI.noteTexte(b.reputation), delta: UI.deltaTexte(b.repDelta), n: b.nbAvis || 0 })) + '</b>';
  const A = (b.avisJour || []).slice().sort(function (x, y) { return y.etoiles - x.etoiles; });
  if (A.length) h += '<span>' + UI.esc(B.t('fin_avis_meilleur', { etoiles: UI.etoiles(A[0].etoiles), texte: A[0].texte })) + '</span>';
  if (A.length > 1 && A[A.length - 1].etoiles < A[0].etoiles) h += '<span>' + UI.esc(B.t('fin_avis_pire', { etoiles: UI.etoiles(A[A.length - 1].etoiles), texte: A[A.length - 1].texte })) + '</span>';
  return h + '</div>';
};
