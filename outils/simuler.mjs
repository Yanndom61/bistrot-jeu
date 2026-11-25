// simuler.mjs — joue des journées entières sans écran et sort un bilan.
// Utilisation : node outils/simuler.mjs [jours=5] [lieux=paris,tokyo,... ou tous]
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { moteur } from './assembler.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jours = +(process.argv[2] || 5);
const LISTE = process.argv[3] || 'paris,idf,bretagne,corse,reunion,polynesie,londres,new-york,tokyo,dakar,canberra,mayotte';
const NIVEAUX7 = ['paris', 'idf', 'bretagne', 'reunion', 'new-york', 'tokyo', 'mayotte'];   /* lieux joués aussi en Normal et Difficile */

const ctx = {};
vm.createContext(ctx);
vm.runInContext(moteur() + '\nthis.B = B;', ctx);
const B = ctx.B;
const lieux = LISTE === 'tous' ? B.DATA.lieux.lieux.map((l) => l.id) : LISTE.split(',');
/* Joueur moyen face aux événements (v0.8) : un choix sur deux pour les événements du jour, oui aux menus de fête,
   prix conseillé pour les événements privés, puis 2,4 × le coût si le client discute, contre-offre acceptée. */
B.ev.choixAuto = (S, a) => (S.jour + a.minute) % 2;
function gererEvenements(S) {
  for (const f of B.ev.fetesEnAttente(S)) B.ev.repondreFete(S, f.id, true);
  for (const e of B.ev.ouverts(S)) {
    if (e.etat === 'contre') B.ev.accepterContre(S, e.id);
    else if (e.etat === 'appel') B.ev.proposer(S, e.id);
    else if (e.etat === 'nego') { e.prix = Math.ceil(B.ev.coutParPersonne(S, e) * 2.4); B.ev.proposer(S, e.id); }
  }
}

let erreurs = 0;
const probleme = (msg) => { erreurs++; console.log('  ✗ ' + msg); };

// Recrute automatiquement : le premier candidat de chaque poste demandé, au salaire qu'il demande.
function recruter(S, postes) {
  for (const poste of postes) {
    const c = S.candidats.find((x) => x.poste === poste);
    if (!c) { probleme('pas de candidat ' + poste); continue; }
    B.equipe.repondre(S, c, 'salaire');
    const r = B.equipe.proposer(S, c, c.demande);
    if (r.r !== 'accepte') probleme('embauche refusée au salaire demandé : ' + poste);
  }
}

function jouer(S, etiquette, jours, afficher, avantNuit) {
  const cumul = { arrives: 0, servis: 0, repartis: 0, attente: 0, recettes: 0, couverts: 0, tickets: 0, pourboires: 0, coutMatiere: 0, renvois: 0, jours: 0,
    achats: 0, gaspillage: 0, gaspPortions: 0, ruptures: 0, partisRupture: 0, mdj: 0, emporter: 0, boissons: 0, causes: {}, S: null,
    interim: 0, joursInterim: 0, formations: 0, absences: 0, partisSale: 0 };
  const heuresJour = B.DATA.argent.heuresInterimParJour;
  cumul.resultat = 0; cumul.dep = {}; cumul.faillite = null;
  let argentAvant = S.argent;
  for (let j = 1; j <= jours; j++) {
    if (!S.ouvert) { gererEvenements(S); B.ouvrir(S); }
    if (!S.ouvert) { probleme(etiquette + ' : impossible d’ouvrir'); return cumul; }
    let pas = 0;
    const interims = S.equipe.filter((p) => p.interim);
    cumul.interim += interims.reduce((s, p) => s + p.salaire * heuresJour, 0); cumul.joursInterim += interims.length;
    cumul.absences += S.equipe.filter((p) => p.absent).length;
    while (!S.finJour && pas < 4000) {
      B.avancer(S, 0.5);
      pas++;
      if (pas % 60 === 0) gererEvenements(S);
      if (pas === 120 || pas === 1100) {
        const r = B.relire(B.serialiser(S));
        if (!r.partie) probleme('sauvegarde illisible : ' + r.erreur);
        else S = r.partie;
      }
      if (pas % 20 === 0) for (const pb of B.verifier(S)) probleme(`${etiquette} jour ${j} ${B.heure(S.minute)} : ${pb}`);
    }
    if (!S.finJour) probleme(`${etiquette} jour ${j} : la journée ne se termine pas`);
    {
      /* l'argent a bougé exactement des recettes moins toutes les dépenses comptées (depuis le soir d'avant) */
      const st0 = S.stats.jour, dep = B.argent.POSTES.reduce((t, k) => t + (st0[k] || 0), 0);
      if (Math.abs(S.argent - argentAvant - (st0.recettes - dep)) > 0.05) probleme(`${etiquette} jour ${j} : l’argent a bougé de ${(S.argent - argentAvant).toFixed(2)} mais recettes − dépenses = ${(st0.recettes - dep).toFixed(2)}`);
      if (S.bilan && Math.abs(S.bilan.resultat - (st0.recettes - dep)) > 0.05) probleme(`${etiquette} jour ${j} : bénéfice du bilan faux`);
      argentAvant = S.argent;
      if (S.bilan) { cumul.resultat += S.bilan.resultat; for (const k in S.bilan.depenses) cumul.dep[k] = (cumul.dep[k] || 0) + S.bilan.depenses[k]; }
    }
    const b = S.bilan || {};
    if (S.faillite) { cumul.faillite = S.jour; cumul.jours++; cumul.recettes += S.stats.jour.recettes; cumul.servis += S.stats.jour.servis; cumul.arrives += S.stats.jour.arrives; cumul.repartis += S.stats.jour.repartis; break; }
    if (avantNuit) avantNuit(S, j);
    const st = S.stats.jour;
    if (afficher) console.log(`${etiquette.padEnd(14)} ${String(j).padStart(4)} ${String(st.groupes).padStart(8)} ${String(st.arrives).padStart(8)} ${String(st.servis).padStart(7)} ${String(st.repartis).padStart(9)} ${String(b.attente ?? '-').padStart(7)} min ${B.euros(st.recettes).padStart(10)} ${B.prix(b.ticketMoyen || 0).padStart(10)} ${String(st.platsRenvoyes).padStart(7)} ${B.prix(st.pourboires).padStart(11)}  ${B.heure(S.minute)}`);
    cumul.formations += st.formations || 0; cumul.partisSale += st.partisSale || 0;
    for (const r of b.ruptures || []) {
      cumul.causes[r.cause] = (cumul.causes[r.cause] || 0) + 1;
      if (!r.cause || !B.DATA.textes[r.cause] || !r.manque || !r.manque.length) probleme(`${etiquette} jour ${j} : rupture de ${r.nom} sans explication`);
    }
    cumul.achats += st.achats; cumul.gaspillage += st.gaspillage; cumul.gaspPortions += st.gaspillagePortions; cumul.ruptures += (b.ruptures || []).length;
    cumul.partisRupture += st.partisRupture; cumul.mdj += st.mdjVendus; cumul.emporter += st.emporter; cumul.boissons += st.boissons;
    if (st.couverts !== st.servis) probleme(`${etiquette} jour ${j} : ${st.servis} servis mais ${st.couverts} couverts payés`);
    if (st.servis + st.repartis !== st.arrives) probleme(`${etiquette} jour ${j} : ${st.arrives} arrivés mais ${st.servis} servis + ${st.repartis} repartis`);
    for (const pb of B.verifier(S)) probleme(`${etiquette} jour ${j} fin : ${pb}`);
    cumul.arrives += st.arrives; cumul.servis += st.servis; cumul.repartis += st.repartis; cumul.attente += b.attente || 0;
    cumul.recettes += st.recettes; cumul.couverts += st.couverts; cumul.tickets += st.tickets; cumul.pourboires += st.pourboires; cumul.coutMatiere += st.coutMatiere; cumul.renvois += st.platsRenvoyes; cumul.jours++;
    B.jourSuivant(S);
  }
  cumul.S = S;
  return cumul;
}

console.log(`Simulation : ${jours} jours × ${lieux.length} lieux (difficulté Facile, puis Normal et Difficile à l’étape 5)\n`);
console.log('Équipe : patron en salle + 1 serveur + 1 commis de cuisine');
console.log('lieu           jour  groupes  arrivés  servis  repartis  attente     recettes  ticket moy. renvois  pourboires  fin');
const resumeLieux = [];
for (const lieu of lieux) {
  if (!B.DATA.lieux.lieux.find((l) => l.id === lieu)) { probleme('lieu inconnu ' + lieu); continue; }
  const S = B.creerPartie({ nom: 'Test', lieu, graine: 12345 + lieu.length * 7919 + lieu.charCodeAt(0) });
  if (B.ouvrir(S)) probleme('le restaurant ne devrait pas ouvrir sans cuisinier');
  recruter(S, ['serv', 'commis']);
  const c = jouer(S, lieu, jours, true);
  resumeLieux.push([lieu, c]);
  if (B.DATA.catalogue.pourboires[lieu] && !B.DATA.catalogue.pourboires[lieu][0] && c.pourboires > 0) probleme(lieu + ' : des pourboires alors que l’usage du lieu est zéro');
}
console.log('\nMoyenne par jour : lieu · clients servis · recettes · ticket moyen par table · coût des produits utilisés · plats renvoyés · pourboires (cagnotte)');
for (const [lieu, c] of resumeLieux) {
  const n = c.jours || 1;
  console.log(`  ${lieu.padEnd(12)} ${String(Math.round(c.servis / n)).padStart(4)} servis  ${B.euros(c.recettes / n).padStart(9)}  ${B.prix(c.recettes / Math.max(1, c.tickets)).padStart(9)}  coût ${String(Math.round(c.coutMatiere / Math.max(1, c.recettes) * 100)).padStart(2)} %  ${(c.renvois / n).toFixed(1).padStart(4)} renvois  ${B.prix(c.pourboires / n).padStart(9)}`);
}

