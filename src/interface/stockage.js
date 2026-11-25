/* stockage.js — rangement de la partie sur le téléphone. Cases propres à ce lien (TEST ou OFFICIEL).
   Les cases de l'ancien jeu (« bistrot_… ») sont seulement lues, jamais écrites. */
UI.cles = function () { return B.cles(B.CANAL); };

UI.lireCase = function (cle) { try { return localStorage.getItem(cle); } catch (e) { return null; } };
UI.ecrireCase = function (cle, valeur) {
  if (cle.indexOf('bistrotjeu.') !== 0) throw new Error('écriture interdite hors des cases de Bistrot');
  localStorage.setItem(cle, valeur);
};

UI.sauver = function () {
  if (!UI.S) return;
  const K = UI.cles();
  try {
    const avant = UI.lireCase(K.partie);
    const txt = B.serialiser(UI.S);
    if (avant && avant !== txt) UI.ecrireCase(K.secours, avant);
    UI.ecrireCase(K.partie, txt);
    UI.derniereSauvegarde = UI.S.minute;
  } catch (e) {
    if (!UI._alerteStockage) { UI._alerteStockage = true; B.message(UI.S, 'erreur_stockage'); }
  }
};

/* Renvoie { partie } ou { erreur } ; essaie la copie de secours si la sauvegarde principale est abîmée. */
UI.chargerPartie = function () {
  const K = UI.cles();
  const txt = UI.lireCase(K.partie);
  if (!txt) return {};
  const r = B.relire(txt);
  if (r.partie || r.erreur === 'erreur_sauvegarde_recente') return r;
  const sec = UI.lireCase(K.secours);
  if (sec) { const r2 = B.relire(sec); if (r2.partie) return r2; }
  return r;
};

UI.chargerReglages = function () {
  try { const r = JSON.parse(UI.lireCase(UI.cles().reglages) || '{}'); if (typeof r.pauseAuto === 'boolean') UI.reglages.pauseAuto = r.pauseAuto; if (typeof r.son === 'boolean') UI.reglages.son = r.son; if (r.volume >= 1 && r.volume <= 10) UI.reglages.volume = Math.round(r.volume); } catch (e) { /* réglages par défaut */ }
};
UI.sauverReglages = function () {
  try { UI.ecrireCase(UI.cles().reglages, JSON.stringify(UI.reglages)); } catch (e) { /* tant pis */ }
};
