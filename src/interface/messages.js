/* messages.js — notifications dans leur zone réservée (jamais sur un bouton) et Journal complet. */
UI.toasts = [];
UI.DUREE_MESSAGE = 6000;
UI.MAX_VISIBLES = 3;

UI.majMessages = function (maintenant) {
  while (B.flux.length) UI.toasts.push({ m: B.flux.shift(), fin: maintenant + UI.DUREE_MESSAGE });
  UI.toasts = UI.toasts.filter(function (t) { return t.fin > maintenant; });
  const el = UI.$('messages');
  /* On affiche jusqu'à 3 messages, moins s'ils ne tiennent pas en entier dans la zone. */
  for (let n = Math.min(UI.MAX_VISIBLES, UI.toasts.length); n >= 0; n--) {
    const visibles = UI.toasts.slice(UI.toasts.length - n).reverse();
    const caches = UI.toasts.length - n;
    let html = visibles.map(function (t) {
      return '<div class="msg"><span class="h">' + B.heure(t.m.minute) + '</span> ' + UI.esc(t.m.texte) + '</div>';
    }).join('');
    if (caches > 0) html += '<div class="msg-plus">' + UI.esc(B.t('msg_plus', { n: caches })) + '</div>';
    if (el._html === html) return;
    el.innerHTML = html;
    if (el.scrollHeight <= el.clientHeight + 1 || n === 0) { el._html = html; return; }
  }
};

UI.htmlJournal = function () {
  const J = UI.S ? UI.S.journal.slice().reverse() : [];
  if (!J.length) return '<p>' + UI.esc(B.t('journal_vide')) + '</p>';
  return '<ul class="journal">' + J.map(function (m) {
    return '<li><span class="h">' + UI.esc(B.t('journal_ligne', { jour: m.jour, heure: B.heure(m.minute) })) + '</span>' + UI.esc(m.texte) + '</li>';
  }).join('') + '</ul>';
};