// Stocks et argent : un joueur moyen (patron + serveur + commis, commande automatique de la difficulté Facile, prix conseillés).
console.log('\nArgent par jour en Facile (commande automatique) : bénéfice réel du bilan du soir = recettes − achats − salaires payés (39 h, intérimaires des jours de repos compris) − charges courantes');
let pertes = 0;
for (const [lieu, c] of resumeLieux) {
  const n = c.jours || 1, sal = ((c.dep.salaires || 0) + (c.dep.interim || 0)) / n, res = c.resultat / n;
  console.log(`  ${lieu.padEnd(12)} recettes ${B.euros(c.recettes / n).padStart(8)} · achats ${B.euros(c.achats / n).padStart(7)} (${Math.round(c.achats / Math.max(1, c.recettes) * 100)} %) · salaires ${B.euros(sal).padStart(6)} (dont intérim ${B.euros((c.dep.interim || 0) / n)}, ${c.joursInterim} jours) · charges ${B.euros((c.dep.charges || 0) / n)} · propreté ${c.S.proprete} · résultat ${B.euros(res).padStart(8)} · caisse ${B.euros(c.S.argent)} · gaspillage ${(c.gaspPortions / n).toFixed(1)} portions (${B.euros(c.gaspillage / n)}) · ruptures ${(c.ruptures / n).toFixed(1)} · menus du jour ${Math.round(c.mdj / n)} + ${Math.round(c.emporter / n)} à emporter · boissons ${Math.round(c.boissons / n)}`);
  if (res <= 0) { pertes++; probleme(lieu + ' : un joueur moyen perd de l’argent en Facile'); }
  if (!c.mdj) probleme(lieu + ' : aucun menu du jour vendu');
  if (!c.boissons) probleme(lieu + ' : aucune boisson vendue');
}
if (!pertes) console.log('  ✓ joueur moyen bénéficiaire partout en Facile.');
{
  const tout = {};
  for (const [, c] of resumeLieux) for (const k in c.causes) tout[k] = (tout[k] || 0) + c.causes[k];
  console.log('  causes des ruptures en Facile : ' + (Object.entries(tout).map(([k, v]) => `${v} × « ${B.t(k, { heure: '…' })} »`).join(' ; ') || 'aucune'));
}

// Commande automatique coupée (joueur qui oublie de commander) puis joueur qui commande lui-même chaque soir chez le grossiste.
{
  console.log('\nRuptures : pourquoi elles arrivent (Paris, 6 jours) :');
  const causes = (c) => Object.entries(c.causes).map(([k, v]) => `${v} × « ${B.t(k, { heure: '…' })} »`).join(' ; ') || 'aucune';
  const PD = B.DATA.stocks.auto.parDefaut;
  if (!PD.facile || PD.normal || PD.difficile) probleme('la commande automatique doit être activée par défaut en Facile seulement');
  const S1 = B.creerPartie({ nom: 'Test', lieu: 'paris', graine: 4242 });
  if (!S1.stocks.auto) probleme('la commande automatique devrait être activée en Facile');
  S1.stocks.auto = false;   /* comme en Normal ou Difficile (difficultés pas encore jouables) */
  recruter(S1, ['serv', 'commis']);
  const c1 = jouer(S1, 'sans commande', 6, false);
  console.log(`  sans jamais commander : ${c1.ruptures} ruptures, ${c1.partisRupture} clients partis sans manger, causes : ${causes(c1)}`);
  if (!c1.ruptures || !c1.causes.rupture_cause_pas_commande) probleme('sans commande, il devrait y avoir des ruptures expliquées');
  const S2 = B.creerPartie({ nom: 'Test', lieu: 'paris', graine: 4242 });
  S2.stocks.auto = false;
  recruter(S2, ['serv', 'commis']);
  const c2 = jouer(S2, 'commande le soir', 6, false, (S) => { const l = B.stock.besoins(S); const r = B.stock.commander(S, 'grossiste', l); if (r.erreur && r.erreur !== 'stock_rien') probleme('commande du soir : ' + r.erreur); });
  console.log(`  commande chaque soir chez le grossiste (quantités proposées) : ${c2.ruptures} ruptures (${causes(c2)}), achats ${B.euros(c2.achats / 6)}/jour, gaspillage ${B.euros(c2.gaspillage / 6)}/jour, résultat avant salaires ${B.euros((c2.recettes - c2.achats) / 6)}/jour`);
  const S3 = B.creerPartie({ nom: 'Test', lieu: 'paris', graine: 4242 });
  recruter(S3, ['serv', 'commis']);
  S3.stocks.marge = 0;
  const c3 = jouer(S3, 'marge 0', 6, false);
  console.log(`  commande automatique sans marge de sécurité : ${c3.ruptures} ruptures (${causes(c3)}), gaspillage ${B.euros(c3.gaspillage / 6)}/jour`);
}

// Gaspillage : un gros achat de pain (se garde 2 jours) sans clients pour le manger.
{
  const S = B.creerPartie({ nom: 'Test', lieu: 'paris', graine: 5 });
  S.stocks.auto = false;
  const avant = B.stock.quantite(S, 'pain'), a0 = S.argent;
  const r = B.stock.commander(S, 'marche', { pain: 300 });
  if (!r.ok || Math.abs(a0 - S.argent - r.cout) > 0.01) probleme('achat : l’argent ne baisse pas du prix de la commande');
  S.minute += 130; B.stock.livrer(S);
  if (B.stock.quantite(S, 'pain') !== avant + 300) probleme('livraison : le pain n’est pas rangé');
  let jete = 0;
  for (let j = 0; j < 3; j++) { B.jourSuivant(S); jete += S.stats.jour.gaspillagePortions; }
  console.log(`\nGaspillage : 300 pains achetés ${B.euros(r.cout)} (argent ${B.euros(a0)} → ${B.euros(a0 - r.cout)}), personne pour les manger → ${jete} portions jetées en 3 matins.`);
  if (jete < 300) probleme('le pain périmé devrait être jeté');
}

// Saisons : passage de mai à juin à Paris, prix d'achat qui changent avec la saison.
{
  const S = B.creerPartie({ nom: 'Test', lieu: 'paris', graine: 6, debut: '2026-05-29' });
  const fraise = B.stock.prixAchat(S, 'fruits', 'grossiste');
  const S11 = B.creerPartie({ nom: 'Test', lieu: 'paris', graine: 6, debut: '2026-11-25' });
  const fraise11 = B.stock.prixAchat(S11, 'fruits', 'grossiste');
  const SR = B.creerPartie({ nom: 'Test', lieu: 'reunion', graine: 6, debut: '2026-11-25' });
  const mai = B.carte.surCarte(S).filter((id) => B.carte.plat(S, id).saison);
  recruter(S, ['serv', 'commis']);
  const c = jouer(S, 'saisons', 4, false);
  const S2 = c.S;
  const juin = B.carte.surCarte(S2).filter((id) => B.carte.plat(S2, id).saison);
  const horsSaison = B.carte.surCarte(S2).filter((id) => !B.carte.enSaison(S2, B.carte.plat(S2, id)));
  console.log(`\nSaisons : fruits au grossiste ${B.prix(fraise)} en mai, ${B.prix(fraise11)} en novembre (${B.prix(B.stock.prixAchat(SR, 'fruits', 'grossiste'))} à La Réunion en novembre : saisons inversées).`);
  console.log(`  à la carte en mai : ${mai.map((id) => B.carte.plat(S, id).nom).join(', ') || 'aucun plat de saison'} ; le ${B.texteDate(S2)} : ${juin.map((id) => B.carte.plat(S2, id).nom).join(', ') || 'aucun'} ; hors saison restés à la carte : ${horsSaison.length}.`);
  if (horsSaison.length) probleme('un plat hors saison est resté à la carte');
  if (!(fraise < fraise11)) probleme('les fruits devraient coûter moins cher en saison');
}

// Menu du jour modifié par le joueur (v0.5.1) : choix parmi les plats faisables, refus clair sinon, retour à la proposition, sauvegarde.
{
  const S = B.creerPartie({ nom: 'Test', lieu: 'paris', graine: 8 });
  recruter(S, ['serv', 'commis']);
  const auto = S.stocks.mdj.plat, L = B.menuJour.choix(S, 'plat');
  const ok = L.find((x) => x.assez && !x.actuel), ko = L.find((x) => !x.faisable);
  const r1 = B.menuJour.choisir(S, 'plat', ok.d.id);
  if (!r1.ok || S.stocks.mdj.plat !== ok.d.id) probleme('menu du jour : un plat faisable est refusé');
  const r2 = ko ? B.menuJour.choisir(S, 'plat', ko.d.id) : { erreur: 'mdj_err_manque' };
  if (r2.erreur !== 'mdj_err_manque') probleme('menu du jour : un plat sans ingrédients est accepté');
  B.menuJour.choisir(S, 'dessert', null);
  if (B.menuJour.formules(S).join() !== 'ep') probleme('menu du jour : sans dessert, il ne reste pas « entrée + plat »');
  if (!B.menuJour.choisir(S, 'plat', null).erreur) probleme('menu du jour : il doit toujours y avoir un plat');
  const T = B.relire(B.serialiser(S)).partie;
  if (T.stocks.mdj.plat !== ok.d.id || !B.menuJour.estModifie(T)) probleme('menu du jour : le choix ne tient pas dans la sauvegarde');
  const c = jouer(T, 'menu modifié', 1, false);
  const S2 = c.S;
  B.menuJour.revenirAuto(S2);
  console.log(`\nMenu du jour modifié : ${B.menuJour.plat(S, auto).nom} → ${ok.d.nom} (${r1.portions} menus), ${ko ? `« ${ko.d.nom} » refusé (${B.t(r2.erreur, r2.vars)})` : 'aucun plat impossible ce jour-là'} ; ${c.mdj} menus vendus dans la journée ; le lendemain, nouveau menu proposé automatiquement : ${B.menuJour.plat(S2, S2.stocks.mdj.plat) ? B.menuJour.plat(S2, S2.stocks.mdj.plat).nom : 'aucun'} (modifié : ${B.menuJour.estModifie(S2)}).`);
  if (B.menuJour.estModifie(S2)) probleme('menu du jour : le choix du joueur ne devrait valoir que pour la journée');
}

// Comparaison de différentes équipes à Paris (moyennes par jour).
console.log('\nComparaison des équipes à Paris (moyenne par jour) :');
const equipes = [
  ['patron seul en salle + 1 commis', ['commis']],
  ['patron + 1 serveur + 1 commis', ['serv', 'commis']],
  ['patron + 2 serveurs + chef + commis', ['serv', 'serv', 'chef', 'commis']]
];
for (const [nom, postes] of equipes) {
  const S = B.creerPartie({ nom: 'Test', lieu: 'paris', graine: 777 });
  recruter(S, postes);
  const c = jouer(S, nom, jours, false);
  console.log(`  ${nom.padEnd(38)} arrivés ${(c.arrives / jours).toFixed(0).padStart(4)}  servis ${(c.servis / jours).toFixed(0).padStart(4)}  repartis ${(100 * c.repartis / Math.max(1, c.arrives)).toFixed(0).padStart(3)} %  attente avant commande ${(c.attente / jours).toFixed(1)} min`);
}

// Le patron peut changer de poste, sauf s'il laisse un poste vide.
{
  const S = B.creerPartie({ nom: 'Test', lieu: 'paris', graine: 9 });
  recruter(S, ['commis']);
  if (B.equipe.changerPatron(S)) probleme('le patron ne doit pas laisser la salle vide');
  recruter(S, ['serv']);
  if (!B.equipe.changerPatron(S) || B.equipe.patron(S).service !== 'cuisine') probleme('le patron devrait pouvoir passer en cuisine');
}

