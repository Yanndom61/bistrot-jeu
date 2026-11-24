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

function jouer(S, etiquette, jours, afficher) {
  const cumul = { arrives: 0, servis: 0, repartis: 0, attente: 0 };
  for (let j = 1; j <= jours; j++) {
    if (!S.ouvert) B.ouvrir(S);
    if (!S.ouvert) { probleme(etiquette + ' : impossible d’ouvrir'); return cumul; }
    let pas = 0;
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
    const st = S.stats.jour, b = S.bilan || {};
    if (afficher) console.log(`${etiquette.padEnd(26)} ${String(j).padStart(4)} ${String(st.groupes).padStart(8)} ${String(st.arrives).padStart(8)} ${String(st.servis).padStart(7)} ${String(st.repartis).padStart(9)} ${String(st.fileMax).padStart(9)} ${String(b.attente ?? '-').padStart(9)} min  ${B.heure(S.minute)}`);
    if (st.servis + st.repartis !== st.arrives) probleme(`${etiquette} jour ${j} : ${st.arrives} arrivés mais ${st.servis} servis + ${st.repartis} repartis`);
    for (const pb of B.verifier(S)) probleme(`${etiquette} jour ${j} fin : ${pb}`);
    cumul.arrives += st.arrives; cumul.servis += st.servis; cumul.repartis += st.repartis; cumul.attente += b.attente || 0;
    B.jourSuivant(S);
  }
  return cumul;
}

console.log(`Simulation : ${jours} jours × ${lieux.length} lieux (difficulté Facile)\n`);
console.log('Équipe : patron en salle + 1 serveur + 1 commis de cuisine');
console.log('lieu                       jour  groupes  arrivés  servis  repartis  file max  attente cmd  fin');
for (const lieu of lieux) {
  if (!B.DATA.lieux.lieux.find((l) => l.id === lieu)) { probleme('lieu inconnu ' + lieu); continue; }
  const S = B.creerPartie({ nom: 'Test', lieu, graine: 12345 + lieu.length * 7919 + lieu.charCodeAt(0) });
  if (B.ouvrir(S)) probleme('le restaurant ne devrait pas ouvrir sans cuisinier');
  recruter(S, ['serv', 'commis']);
  jouer(S, lieu, jours, true);
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
  console.log(`  ✓ ${f} → ${S.nom}, ${B.lieu(S.lieu).nom}, jour ${S.jour}, ${B.euros(S.argent)}, note ${S.note}, ${S.equipeReprise} employés repris (salle ${sal} et cuisine ${cui}, patron compris ; ${aut} en attente de rôle)`);
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
