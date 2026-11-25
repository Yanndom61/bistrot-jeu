// simuler.mjs — joue des journées entières sans écran et sort un bilan.
// Utilisation : node outils/simuler.mjs [jours=5] [lieux=paris,tokyo,...]
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { moteur } from './assembler.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jours = +(process.argv[2] || 5);
const lieux = (process.argv[3] || 'paris,idf,bretagne,corse,reunion,polynesie,londres,new-york,tokyo,dakar,canberra,mayotte').split(',');

const ctx = {};
vm.createContext(ctx);
vm.runInContext(moteur() + '\nthis.B = B;', ctx);
const B = ctx.B;

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
    achats: 0, gaspillage: 0, gaspPortions: 0, ruptures: 0, partisRupture: 0, mdj: 0, emporter: 0, boissons: 0, causes: {}, S: null };
  for (let j = 1; j <= jours; j++) {
    if (!S.ouvert) B.ouvrir(S);
    if (!S.ouvert) { probleme(etiquette + ' : impossible d’ouvrir'); return cumul; }
    let pas = 0;
    const argent0 = S.argent;
    while (!S.finJour && pas < 4000) {
      B.avancer(S, 0.5);
      pas++;
      if (pas === 120 || pas === 1100) {
        const r = B.relire(B.serialiser(S));
        if (!r.partie) probleme('sauvegarde illisible : ' + r.erreur);
        else S = r.partie;
      }
      if (pas % 20 === 0) for (const pb of B.verifier(S)) probleme(`${etiquette} jour ${j} ${B.heure(S.minute)} : ${pb}`);
    }
    if (!S.finJour) probleme(`${etiquette} jour ${j} : la journée ne se termine pas`);
    if (avantNuit) avantNuit(S, j);
    const st = S.stats.jour, b = S.bilan || {};
    if (afficher) console.log(`${etiquette.padEnd(14)} ${String(j).padStart(4)} ${String(st.groupes).padStart(8)} ${String(st.arrives).padStart(8)} ${String(st.servis).padStart(7)} ${String(st.repartis).padStart(9)} ${String(b.attente ?? '-').padStart(7)} min ${B.euros(st.recettes).padStart(10)} ${B.prix(b.ticketMoyen || 0).padStart(10)} ${String(st.platsRenvoyes).padStart(7)} ${B.prix(st.pourboires).padStart(11)}  ${B.heure(S.minute)}`);
    if (Math.abs(S.argent - argent0 - (st.recettes - st.achats)) > 0.01) probleme(`${etiquette} jour ${j} : l’argent a bougé de ${S.argent - argent0} mais recettes − achats = ${st.recettes - st.achats}`);
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

console.log(`Simulation : ${jours} jours × ${lieux.length} lieux (difficulté Facile)\n`);
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
console.log('\nArgent par jour en Facile (commande automatique) : recettes − achats de marchandise − salaires (35 h, charges non comptées) = résultat');
let pertes = 0;
for (const [lieu, c] of resumeLieux) {
  const n = c.jours || 1, sal = B.equipe.coutMensuel(c.S) / 30, res = (c.recettes - c.achats) / n - sal;
  console.log(`  ${lieu.padEnd(12)} recettes ${B.euros(c.recettes / n).padStart(8)} · achats ${B.euros(c.achats / n).padStart(7)} (${Math.round(c.achats / Math.max(1, c.recettes) * 100)} %) · salaires ${B.euros(sal).padStart(6)} · résultat ${B.euros(res).padStart(8)} · gaspillage ${(c.gaspPortions / n).toFixed(1)} portions (${B.euros(c.gaspillage / n)}) · ruptures ${(c.ruptures / n).toFixed(1)} · menus du jour ${Math.round(c.mdj / n)} + ${Math.round(c.emporter / n)} à emporter · boissons ${Math.round(c.boissons / n)}`);
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
  const i1 = B.equipe.appelerInterim(S, 'cuisine');
  if (!i1 || B.equipe.interimPossible(S, 'cuisine') !== 'interim_complet_cuisine') probleme('intérim : une seule place vide en cuisine → un seul intérimaire');
  const vS = B.equipe.placesVides(S, 'salle');
  let n = 0; while (B.equipe.appelerInterim(S, 'salle')) n++;
  if (n !== vS) probleme(`intérim : ${n} intérimaires en salle au lieu de ${vS}`);
  const ef = B.equipe.effectif(S);
  let pas = 0; while (!S.finJour && pas++ < 4000) B.avancer(S, 0.5);
  B.verifier(S).forEach((pb) => probleme('intérim : ' + pb));
  B.jourSuivant(S);
  if (S.equipe.some((p) => p.interim)) probleme('intérim : les intérimaires devraient repartir le lendemain');
  console.log(`\nEffectif : ${ef.n}/${ef.total} titulaires (2e chef refusé : poste complet), intérim : 1 en cuisine + ${n} en salle pour la journée, repartis le lendemain.`);
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
    if (T.version !== 5 || !T.dejaOuvert || T.interimAuto !== true || T.equipe.some((p) => p.nom === 'Intérimaire')) probleme('sauvegarde 0.2 mal convertie');
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
  const sal = B.equipe.salle(S).length, cui = B.equipe.cuisine(S).length, aut = S.equipe.filter((p) => p.service === 'autre').length;
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
  console.log(`  ✓ ${f} → ${S.nom}, ${B.lieu(S.lieu).nom}, jour ${S.jour}, ${B.euros(S.argent)}, note ${S.note}, ${S.equipeReprise} employés repris (salle ${sal} et cuisine ${cui}, patron compris ; ${aut} en attente de rôle), carte : ${ca.lus || 0} plats relus, ${ca.ignores || 0} plats de l’ancien jeu pas encore dans Bistrot${ca.ajustes ? ', carte ajustée aux limites 6/9/6' : ''}, stocks : ${so.produits ? `${so.produits} produits (${so.portions} portions${so.perimes ? `, ${so.perimes} périmées jetées` : ''}), ${so.commandes} commande(s) en route livrée(s)` : 'pas de stock lisible, premières courses faites'}`);
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