// Placement manuel : rien ne s'assoit tout seul, et le joueur peut placer un groupe.
{
  const S = B.creerPartie({ nom: 'Test', lieu: 'paris', graine: 31 });
  recruter(S, ['serv', 'commis']);
  S.placement = 'manuel';
  B.ouvrir(S);
  B.avancer(S, 40);
  const assisAuto = S.groupes.filter((g) => g.tables).length;
  if (assisAuto) probleme('placement manuel : des groupes se sont assis tout seuls');
  let place = 0, refus = 0;
  for (const g of S.groupes.filter((x) => x.etat === 'file')) {
    for (const t of S.tables) {
      const r = B.clients.placerManuel(S, g.id, t.id);
      if (r.ok) { place++; break; } else refus++;
    }
  }
  B.avancer(S, 30);
  B.verifier(S).forEach((p) => probleme('placement manuel : ' + p));
  const t1 = B.salle.tableDe(S, 1);
  console.log(`\nPlacement manuel : ${place} groupe(s) placé(s) à la main, ${refus} essai(s) refusé(s) (table trop petite ou prise), aucun placement automatique.`);
  void t1;
}

// Renvoyer un employé : jamais le patron, jamais la salle ou la cuisine vide en service,
// en plein service il finit sa tâche puis part.
{
  const S0 = B.creerPartie({ nom: 'Test', lieu: 'paris', graine: 77 });
  recruter(S0, ['serv', 'commis']);
  const serv0 = S0.equipe.find((p) => p.poste === 'serv');
  if (B.equipe.peutRenvoyer(S0, B.equipe.patron(S0)) !== 'renvoi_patron') probleme('renvoi : le patron ne doit pas pouvoir être renvoyé');
  if (!B.equipe.renvoyer(S0, serv0) || S0.equipe.some((p) => p.id === serv0.id)) probleme('renvoi : avant l’ouverture, il devrait partir tout de suite');
  const commis0 = S0.equipe.find((p) => p.poste === 'commis');
  if (B.equipe.peutRenvoyer(S0, commis0)) probleme('renvoi : avant l’ouverture, on peut renvoyer même le seul cuisinier');

  let S = B.creerPartie({ nom: 'Test', lieu: 'paris', graine: 78 });
  recruter(S, ['serv', 'serv', 'commis', 'chef']);
  B.ouvrir(S);
  B.avancer(S, 95);
  const servs = S.equipe.filter((p) => p.poste === 'serv'), cuis = S.equipe.filter((p) => p.poste === 'commis' || p.poste === 'chef');
  // Serveur occupé : il finit sa tâche.
  let w = servs.find((p) => p.tache);
  for (let i = 0; !w && i < 200; i++) { B.avancer(S, 0.2); w = servs.find((p) => p.tache); }
  const tacheAvant = w && w.tache.type;
  B.equipe.renvoyer(S, w);
  if (!S.equipe.some((p) => p.id === w.id)) probleme('renvoi en service : le serveur aurait dû finir sa tâche avant de partir');
  // Cuisinier occupé : il finit ses commandes, n'en prend pas de nouvelles.
  let k = cuis.find((p) => B.equipe.occupe(S, p));
  for (let i = 0; !k && i < 200; i++) { B.avancer(S, 0.2); k = cuis.find((p) => B.equipe.occupe(S, p)); }
  const commandesAvant = S.groupes.filter((g) => g.etat === 'cuisine' && g.cuisinier === k.id).map((g) => g.id);
  B.equipe.renvoyer(S, k);
  const autreK = cuis.find((p) => p.id !== k.id);
  if (B.equipe.peutRenvoyer(S, autreK) !== 'renvoi_cuisine_vide') probleme('renvoi : on ne doit pas pouvoir vider la cuisine en service');
  const autreW = servs.find((p) => p.id !== w.id);
  let nouvelles = 0, sauvegardeOk = true, minutesServeur = null, minutesCuisinier = null;
  const t0 = S.minute;
  for (let i = 0; i < 400 && (S.equipe.some((p) => p.partant)); i++) {
    B.avancer(S, 0.25);
    S.groupes.forEach((g) => { if (g.cuisinier === k.id && commandesAvant.indexOf(g.id) < 0) nouvelles++; });
    if (minutesServeur == null && !S.equipe.some((p) => p.id === w.id)) minutesServeur = S.minute - t0;
    if (minutesCuisinier == null && !S.equipe.some((p) => p.id === k.id)) minutesCuisinier = S.minute - t0;
    if (i === 3) { const r = B.relire(B.serialiser(S)); if (!r.partie) sauvegardeOk = false; else S = r.partie; }
    B.verifier(S).forEach((pb) => probleme('renvoi : ' + pb));
  }
  if (nouvelles) probleme('renvoi : le cuisinier renvoyé a reçu de nouvelles commandes');
  if (!sauvegardeOk) probleme('renvoi : sauvegarde illisible pendant un départ');
  if (S.equipe.some((p) => p.partant)) probleme('renvoi : une personne renvoyée ne part jamais');
  if (B.equipe.peutRenvoyer(S, S.equipe.find((p) => p.poste === 'serv')) !== null) probleme('renvoi : on devrait pouvoir renvoyer un serveur quand le patron est en salle');
  void autreW;
  let pas = 0;
  while (!S.finJour && pas++ < 4000) B.avancer(S, 0.5);
  if (!S.finJour) probleme('renvoi : la journée ne se termine pas après les renvois');
  if (S.stats.jour.servis + S.stats.jour.repartis !== S.stats.jour.arrives) probleme('renvoi : des clients perdus après les renvois');
  const msgs = S.journal.filter((m) => /renvoyé|quitte le restaurant/.test(m.texte)).map((m) => m.texte);
  console.log(`\nRenvoi : serveur (${tacheAvant}) parti ${minutesServeur?.toFixed(1)} min après, cuisinier parti ${minutesCuisinier?.toFixed(1)} min après (${commandesAvant.length} commande(s) finie(s)), cuisine vide refusée, patron protégé.`);
  msgs.forEach((m) => console.log('  journal : ' + m));
}

// Effectif de 16 (Chez YaYa) : un poste complet n'embauche plus ; intérim sur place vide, pour la journée.
{
  const S = B.creerPartie({ nom: 'Test', lieu: 'paris', graine: 91 });
  recruter(S, ['chef', 'commis']);
  const chef2 = S.candidats.find((c) => c.poste === 'chef');
  B.equipe.repondre(S, chef2, 'salaire');
  if (B.equipe.proposer(S, chef2, chef2.demande + 5).r !== 'complet') probleme('effectif : un 2e chef ne devrait pas pouvoir être embauché');
  if (B.equipe.interimPossible(S, 'salle') !== 'interim_jour1') probleme('intérim : pas possible avant la première ouverture');
  B.ouvrir(S);
  if (B.equipe.interimPossible(S, 'cuisine') !== null) probleme('intérim : il reste la place du second, il devrait être possible');
  const vC = B.equipe.placesVides(S, 'cuisine');
  let nC = 0; while (B.equipe.appelerInterim(S, 'cuisine')) nC++;
  if (vC !== 2 || nC !== 2 || B.equipe.interimPossible(S, 'cuisine') !== 'interim_complet_cuisine') probleme(`intérim : places du second et de l’apprenti vides → 2 intérimaires en cuisine (trouvé ${nC})`);
  const vS = B.equipe.placesVides(S, 'salle');
  let n = 0; while (B.equipe.appelerInterim(S, 'salle')) n++;
  if (n !== vS) probleme(`intérim : ${n} intérimaires en salle au lieu de ${vS}`);
  const ef = B.equipe.effectif(S);
  let pas = 0; while (!S.finJour && pas++ < 4000) B.avancer(S, 0.5);
  B.verifier(S).forEach((pb) => probleme('intérim : ' + pb));
  B.jourSuivant(S);
  if (S.equipe.some((p) => p.interim)) probleme('intérim : les intérimaires devraient repartir le lendemain');
  console.log(`\nEffectif : ${ef.n}/${ef.total} titulaires (2e chef refusé : poste complet), intérim : ${nC} en cuisine + ${n} en salle pour la journée, repartis le lendemain.`);
  // Intérim automatique : seulement si l'option est active et qu'il manque quelqu'un pour ouvrir.
  const T = B.creerPartie({ nom: 'Test', lieu: 'paris', graine: 92 });
  recruter(T, ['commis']); B.ouvrir(T);
  T.finJour = true; const commis = T.equipe.find((p) => p.poste === 'commis');
  T.interimAuto = false;
  B.equipe.renvoyer(T, commis);
  B.jourSuivant(T);
  if (T.ouvert || T.equipe.some((p) => p.interim)) probleme('intérim auto coupé : personne ne doit être appelé');
  T.interimAuto = true; T.finJour = true; B.jourSuivant(T);
  if (!T.ouvert || !T.equipe.some((p) => p.interim && p.service === 'cuisine')) probleme('intérim auto : un commis intérimaire aurait dû être appelé');
  console.log(`Intérim automatique : coupé → restaurant fermé ; activé → ${T.equipe.find((p) => p.interim).nom} appelé en cuisine, restaurant ouvert.`);
}

// Sauvegarde Bistrot 0.2 (format 2) : relue, option d'intérim ajoutée, « Intérimaire » de l'ancien jeu retiré.
{
  const S = B.creerPartie({ nom: 'Test', lieu: 'paris', graine: 93 });
  recruter(S, ['serv', 'commis']); B.ouvrir(S); B.avancer(S, 60);
  B.equipe.nouveauMembre(S, { nom: 'Intérimaire', poste: 'plong', service: 'autre', note: 5, vitesse: 5 });
  const o = JSON.parse(B.serialiser(S)); o.version = 2; delete o.dejaOuvert; delete o.interimAuto;
  const r = B.relire(JSON.stringify(o));
  if (!r.partie) probleme('sauvegarde 0.2 illisible : ' + r.erreur);
  else {
    const T = r.partie;
    if (T.version !== B.VERSION_SAUVEGARDE || !T.dejaOuvert || T.interimAuto !== true || T.equipe.some((p) => p.nom === 'Intérimaire')) probleme('sauvegarde 0.2 mal convertie');
    B.verifier(T).forEach((pb) => probleme('sauvegarde 0.2 : ' + pb));
    let pas = 0; while (!T.finJour && pas++ < 4000) B.avancer(T, 0.5);
    if (!T.finJour) probleme('sauvegarde 0.2 : la journée ne se termine pas');
    console.log(`\nSauvegarde Bistrot 0.2 relue : format ${T.version}, équipe de ${T.equipe.length} (patron compris), service repris là où il était, journée terminée.`);
  }
}

