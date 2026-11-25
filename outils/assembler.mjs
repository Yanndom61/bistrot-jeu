// assembler.mjs — fabrique le jeu final à partir des fichiers rangés par domaine.
// Utilisation : node outils/assembler.mjs test       → docs/test/   (lien TEST)
//               node outils/assembler.mjs officiel   → docs/        (lien OFFICIEL, seulement après « validé »)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');

export const FICHIERS_MOTEUR = ['outils', 'salle', 'clients', 'equipe', 'planning', 'argent', 'carte', 'stocks', 'cuisine', 'service', 'partie', 'sauvegarde', 'ancien'].map((n) => `src/moteur/${n}.js`);
export const FICHIERS_INTERFACE = ['ecran', 'dessin-salle', 'messages', 'volets', 'equipe', 'argent', 'carte', 'stocks', 'stockage', 'accueil', 'boucle'].map((n) => `src/interface/${n}.js`);
export const DONNEES = ['lieux', 'salle', 'clients', 'equipe', 'carte', 'catalogue', 'stocks', 'prix-gros', 'regles', 'argent', 'textes'];

export function donnees() {
  const d = {};
  for (const n of DONNEES) d[n] = JSON.parse(lire(`donnees/${n}.json`));
  return d;
}

/** Le moteur seul (sans écran) : utilisé par le jeu et par le simulateur. */
export function moteur() {
  return 'var B = {};\nB.DATA = ' + JSON.stringify(donnees()) + ';\n' +
    FICHIERS_MOTEUR.map((f) => `/* ==== ${f} ==== */\n` + lire(f)).join('\n');
}

function assembler(canal) {
  if (!['test', 'officiel'].includes(canal)) throw new Error('canal inconnu : ' + canal);
  const sortie = path.join(RACINE, 'docs', canal === 'test' ? 'test' : '');
  fs.mkdirSync(sortie, { recursive: true });
  const js = '(function () {\n"use strict";\n' + moteur() + `\nB.CANAL = ${JSON.stringify(canal)};\nwindow.B = B;\n` +
    FICHIERS_INTERFACE.map((f) => `/* ==== ${f} ==== */\n` + lire(f)).join('\n') + '\n})();';
  const html = lire('statique/index.html').replace('/*CSS*/', () => lire('statique/style.css')).replace('/*JS*/', () => js);
  fs.writeFileSync(path.join(sortie, 'index.html'), html);

  const titre = canal === 'test' ? 'Bistrot (test)' : 'Bistrot';
  const manifeste = {
    name: titre, short_name: titre, lang: 'fr', start_url: './', scope: './',
    display: 'fullscreen', display_override: ['fullscreen', 'standalone'], orientation: 'landscape',
    background_color: '#2b211c', theme_color: '#3a2a22',
    icons: [
      { src: 'icone-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icone-512.png', sizes: '512x512', type: 'image/png' },
      { src: 'icone-masquable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  };
  fs.writeFileSync(path.join(sortie, 'manifest.webmanifest'), JSON.stringify(manifeste, null, 1));
  for (const ic of ['icone-192.png', 'icone-512.png', 'icone-masquable-512.png']) {
    fs.copyFileSync(path.join(RACINE, 'statique', canal === 'test' ? ic.replace('.png', '-test.png') : ic), path.join(sortie, ic));
  }
  const empreinte = crypto.createHash('sha1').update(html).digest('hex').slice(0, 10);
  const sw = lire('statique/sw.js').replace('__CACHE__', `bistrotjeu-${canal}-${empreinte}`).replace('__PREFIXE__', `bistrotjeu-${canal}-`);
  fs.writeFileSync(path.join(sortie, 'sw.js'), sw);
  const ko = Math.round(Buffer.byteLength(html) / 1024);
  console.log(`Assemblé : ${path.relative(RACINE, sortie) || '.'}/index.html (${ko} Ko), cache ${empreinte}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  assembler(process.argv[2] || 'test');
}
