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

console.log(`Simulation : ${jours} jours × ${lieux.length} lieux (difficulté Facile, la seule de l'étape 1)\n`);
console.log('lieu            jour  groupes  arrivés  servis  repartis  file max  attente cmd  fin');
for (const lieu of lieux) {
  if (!B.DATA.lieux.lieux.find((l) => l.id === lieu)) { probleme('lieu inconnu ' + lieu); continue; }
  let S = B.nouvellePartie({ nom: 'Test', lieu, graine: 12345 + lieu.length * 7919 + lieu.charCodeAt(0) });
  for (let j = 1; j <= jours; j++) {
    let pas = 0;
    while (!S.finJour && pas < 4000) {
      B.avancer(S, 0.5);
      pas++;
      // Test de sauvegarde au milieu du service : on enregistre, on relit, on continue sur la copie.
      if (pas === 120 || pas === 1100) {
        const r = B.relire(B.serialiser(S));
        if (!r.partie) probleme('sauvegarde illisible : ' + r.erreur);
        else S = r.partie;
      }
      if (pas % 20 === 0) for (const pb of B.verifier(S)) probleme(`${lieu} jour ${j} ${B.heure(S.minute)} : ${pb}`);
    }
    if (!S.finJour) probleme(`${lieu} jour ${j} : la journée ne se termine pas`);
    const st = S.stats.jour, b = S.bilan || {};
    const fin = B.heure(S.minute);
    console.log(`${lieu.padEnd(15)} ${String(j).padStart(4)} ${String(st.groupes).padStart(8)} ${String(st.arrives).padStart(8)} ${String(st.servis).padStart(7)} ${String(st.repartis).padStart(9)} ${String(st.fileMax).padStart(9)} ${String(b.attente ?? '-').padStart(9)} min  ${fin}`);
    if (st.servis + st.repartis !== st.arrives) probleme(`${lieu} jour ${j} : ${st.arrives} arrivés mais ${st.servis} servis + ${st.repartis} repartis`);
    for (const pb of B.verifier(S)) probleme(`${lieu} jour ${j} fin : ${pb}`);
    B.jourSuivant(S);
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
  if (fs.readFileSync(path.join(dossier, f), 'utf8') !== txt) probleme(f + ' modifié !');
  B.avancer(S, 120);
  pb.push(...B.verifier(S));
  pb.forEach((p) => probleme(f + ' : ' + p));
  const r = B.relire(B.serialiser(S));
  if (!r.partie) probleme(f + ' : la partie convertie ne se relit pas');
  console.log(`  ✓ ${f} → ${S.nom}, ${B.lieu(S.lieu).nom}, jour ${S.jour}, ${B.euros(S.argent)}, note ${S.note}`);
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