// Carte et paiement : données de tous les lieux, limites, prix, cuissons.
{
  const ALG = new Set(B.DATA.catalogue.allergenes.map((a) => a.id)), CU = B.DATA.carte.cuissons.options;
  let nPlats = 0;
  for (const l of B.DATA.lieux.lieux) {
    const S = B.creerPartie({ nom: 'Test', lieu: l.id, graine: 3 });
    const cat = B.carte.catalogue(S);
    nPlats += cat.length;
    for (const c of B.carte.CATS) {
      const n = B.carte.surCarte(S, c).length, L = B.DATA.carte.limites;
      if (n < L.min[c] || n > L.max[c]) probleme(`carte ${l.id} : ${n} ${c} au départ`);
    }
    for (const d of cat) {
      d.allergenes.forEach((a) => { if (!ALG.has(a)) probleme(`${l.id} ${d.nom} : allergène inconnu ${a}`); });
      if (d.cuisson && !CU[d.cuisson]) probleme(`${l.id} ${d.nom} : cuisson inconnue`);
      const pc = B.carte.prixConseille(S, d), co = B.carte.cout(S, d);
      if (!(pc > 0) || !(co > 0) || co >= pc) probleme(`${l.id} ${d.nom} : prix conseillé ${pc} / coût ${co}`);
    }
  }
  console.log(`\nCarte : ${B.DATA.lieux.lieux.length} lieux, ${nPlats} plats proposés au total (spécialités + classiques), données complètes.`);
  const S = B.creerPartie({ nom: 'Test', lieu: 'paris', graine: 4 });
  const ent = B.carte.surCarte(S, 'entree');
  const S2 = B.creerPartie({ nom: 'Test', lieu: 'new-york', graine: 4 });
  const horsCarte = () => B.carte.catalogue(S2).filter((d) => d.cat === 'entree' && !S2.carte.plats[d.id].on);
  while (B.carte.surCarte(S2, 'entree').length < 6 && horsCarte().length) B.carte.basculer(S2, horsCarte()[0].id);
  if (!horsCarte().length || B.carte.basculer(S2, horsCarte()[0].id) !== 'carte_max_entree') probleme('carte : la limite de 6 entrées ne bloque pas');
  while (B.carte.surCarte(S, 'dessert').length > 2) B.carte.basculer(S, B.carte.surCarte(S, 'dessert')[0]);
  if (B.carte.basculer(S, B.carte.surCarte(S, 'dessert')[0]) !== 'carte_min_dessert') probleme('carte : le minimum de 2 desserts ne bloque pas');
}
// Prix : trop bas, conseillés, trop hauts (Paris, 10 jours, patron + serveur + commis).
{
  console.log('\nEffet des prix à Paris (10 jours, moyenne par jour) :');
  for (const f of [0.7, 1, 1.3, 1.6]) {
    const S = B.creerPartie({ nom: 'Test', lieu: 'paris', graine: 555 });
    recruter(S, ['serv', 'commis']);
    for (const id in S.carte.plats) S.carte.plats[id].prix = Math.round(B.carte.prixConseille(S, B.carte.plat(S, id)) * f * 2) / 2;
    const c = jouer(S, 'prix ×' + f, 10, false);
    console.log(`  prix × ${String(f).padEnd(4)} : ${String(Math.round(c.servis / 10)).padStart(3)} clients servis, recettes ${B.euros(c.recettes / 10).padStart(8)}, coût des produits ${B.euros(c.coutMatiere / 10).padStart(7)}, marge brute ${B.euros((c.recettes - c.coutMatiere) / 10).padStart(8)}, pourboires ${B.prix(c.pourboires / 10)}`);
  }
}
// Cuissons : un cuisinier peu soigneux rate plus de cuissons, et chaque plat raté est refait.
{
  const res = [];
  for (const q of [2, 9]) {
    const S = B.creerPartie({ nom: 'Test', lieu: 'new-york', graine: 777 });
    recruter(S, ['serv', 'commis']);
    S.equipe.find((p) => p.poste === 'commis').qualite = q;
    const renvois = jouer(S, 'cuisson q' + q, 10, false).renvois;
    res.push([q, renvois]);
  }
  console.log(`\nCuissons ratées puis refaites (New York, 10 jours, commis seul en cuisine) : qualité 2 → ${res[0][1]} plats renvoyés, qualité 9 → ${res[1][1]} plats renvoyés.`);
  if (!(res[0][1] > res[1][1])) probleme('cuissons : un cuisinier soigneux devrait rater moins de cuissons');
}

// Entretiens : réponses variées, accords corrects.
{
  const S = B.creerPartie({ nom: 'Test', lieu: 'paris', graine: 4242 });
  for (let i = 0; i < 40; i++) S.candidats.push(B.equipe.candidat(S, ['serv', 'csalle', 'commis', 'chef'][i % 4]));
  const rep = [];
  S.candidats.forEach((c) => B.equipe.questions(c).forEach((q) => rep.push(B.equipe.repondre(S, c, q))));
  const uniques = new Set(rep).size;
  if (rep.some((r) => /\{|·/.test(r))) probleme('réponse d’entretien mal accordée : ' + rep.find((r) => /\{|·/.test(r)));
  console.log(`Entretiens : ${rep.length} réponses générées, ${uniques} différentes (${Math.round(100 * uniques / rep.length)} %).`);
  const ex = S.candidats.slice(0, 3).map((c) => `  ${c.nom} (${B.equipe.nomPoste(c)}, ${B.equipe.adj(c)}) : ${c.reponses[1].texte}`);
  console.log(ex.join('\n'));
  const mins = Object.keys(B.DATA.equipe.postes).filter((p) => B.DATA.equipe.postes[p].recrutable).map((p) => `${B.DATA.equipe.postes[p].nom} ${B.equipe.euroHeure(B.equipe.minimum(S, p, 0))}`);
  console.log('Minimum de la grille à Paris (débutant, ×1,15) : ' + mins.join(' · '));
}

// Ancienne sauvegarde Bistrot 0.1 (format 1) : relue et convertie.
{
  const txt = fs.readFileSync(path.join(RACINE, 'tests/sauvegardes-bistrot/v1-bistrot-0.1-en-service.json'), 'utf8');
  const r = B.relire(txt);
  if (!r.partie) probleme('sauvegarde Bistrot 0.1 illisible : ' + r.erreur);
  else {
    const S = r.partie;
    B.verifier(S).forEach((p) => probleme('Bistrot 0.1 : ' + p));
    console.log(`\nSauvegarde Bistrot 0.1 relue : ${S.nom}, ${B.lieu(S.lieu).nom}, jour ${S.jour}, équipe : ${S.equipe.map((p) => p.nom).join(', ')}, ${S.candidats.length} candidats, format ${S.version}.`);
  }
}

// Lecture des anciennes parties de « Chez YaYa » : conversion sans toucher l'original.
console.log('\nReprise des anciennes parties (Chez YaYa) :');
const dossier = path.join(RACINE, 'tests', 'anciennes-sauvegardes');
for (const f of fs.readdirSync(dossier).filter((x) => x.endsWith('.json')).sort()) {
  const txt = fs.readFileSync(path.join(dossier, f), 'utf8');
  const o = B.ancien.lire(txt);
  if (!o) { probleme(f + ' illisible'); continue; }
  const S = B.ancien.convertir(o, { cle: 'bistrot_slot1', graine: 7 });
  const pb = B.verifier(S);
  const sal = B.equipe.salle(S).length, cui = B.equipe.cuisine(S).length, aut = S.equipe.filter((p) => ['bar', 'plonge', 'nettoyage'].includes(p.service)).length;
  if (S.equipe.some((p) => p.service === 'autre')) pb.push('employé sans rôle après reprise');
  if (!S.ouvert) B.ouvrir(S);
  if (!S.ouvert) recruter(S, ['serv', 'commis']), B.ouvrir(S);
  if (fs.readFileSync(path.join(dossier, f), 'utf8') !== txt) probleme(f + ' modifié !');
  B.avancer(S, 120);
  pb.push(...B.verifier(S));
  pb.forEach((p) => probleme(f + ' : ' + p));
  const r = B.relire(B.serialiser(S));
  if (!r.partie) probleme(f + ' : la partie convertie ne se relit pas');
  const ca = S.origine.carte || {}, so = S.origine.stocks || {};
  if (f === 'save_v10_service_generated.json' && !so.produits) probleme(f + ' : les stocks de l’ancienne partie ne sont pas repris');
  console.log(`  ✓ ${f} → ${S.nom}, ${B.lieu(S.lieu).nom}, jour ${S.jour}, ${B.euros(S.argent)}, note ${S.note}, ${S.equipeReprise} employés repris (salle ${sal} et cuisine ${cui}, patron compris ; ${aut} au bar, à la plonge ou au nettoyage), carte : ${ca.lus || 0} plats relus, ${ca.ignores || 0} plats de l’ancien jeu pas encore dans Bistrot${ca.ajustes ? ', carte ajustée aux limites 6/9/6' : ''}, stocks : ${so.produits ? `${so.produits} produits (${so.portions} portions${so.perimes ? `, ${so.perimes} périmées jetées` : ''}), ${so.commandes} commande(s) en route livrée(s)` : 'pas de stock lisible, premières courses faites'}`);
}

// ===== Étape 4 : équipe (postes, plannings, formations, cagnotte, effets des qualités) =====
console.log('\nÉtape 4 — Équipe :');
const embaucherTout = (S) => {
  let n = 0;
  for (const c of S.candidats.slice()) {
    if (!B.equipe.placeLibre(S, c.poste)) continue;
    B.equipe.repondre(S, c, 'salaire');
    if (B.equipe.proposer(S, c, c.demande).r === 'accepte') n++;
  }
  return n;
};
// 1) Les 16 postes sont tous ouverts à l'embauche, et l'équipe complète se remplit en quelques jours.
{
  const rec = Object.keys(B.DATA.equipe.postes).filter((k) => B.DATA.equipe.postes[k].recrutable);
  const places = B.DATA.equipe.effectif.places.filter((pl) => !B.equipe.placeRecrutable(pl));
  if (places.length) probleme('places pas encore ouvertes à l’embauche : ' + places.map((p) => p.nom).join(', '));
  const S = B.creerPartie({ nom: 'Test', lieu: 'paris', graine: 4004 });
  embaucherTout(S);
  const c = jouer(S, 'équipe complète', 20, false, (T) => embaucherTout(T));
  const T = c.S, ef = B.equipe.effectif(T);
  const n = c.jours || 1, sal = ((c.dep.salaires || 0) + (c.dep.interim || 0)) / n, res = c.resultat / n;
  console.log(`  ${rec.length} sortes de postes ouvertes (${rec.map((k) => B.DATA.equipe.postes[k].nom).join(', ')}).`);
  console.log(`  Paris, on embauche chaque candidat qui a une place : ${ef.n}/${ef.total} au bout de 20 jours (salle ${ef.groupes.salle}, cuisine ${ef.groupes.cuisine}, nettoyage ${ef.groupes.nettoyage}).`);
  console.log(`  moyenne par jour : ${Math.round(c.servis / n)} servis, attente ${Math.round(c.attente / n)} min, recettes ${B.euros(c.recettes / n)}, salaires ${B.euros(sal)}, résultat ${B.euros(res)}, propreté finale ${T.proprete}/100, ${(c.absences / n).toFixed(1)} absents par jour.`);
  if (ef.n < 12) probleme('équipe complète : trop peu d’embauches en 20 jours (' + ef.n + ')');
  if (res <= 0) probleme('équipe complète en Facile à Paris : le restaurant perd de l’argent');
  // 2) Plannings : 2 jours de repos qui se suivent, chaque semaine.
  const suivi = {};
  const S2 = B.relire(B.serialiser(T)).partie;
  for (let j = 0; j < 14; j++) {
    for (const p of S2.equipe) if (B.equipe.aDesRepos(p)) { suivi[p.id] = suivi[p.id] || []; suivi[p.id].push(p.absent === 'repos' ? 1 : 0); }
    if (S2.equipe.some((p) => p.patron && p.absent)) probleme('le patron ne doit jamais être en repos');
    S2.finJour = true; B.jourSuivant(S2);
  }
  let bons = 0, total = 0;
  for (const id in suivi) {
    const a = suivi[id]; if (a.length < 14) continue; total++;
    const sem = [a.slice(0, 7), a.slice(7, 14)].every((w) => w.reduce((x, y) => x + y, 0) === 2);
    const ronde = a.concat(a.slice(0, 1)).join('');
    if (sem && /11/.test(ronde)) bons++; else probleme('planning : ' + id + ' → ' + a.join(''));
  }
  const cv = [1, 2, 3, 4, 5, 6, 0].map((j) => B.planning.couverture(S2, j));
  console.log(`  plannings : ${bons}/${total} employés ont bien 2 jours de repos qui se suivent chaque semaine ; salle par jour (lun→dim) ${cv.map((x) => x.salle).join('-')}, cuisine ${cv.map((x) => x.cuisine).join('-')}.`);
}
// 3) Formations : payée tout de suite, absent le prochain jour travaillé, +1 le lendemain. Sommellerie : plus de vin.
{
  const S = B.creerPartie({ nom: 'Test', lieu: 'paris', graine: 4005 });
  recruter(S, ['serv', 'commis']);
  const sv = S.equipe.find((p) => p.poste === 'serv'), v0 = sv.vitesse, a0 = S.argent;
  const o = B.planning.formationsPour(S, sv).find((f) => f.id === 'vitesse');
  const r = B.planning.inscrire(S, sv, 'vitesse');
  if (!r.ok || Math.abs(a0 - S.argent - o.prix) > 0.001) probleme('formation : pas payée au bon prix');
  if (B.planning.inscrire(S, sv, 'sommelier').erreur !== 'form_non_inscrit') probleme('formation : 2 formations en même temps');
  let jourForm = null, jours = 0;
  B.ouvrir(S);
  while (jours++ < 10 && sv.vitesse === v0) {
    let k = 0; while (!S.finJour && k++ < 4000) B.avancer(S, 0.5);
    B.jourSuivant(S); if (!S.ouvert) B.ouvrir(S);
    if (sv.absent === 'formation') jourForm = S.jour;
  }
  if (!jourForm || sv.vitesse !== v0 + 1) probleme('formation : pas d’absence ou pas de point gagné');
  else console.log(`  formation « Rapidité » (${B.euros(o.prix)}) : inscrite le jour 1, en formation le jour ${jourForm}, vitesse ${v0} → ${sv.vitesse} le jour ${S.jour}.`);
  const B2 = B.planning.inscrire(S, sv, 'sommelier'); const prixS = B.DATA.equipe.formations.liste.find((f) => f.id === 'sommelier').prix;
  if (!B2.ok) probleme('formation sommelier refusée : ' + B2.erreur);
  if (!B.planning.annuler(S, sv) || sv.formation) probleme('formation : annulation impossible');
  // vin vendu avec et sans sommelier (mêmes clients)
  const vin = (som) => {
    const T = B.creerPartie({ nom: 'Test', lieu: 'paris', graine: 4006 });
    recruter(T, ['serv', 'commis']); if (som) T.equipe.forEach((p) => { if (p.service === 'salle') p.sommelier = true; });
    const c = jouer(T, som ? 'sommelier' : 'sans sommelier', 8, false);
    let n = 0; (c.S.tickets || []).forEach(() => {}); return c.boissons;
  };
  const sansS = vin(false), avecS = vin(true);
  console.log(`  sommellerie (${B.euros(prixS)}) : boissons vendues en 8 jours ${sansS} sans sommelier → ${avecS} avec.`);
  if (!(avecS > sansS)) probleme('sommelier : il devrait faire vendre plus de vin');
}
// 4) Cagnotte : partagée le dernier soir du mois entre les employés, ni patron ni intérimaire ; jamais dans la caisse.
{
  const S = B.creerPartie({ nom: 'Test', lieu: 'paris', graine: 4007, debut: '2026-11-27' });
  recruter(S, ['serv', 'commis', 'plong']);
  const c = jouer(S, 'cagnotte', 5, false);
  const T = c.S, r = (T.partages || [])[0];
  if (!r) probleme('cagnotte : pas de partage en fin de mois');
  else {
    const gens = T.equipe.filter((p) => B.equipe.aDesRepos(p));
    const somme = gens.reduce((s, p) => s + (p.pourboires || 0), 0);
    if (Math.abs(somme + r.reste - r.total) > 0.011) probleme('cagnotte : les parts ne font pas le total');
    if (T.equipe.some((p) => (p.patron || p.interim) && p.pourboires)) probleme('cagnotte : le patron ou un intérimaire a reçu une part');
    console.log(`  cagnotte : partagée le 30 novembre au soir, ${B.prix(r.total)} → ${r.n} × ${B.prix(r.part)} (reste ${B.prix(r.reste)}), patron et intérimaires exclus, argent du restaurant inchangé.`);
  }
}
// 5) Effet des postes et des qualités (mêmes clients à chaque fois : seule l'équipe change).
{
  const essai = (etiq, postes, regler, jours = 8, lieu = 'paris') => {
    const S = B.creerPartie({ nom: 'Test', lieu, graine: 4010 });
    recruter(S, postes); if (regler) regler(S);
    S.equipe.forEach((p) => { if (B.equipe.aDesRepos(p)) p.repos = [5, 6]; });   /* repos vendredi-samedi pour tous : comparaison juste */
    return jouer(S, etiq, jours, false);
  };
  const ligne = (c) => `${Math.round(c.servis / c.jours)} servis/j, attente ${Math.round(c.attente / c.jours)} min, ${(c.renvois / c.jours).toFixed(1)} renvois/j, pourboires ${B.prix(c.pourboires / c.jours)}/j`;
  const base = essai('base', ['serv', 'commis']);
  const plonge = essai('plonge', ['serv', 'commis', 'plong']);
  const bar = essai('bar', ['serv', 'commis', 'barman']);
  const chef = essai('chef', ['serv', 'commis', 'chef']);
  const resp = essai('resp', ['serv', 'commis', 'resp']);
  const doux = essai('aimable', ['serv', 'commis'], (S) => S.equipe.forEach((p) => { if (p.service === 'salle') p.amabilite = 9; }));
  const dur = essai('pas aimable', ['serv', 'commis'], (S) => S.equipe.forEach((p) => { if (p.service === 'salle') p.amabilite = 2; }));
  const sale = essai('sans nettoyage', ['serv', 'commis'], null, 20);
  const propre = essai('avec nettoyage', ['serv', 'commis', 'nett'], null, 20);
  console.log('  Effets (Paris, 8 jours, même graine de hasard ; chiffres indicatifs) :');
  console.log(`    patron + serveur + commis      : ${ligne(base)}`);
  console.log(`    + plongeur                     : ${ligne(plonge)}`);
  console.log(`    + barman                       : ${ligne(bar)}`);
  console.log(`    + chef (+1 qualité aux autres) : ${ligne(chef)}`);
  console.log(`    + responsable de salle         : ${ligne(resp)}`);
  console.log(`    serveur aimable 9 / 2          : pourboires ${B.prix(doux.pourboires / doux.jours)}/j contre ${B.prix(dur.pourboires / dur.jours)}/j`);
  console.log(`    propreté après 20 jours        : ${sale.S.proprete}/100 sans agent de nettoyage (${sale.partisSale} clients partis), ${propre.S.proprete}/100 avec un agent`);
  if (!(doux.pourboires > dur.pourboires)) probleme('amabilité : un serveur aimable devrait rapporter plus de pourboires');
  if (!(propre.S.proprete > sale.S.proprete)) probleme('nettoyage : un agent devrait garder la salle plus propre');
  {
    const S = B.creerPartie({ nom: 'Test', lieu: 'paris', graine: 4012 });
    recruter(S, ['commis']);
    const cm = S.equipe.find((p) => p.poste === 'commis'); cm.qualite = 5;
    const q0 = B.equipe.qualiteCuisson(S, cm);
    recruter(S, ['second']); const q1 = B.equipe.qualiteCuisson(S, cm);
    recruter(S, ['chef']); const q2 = B.equipe.qualiteCuisson(S, cm);
    const f0 = B.equipe.facteurPlonge(S); recruter(S, ['plong']); const f1 = B.equipe.facteurPlonge(S);
    const t0 = B.equipe.tempsBoisson(S); recruter(S, ['barman']); const t1 = B.equipe.tempsBoisson(S);
    console.log(`    règles vérifiées : qualité en cuisine d’un commis à 5 → ${q0} seul, ${q1} avec le second, ${q2} avec le chef ; cuisine ×${f0.toFixed(2)} sans plongeur → ×${f1.toFixed(2)} avec ; préparation d’une boisson ${(t0 * 60).toFixed(0)} s → ${(t1 * 60).toFixed(1)} s avec un barman.`);
    if (!(q1 === q0 + 1 && q2 === q0 + 1 && f1 < f0 && t1 < t0)) probleme('effets des postes (chef, second, plongeur, barman) incorrects');
  }
}
// 6) Renvoi : toujours possible (bar, plonge, nettoyage compris) ; une formation pas encore commencée est remboursée.
{
  const S = B.creerPartie({ nom: 'Test', lieu: 'paris', graine: 4011 });
  recruter(S, ['serv', 'commis', 'barman', 'plong', 'nett']);
  B.ouvrir(S); B.avancer(S, 90);
  const bm = S.equipe.find((p) => p.poste === 'barman'), pl = S.equipe.find((p) => p.poste === 'plong');
  const a0 = S.argent; B.planning.inscrire(S, bm, 'vitesse'); const prix = a0 - S.argent, journee = B.r2(B.argent.salaireJour(bm));
  if (!B.equipe.renvoyer(S, bm) || S.equipe.includes(bm) || Math.abs(S.argent - (a0 - journee)) > 0.001) probleme('renvoi du barman : pas parti ou formation pas remboursée');
  if (!B.equipe.renvoyer(S, pl) || S.equipe.includes(pl)) probleme('renvoi du plongeur impossible');
  B.verifier(S).forEach((x) => probleme('renvoi étape 4 : ' + x));
  console.log(`  renvoi : barman (formation de ${B.euros(prix)} remboursée, sa journée de ${B.euros(journee)} payée, pas d’indemnité en période d’essai) et plongeur partis tout de suite, en plein service.`);
}
// 7) Sauvegarde Bistrot 0.5.1 (format 5) : rôles, jours de repos, cagnotte gardée, service repris.
{
  const f = 'tests/sauvegardes-bistrot/v5-bistrot-0.5.1-equipe-ancien-jeu-en-service.json';
  const txt = fs.readFileSync(path.join(RACINE, f), 'utf8'), o = JSON.parse(txt);
  const r = B.relire(txt);
  if (!r.partie) probleme('sauvegarde 0.5.1 illisible : ' + r.erreur);
  else {
    const T = r.partie;
    if (T.version !== B.VERSION_SAUVEGARDE || T.equipe.some((p) => p.service === 'autre') || T.cagnotte !== o.cagnotte || T.groupes.length !== o.groupes.length) probleme('sauvegarde 0.5.1 mal convertie');
    if (T.equipe.some((p) => B.equipe.aDesRepos(p) && (!p.repos || p.absent))) probleme('sauvegarde 0.5.1 : repos manquants ou absent dès la reprise');
    B.verifier(T).forEach((x) => probleme('sauvegarde 0.5.1 : ' + x));
    let k = 0; while (!T.finJour && k++ < 4000) B.avancer(T, 0.5);
    if (!T.finJour) probleme('sauvegarde 0.5.1 : la journée reprise ne se termine pas');
    B.jourSuivant(T);
    const c = jouer(T, 'reprise 0.5.1', 3, false);
    if (fs.readFileSync(path.join(RACINE, f), 'utf8') !== txt) probleme('sauvegarde 0.5.1 modifiée !');
    const sv = {}; T.equipe.forEach((p) => { sv[p.service] = (sv[p.service] || 0) + 1; });
    console.log(`  sauvegarde 0.5.1 relue (format ${T.version}) : ${T.equipe.length} personnes (${Object.entries(sv).map(([k, v]) => v + ' ' + k).join(', ')}), cagnotte ${B.prix(o.cagnotte)} gardée, ${o.groupes.length} groupes repris en plein service, 3 jours joués ensuite (${c.servis} servis).`);
  }
}

// ===== Étape 5 : argent (niveaux, salaires payés, loyer, charges, indemnités, faillite, bilans) =====
console.log('\nÉtape 5 — Argent :');
{
  const N = B.DATA.argent.niveaux;
  if (!N.facile || !N.normal || !N.difficile) probleme('il faut les 3 niveaux');
  if (B.creerPartie({ nom: 'T', lieu: 'paris' }).difficulte !== 'facile') probleme('Facile doit rester le niveau par défaut');
  // 1) Un joueur moyen dans chaque niveau : patron + serveur + commis, prix conseillés, commande et intérim automatiques activés.
  const moyen = (lieu, niveau, nj, regler) => {
    const S = B.creerPartie({ nom: 'Test', lieu, difficulte: niveau, graine: 12345 + lieu.length * 7919 + lieu.charCodeAt(0) });
    S.interimAuto = true; S.stocks.auto = true;
    recruter(S, ['serv', 'commis']);
    if (regler) regler(S);
    return jouer(S, lieu + ' ' + niveau, nj, false);
  };
  const tableau = {};
  for (const [lieu, c] of resumeLieux) if (NIVEAUX7.includes(lieu) || resumeLieux.length <= 12) tableau[lieu] = { facile: c };
  for (const niveau of ['normal', 'difficile']) for (const lieu in tableau) tableau[lieu][niveau] = moyen(lieu, niveau, jours);
  console.log(`  Gains d'un joueur moyen par jour (${jours} jours, bénéfice réel du bilan du soir, après tout ce qui est payé) :`);
  console.log('  lieu           Facile     Normal  Difficile   caisse finale Facile / Normal / Difficile');
  let ok = true;
  for (const lieu in tableau) {
    const t = tableau[lieu], r = (c) => c.resultat / Math.max(1, c.jours);
    console.log(`  ${lieu.padEnd(12)} ${B.euros(r(t.facile)).padStart(9)} ${B.euros(r(t.normal)).padStart(10)} ${B.euros(r(t.difficile)).padStart(10)}   ${B.euros(t.facile.S.argent)} / ${B.euros(t.normal.S.argent)} / ${B.euros(t.difficile.S.argent)}`);
    if (r(t.facile) <= 0) { ok = false; probleme(lieu + ' : un joueur moyen perd de l’argent en Facile'); }
    if (r(t.normal) <= 0) { ok = false; probleme(lieu + ' : un joueur moyen devrait rester (un peu) bénéficiaire en Normal'); }
    if (!(r(t.normal) < r(t.facile) * 0.85)) { ok = false; probleme(lieu + ' : Normal devrait être nettement plus serré que Facile'); }
    if (!(r(t.difficile) < r(t.normal) * 0.9)) { ok = false; probleme(lieu + ' : Difficile devrait être plus serré que Normal'); }
    if (t.normal.faillite || t.difficile.faillite || t.facile.faillite) { ok = false; probleme(lieu + ' : faillite d’un joueur moyen'); }
  }
  {
    const t = tableau.paris || Object.values(tableau)[0], d = t.normal.dep, n = t.normal.jours;
    console.log(`  détail Normal (${Object.keys(tableau)[0]}) par jour : ` + B.argent.POSTES.filter((k) => d[k]).map((k) => `${B.t('ag_poste_' + k).toLowerCase()} ${B.euros(d[k] / n)}`).join(', '));
    const tv = d.tva / Math.max(1, t.normal.recettes);
    if (Math.abs(tv - 0.1 / 1.1) > 0.002) probleme('TVA : pas 10 % des recettes hors taxe');
    if (tableau.paris && tableau.paris.facile.dep.loyer) probleme('Facile : pas de loyer (propriétaire)');
    if (tableau.paris && tableau.paris.facile.dep.cotisations) probleme('Facile : pas de cotisations');
  }
  if (ok) console.log('  ✓ Facile rentable partout ; Normal plus serré mais bénéficiaire partout ; Difficile encore plus serré.');

  // 2) En Difficile, il faut bien jouer : les erreurs coûtent cher.
  console.log(`  Difficile, erreurs d'un joueur (moyenne par jour sur ${jours} jours) :`);
  const erreurs = [
    ['prix 50 % trop hauts', (S) => { for (const id in S.carte.plats) S.carte.plats[id].prix = Math.round(S.carte.plats[id].prix * 1.5); }],
    ['oublie de commander', (S) => { S.stocks.auto = false; }],
    ['embauche tout le monde', null]
  ];
  for (const lieu of ['paris', 'mayotte'].filter((l) => tableau[l])) {
    const base = tableau[lieu].difficile.resultat / tableau[lieu].difficile.jours;
    const res = [];
    for (const [nom, regler] of erreurs) {
      let c;
      if (regler) c = moyen(lieu, 'difficile', jours, regler);
      else {
        const S = B.creerPartie({ nom: 'Test', lieu, difficulte: 'difficile', graine: 4321 });
        S.interimAuto = true; S.stocks.auto = true;
        recruter(S, ['serv', 'commis']);
        c = jouer(S, lieu + ' équipe complète', jours, false, (T) => { for (const k of T.candidats.slice()) if (B.equipe.placeLibre(T, k.poste)) { B.equipe.repondre(T, k, 'salaire'); B.equipe.proposer(T, k, k.demande); } });
      }
      const r = c.resultat / Math.max(1, c.jours);
      res.push(`${nom} ${B.euros(r)}${c.faillite ? ` (faillite le jour ${c.faillite})` : ''}`);
      if (!(r < base)) probleme(`Difficile ${lieu} : « ${nom} » devrait coûter de l’argent`);
      if (nom !== 'prix 50 % trop hauts' && r >= 0) probleme(`Difficile ${lieu} : « ${nom} » devrait faire perdre de l’argent`);
    }
    console.log(`    ${lieu.padEnd(10)} bien joué ${B.euros(base)} · ` + res.join(' · '));
  }

  // 3) Salaires vraiment payés chaque soir ; intérim payé le soir de sa journée ; prêt qui diminue.
  {
    const S = B.creerPartie({ nom: 'T', lieu: 'paris', difficulte: 'difficile', graine: 51 });
    recruter(S, ['serv', 'commis']);
    B.ouvrir(S); B.equipe.appelerInterim(S, 'salle');
    const sv = S.equipe.find((p) => p.poste === 'serv'), it = S.equipe.find((p) => p.interim);
    const attendu = B.r2(sv.salaire * B.DATA.equipe.heuresParMois39h / B.DATA.argent.joursParMois + S.equipe.find((p) => p.poste === 'commis').salaire * B.DATA.equipe.heuresParMois39h / B.DATA.argent.joursParMois);
    let pas = 0; while (!S.finJour && pas++ < 4000) B.avancer(S, 0.5);
    const b = S.bilan;
    if (Math.abs(b.depenses.salaires - attendu) > 0.05) probleme(`salaires du soir : ${b.depenses.salaires} au lieu de ${attendu}`);
    if (Math.abs(b.depenses.interim - B.r2(it.salaire * B.DATA.argent.heuresInterimParJour)) > 0.05) probleme('intérim : journée pas payée');
    if (!(S.pret.restant < S.pret.montant) || Math.abs(b.depenses.pret - S.pret.mensualite / B.DATA.argent.joursParMois) > 0.05) probleme('prêt : pas remboursé au jour le jour');
    if (Math.abs(b.depenses.loyer - B.argent.loyerMois(S) / B.DATA.argent.joursParMois) > 0.05) probleme('loyer du jour faux');
    console.log(`  Soir du jour 1 (Paris, Difficile) : salaires ${B.euros(b.depenses.salaires)}, intérimaire ${B.euros(b.depenses.interim)}, cotisations ${B.euros(b.depenses.cotisations)}, loyer ${B.euros(b.depenses.loyer)} (${B.euros(B.argent.loyerMois(S))}/mois), charges ${B.euros(b.depenses.charges)}, TVA ${B.euros(b.depenses.tva)}, prêt ${B.euros(b.depenses.pret)} (reste ${B.euros(S.pret.restant)} sur ${B.euros(S.pret.montant)}, ${B.euros(S.pret.mensualite)}/mois).`);
    // loyers mensuels de quelques lieux
    console.log('  Loyer par mois (Normal et Difficile) : ' + ['paris', 'idf', 'bretagne', 'reunion', 'mayotte', 'new-york', 'tokyo'].map((l) => { const T = B.nouvellePartie({ lieu: l, difficulte: 'normal' }); return `${B.lieu(l).nom} ${B.euros(B.argent.loyerMois(T))}`; }).join(' · '));
  }

  // 4) Indemnités de renvoi : rien en période d'essai, 3 jours de salaire ensuite, loi après 8 mois ; intérimaire : rien.
  {
    const S = B.creerPartie({ nom: 'T', lieu: 'bretagne', difficulte: 'normal', graine: 52 });
    recruter(S, ['serv', 'commis', 'plong']);
    const sv = S.equipe.find((p) => p.poste === 'serv'), pl = S.equipe.find((p) => p.poste === 'plong'), cm = S.equipe.find((p) => p.poste === 'commis');
    const i0 = B.argent.indemnite(S, sv);
    S.jour = 40; const i1 = B.argent.indemnite(S, sv);
    S.jour = 400; const i2 = B.argent.indemnite(S, cm);
    S.jour = 40;
    if (i0.montant !== 0 || i0.raison !== 'indem_essai') probleme('indemnité : il ne devrait rien y avoir en période d’essai');
    if (Math.abs(i1.montant - B.r2(3 * B.argent.salaireJour(sv))) > 0.01) probleme('indemnité : 3 jours de salaire attendus');
    if (!(i2.montant > 3 * B.argent.salaireJour(cm) + 100) || i2.raison !== 'indem_loi') probleme('indemnité : la part de la loi devrait s’ajouter après 8 mois');
    const a0 = S.argent, st0 = S.stats.jour.indemnites;
    B.equipe.renvoyer(S, pl);
    const paye = B.r2(a0 - S.argent);
    if (Math.abs(paye - B.r2(3 * B.argent.salaireJour(pl))) > 0.02 || Math.abs(S.stats.jour.indemnites - st0 - paye) > 0.02) probleme(`renvoi : indemnité mal payée (${paye})`);
    console.log(`  Indemnités : serveur en période d’essai ${B.euros(i0.montant)} ; après 40 jours ${B.euros(i1.montant)} (3 jours) ; commis après 400 jours ${B.euros(i2.montant)} (3 jours + loi) ; plongeur renvoyé au jour 40 : ${B.euros(paye)} payés tout de suite.`);
  }

  // 5) Faillite : 7 soirs de suite sous zéro, avec des alertes avant ; la partie reste lisible ; plus de jour suivant.
  {
    const S = B.creerPartie({ nom: 'T', lieu: 'mayotte', difficulte: 'difficile', graine: 53 });
    recruter(S, ['serv', 'commis']); S.interimAuto = true;
    S.argent = 500;
    const alertes = [];
    const c = jouer(S, 'faillite', 40, false, (T) => { if (T.bilan.alerte) alertes.push(T.bilan.alerte.soir); for (const k of T.candidats.slice()) if (B.equipe.placeLibre(T, k.poste)) { B.equipe.repondre(T, k, 'salaire'); B.equipe.proposer(T, k, k.demande); } });
    const T = c.S;
    if (!T.faillite) probleme('faillite : elle aurait dû arriver');
    else {
      if (T.faillite.soirs !== B.DATA.argent.faillite.soirsDeSuite || T.argent >= 0) probleme('faillite : pas après 7 soirs sous zéro');
      if (alertes.length < B.DATA.argent.faillite.soirsDeSuite - 1) probleme('faillite : pas assez d’alertes avant');
      if (B.jourSuivant(T) !== false || B.ouvrir(T)) probleme('faillite : on ne devrait plus pouvoir continuer');
      const r = B.relire(B.serialiser(T));
      if (!r.partie || !r.partie.faillite) probleme('faillite : la sauvegarde ne garde pas la faillite');
      if (!T.faillite.top.length) probleme('faillite : pas d’explication');
      console.log(`  Faillite (Mayotte, Difficile, 500 € au départ, embauche de tout le monde) : le jour ${T.faillite.jour}, après ${alertes.length + 1} soirs d’alerte ; caisse ${B.euros(T.argent)} ; plus grosses dépenses : ${T.faillite.top.map((x) => B.t('ag_poste_' + x.poste).toLowerCase() + ' ' + B.euros(x.montant)).join(', ')} ; sauvegarde relue avec la faillite.`);
    }
    // Une caisse qui remonte au-dessus de zéro remet le compteur à zéro.
    const U = B.creerPartie({ nom: 'T', lieu: 'paris', difficulte: 'normal', graine: 54 });
    recruter(U, ['serv', 'commis']); U.interimAuto = true; U.argent = -200; U.decouvert = 3;
    const cu = jouer(U, 'remontée', 2, false);
    if (cu.S.decouvert !== 0 || cu.S.faillite) probleme('découvert : le compteur devrait repartir à zéro quand la caisse remonte');
    // Achats possibles jusqu'au découvert autorisé, pas au-delà.
    const V = B.creerPartie({ nom: 'T', lieu: 'paris', difficulte: 'normal', graine: 55 });
    V.argent = -B.DATA.argent.decouvertAutorise + 10;
    if (!B.stock.commander(V, 'grossiste', { pain: 400 }).erreur) probleme('découvert : une commande au-delà du découvert devrait être refusée');
  }

  // 6) Bilans : un bilan de semaine tous les 7 jours, égal à la somme des 7 bilans du jour.
  {
    const S = B.creerPartie({ nom: 'T', lieu: 'bretagne', difficulte: 'normal', graine: 56 });
    recruter(S, ['serv', 'commis']); S.interimAuto = true; S.stocks.auto = true;
    const jours7 = [];
    const c = jouer(S, 'semaine', 15, false, (T) => jours7.push({ r: T.bilan.resultat, rec: T.bilan.recettes, sem: T.bilan.semaine }));
    const T = c.S, w = T.semaines[T.semaines.length - 1];
    const somme = B.r2(jours7.slice(0, 7).reduce((s, x) => s + x.r, 0));
    if (T.semaines.length !== 2 || !jours7[6].sem || jours7[5].sem || Math.abs(w.resultat - somme) > 0.1 || w.debut !== 1 || w.fin !== 7) probleme('bilan de la semaine faux');
    if (!T.semaines[0].avant && T.semaines[0].avant !== 0) probleme('bilan de la semaine : pas de comparaison avec la semaine d’avant');
    console.log(`  Bilans de la semaine (Bretagne, Normal) : semaine 1 ${B.euros(T.semaines[1].resultat)}, semaine 2 ${B.euros(T.semaines[0].resultat)} (= somme des bilans du jour) ; semaine 3 en cours (${T.semaine.jours} jour).`);
  }

  // 7) Sauvegarde Bistrot 0.6 (format 6) en plein service : reste en Facile, salaires payés dès ce soir.
  {
    const f = 'tests/sauvegardes-bistrot/v6-bistrot-0.6-en-service.json';
    const txt = fs.readFileSync(path.join(RACINE, f), 'utf8');
    const r = B.relire(txt);
    if (!r.partie) probleme('sauvegarde 0.6 : ' + r.erreur);
    else {
      const S = r.partie, a0 = S.argent, g0 = S.groupes.length;
      if (S.version !== B.VERSION_SAUVEGARDE || S.difficulte !== 'facile' || S.pret || !S.semaine || S.equipe.some((p) => !p.patron && !p.interim && p.embauche !== S.jour)) probleme('sauvegarde 0.6 mal convertie');
      B.verifier(S).forEach((pb) => probleme('sauvegarde 0.6 : ' + pb));
      let pas = 0; while (!S.finJour && pas++ < 4000) B.avancer(S, 0.5);
      B.verifier(S).forEach((pb) => probleme('sauvegarde 0.6 après le service : ' + pb));
      if (!S.bilan || !(S.bilan.depenses.salaires > 0)) probleme('sauvegarde 0.6 : salaires pas payés le soir');
      if (txt !== fs.readFileSync(path.join(RACINE, f), 'utf8')) probleme('sauvegarde 0.6 : le fichier d’origine a changé');
      console.log(`  Sauvegarde 0.6 (Bretagne, jour ${S.jour}, ${g0} groupes en salle, ${B.euros(a0)}) : reprise en Facile, service fini, soir payé (salaires ${B.euros(S.bilan.depenses.salaires)}, charges ${B.euros(S.bilan.depenses.charges)}), caisse ${B.euros(S.argent)}.`);
    }
  }
}

// ===== Étape 6 : lieux, météo, calendrier, événements =====
console.log('\nÉtape 6 — Lieux, météo et calendrier :');
{
  if (B.VERSION_SAUVEGARDE !== 8 || B.VERSION_JEU !== '0.8.0') probleme('versions attendues : sauvegarde 8, jeu 0.8.0');
  // 1) Les 44 lieux : météo, calendrier, touristes sur 2 ans, sans valeur absurde.
  const L = B.DATA.lieux.lieux;
  if (L.length !== 44) probleme('il faut 44 lieux, il y en a ' + L.length);
  const lignes = [];
  for (const l of L) {
    const S = B.creerPartie({ nom: 'T', lieu: l.id, graine: 3, debut: '2026-11-25' });
    let fer = 0, vac = 0, pluie = 0, chaud = 0, froid = 0, fmin = 9, fmax = 0, tmin = 99, tmax = -99, tour = 0;
    for (let d = 0; d < 730; d++) {
      const i = B.cal.infos(S, d), m = i.meteo, tp = B.cal.partTouristes(S, i.serie);
      if (!['soleil', 'nuages', 'pluie', 'neige'].includes(m.ciel) || !Number.isFinite(m.temp) || !Number.isFinite(i.facteur)) { probleme(l.id + ' : météo ou affluence invalide le ' + i.texte); break; }
      if (i.ferie) fer++; if (i.vacances) vac++; if (m.ciel === 'pluie' || m.ciel === 'neige') pluie++;
      if (m.ressenti === 'chaud') chaud++; if (m.ressenti === 'froid') froid++;
      fmin = Math.min(fmin, i.facteur); fmax = Math.max(fmax, i.facteur); tmin = Math.min(tmin, m.temp); tmax = Math.max(tmax, m.temp); tour += tp;
      if (!(tp >= 0 && tp <= 0.5)) { probleme(l.id + ' : part de touristes hors limites ' + tp); break; }
    }
    if (fer < 5) probleme(l.id + ' : trop peu de jours fériés (' + fer + ' en 2 ans)');
    if (!vac) probleme(l.id + ' : aucune vacance scolaire');
    if (!(fmin > 0.5 && fmax < 2)) probleme(l.id + ` : affluence du jour hors limites (${fmin.toFixed(2)}–${fmax.toFixed(2)})`);
    if (tmin < -30 || tmax > 45) probleme(l.id + ' : températures absurdes');
    lignes.push(`${l.id} ${tmin}…${tmax}° pluie ${Math.round(pluie / 7.3)} % fériés ${fer / 2}/an vacances ${Math.round(vac / 7.3)} % touristes ${Math.round(tour / 7.3)} % affluence ×${fmin.toFixed(2)}…×${fmax.toFixed(2)}`);
  }
  console.log('  44 lieux sur 2 ans (température, jours de pluie, fériés, vacances, touristes moyens, affluence du jour) :');
  for (let k = 0; k < lignes.length; k += 2) console.log('   ' + lignes.slice(k, k + 2).join('  |  '));
  // 2) Jours de la semaine, fériés, saisons inversées, vacances par zone.
  {
    const S = B.creerPartie({ nom: 'T', lieu: 'bretagne', graine: 3, debut: '2027-03-01' });   /* lundi */
    const lun = B.cal.facteurCalendrier(S, B.cal.serieDuJour(S, 0), 720), sam = B.cal.facteurCalendrier(S, B.cal.serieDuJour(S, 5), 720);
    if (!(sam > lun)) probleme('le samedi devrait attirer plus que le lundi');
    const SR = B.creerPartie({ nom: 'T', lieu: 'reunion', graine: 3, debut: '2027-01-15' });
    if (B.cal.saison(SR, 0) !== 'ete' || B.cal.saison(B.creerPartie({ nom: 'T', lieu: 'bretagne', graine: 3, debut: '2027-01-15' }), 0) !== 'hiver') probleme('saisons : hémisphère sud pas inversé');
    const S14 = B.creerPartie({ nom: 'T', lieu: 'paris', graine: 3, debut: '2027-07-14' });
    const i14 = B.cal.infos(S14, 0);
    if (!i14.ferie) probleme('le 14 juillet devrait être férié à Paris');
    const SM = B.creerPartie({ nom: 'T', lieu: 'martinique', graine: 3, debut: '2027-05-22' });
    if (!B.cal.infos(SM, 0).ferie) probleme('le 22 mai devrait être férié en Martinique (abolition)');
    console.log(`  Bretagne : lundi ×${lun.toFixed(2)}, samedi ×${sam.toFixed(2)} ; Paris le 14 juillet : « ${i14.ferie && i14.ferie.nom} » ; La Réunion en janvier : ${B.t('saison_' + B.cal.saison(SR, 0))}.`);
  }
  // 3) Météo : la pluie fait baisser l'affluence ; le chaud fait commander plus de plats frais et de boissons fraîches.
  {
    const M = B.DATA.meteo.ciels;
    if (!(M.pluie.affluence < M.nuages.affluence && M.soleil.affluence > M.nuages.affluence)) probleme('météo : pluie et soleil devraient changer l’affluence');
    let S = B.creerPartie({ nom: 'T', lieu: 'provence', graine: 77, debut: '2027-04-20' });
    S.interimAuto = true; S.stocks.auto = true; recruter(S, ['serv', 'commis']);
    const part = { chaud: [0, 0], froid: [0, 0], doux: [0, 0] };
    const c = jouer(S, 'météo', 40, false, (T) => {
      const r = B.meteo.aujourdhui(T).ressenti, pv = T.stats.jour.platsVendus;
      for (const id in pv) { const d = B.carte.plat(T, id); const g = d && B.meteo.genrePlat(d); if (g === 'frais') part[r][0] += pv[id]; if (g) part[r][1] += pv[id]; }
    });
    const pc = (k) => part[k][1] ? Math.round(part[k][0] / part[k][1] * 100) : null;
    console.log(`  Provence, 40 jours d’avril à mai : plats « frais » = ${pc('chaud')} % des plats typés les jours chauds, ${pc('doux')} % les jours doux, ${pc('froid')} % les jours froids ou de pluie.`);
    if (pc('chaud') != null && pc('froid') != null && !(pc('chaud') > pc('froid'))) probleme('météo : il devrait se vendre plus de plats frais quand il fait chaud');
    if (c.faillite) probleme('météo : faillite');
  }
  // 4) Événements du jour, menus de fête, événements privés (Paris, 75 jours depuis le 25 novembre).
  {
    let S = B.creerPartie({ nom: 'T', lieu: 'paris', graine: 9, debut: '2026-11-25' });
    S.interimAuto = true; S.stocks.auto = true; recruter(S, ['serv', 'commis']);
    let fetePlats = 0, joursFete = 0, horsFete = 0;
    const c = jouer(S, 'événements', 75, false, (T) => {
      const fe = B.carte.surCarte(T).filter((id) => B.carte.plat(T, id).fete);
      if (fe.length) { joursFete++; fetePlats += fe.length; }
      for (const id of fe) { const f = Object.values(T.cal.fetes).find((x) => x.etat === 'oui' && T.jour >= x.debut && T.jour <= x.fin); if (!f) horsFete++; }
    });
    const T = c.S, j = T.journal.map((m) => m.texte).join('\n');
    const nb = (re) => (j.match(re) || []).length;
    const fetes = Object.values(T.cal.fetes), oui = fetes.filter((f) => f.etat === 'oui');
    const fin = T.cal.prives.filter((e) => e.etat === 'fini'), resa = T.cal.prives.filter((e) => e.etat === 'reserve');
    console.log(`  Paris 75 jours : ${fetes.length} menus de fête proposés (${oui.length} acceptés, plats de fête à la carte ${joursFete} jours) ; événements privés : ${fin.length} faits, ${resa.length} réservés, ${T.cal.prives.filter((e) => e.etat === 'perdu').length} perdus (sur les 12 derniers gardés) ; dépenses « événements » ${B.euros(c.dep.divers || 0)}.`);
    if (!fetes.length || !oui.length || !joursFete) probleme('menus de fête : aucun proposé ou mis à la carte à Paris entre novembre et février');
    if (horsFete) probleme('un plat de fête est resté à la carte en dehors de sa fête');
    if (!fin.length) probleme('aucun événement privé fait en 75 jours à Paris');
    for (const e of fin) if (!(e.prix > 0 && e.n > 0)) probleme('événement privé fini sans prix');
    if (T.tables.some((t) => t.reserve)) probleme('une table est restée réservée la nuit');
  }
  {
    // bus, match, pluie, canicule : déclenchés un par un, avec chaque choix.
    const S = B.creerPartie({ nom: 'T', lieu: 'tokyo', graine: 5, debut: '2027-08-02' });
    recruter(S, ['serv', 'commis']); B.ouvrir(S);
    const res = [];
    for (const id of ['bus', 'match', 'canicule']) for (const k of [0, 1]) {
      const a0 = S.argent, g0 = S.cal.arrivees.length, f0 = B.ev.facteur(S, 1300);
      S.cal.prochain = { id, minute: S.minute }; const auto = B.ev.choixAuto; B.ev.choixAuto = null;
      B.ev.declencher(S); B.ev.choixAuto = auto;
      if (!S.cal.attente || S.cal.attente.id !== id) probleme('événement ' + id + ' : pas de choix proposé');
      B.ev.choisir(S, k);
      res.push(`${id}/${k} : ${B.euros(a0 - S.argent)}, affluence soir ×${(B.ev.facteur(S, 1300) / f0).toFixed(2)}${id === 'bus' ? ', ' + (S.cal.arrivees.length - g0) + ' groupes' : ''}`);
      if (id === 'bus' && k === 0 && S.cal.arrivees.length - g0 !== 5) probleme('bus accepté : 5 groupes attendus');
      if (id === 'match' && k === 0 && Math.abs(a0 - S.argent - 150) > 0.01) probleme('écran du match : 150 € attendus');
    }
    console.log('  Événements du jour (Tokyo) : ' + res.join(' ; '));
    S.cal.effets = [];
  }
  // 5) Sauvegarde Bistrot 0.7 (format 7) en plein service : convertie, calendrier ajouté, service fini.
  {
    const f = 'tests/sauvegardes-bistrot/v7-bistrot-0.7-en-service.json';
    const txt = fs.readFileSync(path.join(RACINE, f), 'utf8');
    const o = JSON.parse(txt), r = B.relire(txt);
    if (!r.partie) probleme('sauvegarde 0.7 : ' + r.erreur);
    else {
      const S = r.partie;
      if (S.version !== 8 || !S.cal || S.argent !== o.argent || S.groupes.length !== o.groupes.length || S.equipe.length !== o.equipe.length || S.tables.some((t) => t.reserve)) probleme('sauvegarde 0.7 mal convertie');
      B.verifier(S).forEach((pb) => probleme('sauvegarde 0.7 : ' + pb));
      let pas = 0; while (!S.finJour && pas++ < 4000) B.avancer(S, 0.5);
      B.verifier(S).forEach((pb) => probleme('sauvegarde 0.7 après le service : ' + pb));
      B.jourSuivant(S);
      B.verifier(S).forEach((pb) => probleme('sauvegarde 0.7 le lendemain : ' + pb));
      if (txt !== fs.readFileSync(path.join(RACINE, f), 'utf8')) probleme('sauvegarde 0.7 : le fichier d’origine a changé');
      console.log(`  Sauvegarde 0.7 (${o.lieu}, jour ${o.jour}, ${o.groupes.length} groupes en salle, ${B.euros(o.argent)}) : convertie en format 8, service fini, lendemain ${B.texteDate(S)} (${B.meteo.aujourdhui(S).emoji} ${B.meteo.aujourdhui(S).temp}°).`);
    }
  }
}

// Sauvegarde venant d'une version future : refusée proprement, sans plantage.
const futur = B.relire(JSON.stringify({ format: 'bistrot', version: 999 }));
if (futur.erreur !== 'erreur_sauvegarde_recente') probleme('une sauvegarde future devrait être refusée proprement');
if (B.relire('pas du json').erreur !== 'erreur_sauvegarde_illisible') probleme('une sauvegarde abîmée devrait être signalée');

// Textes : aucune clé manquante pendant la simulation.
const manquants = Object.keys(B.textesManquants);
if (manquants.length) probleme('textes manquants : ' + manquants.join(', '));

console.log(erreurs ? `\n${erreurs} problème(s) trouvé(s).` : '\nAucun problème : pas de valeur impossible, pas de compteur négatif, toutes les journées se terminent.');
process.exit(erreurs ? 1 : 0);
