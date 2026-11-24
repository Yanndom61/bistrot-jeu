# Bistrot — jeu de gestion de restaurant (téléphone, paysage)

- **Lien TEST** : https://yanndom61.github.io/bistrot-jeu/test/
- **Lien OFFICIEL** : https://yanndom61.github.io/bistrot-jeu/ (publié seulement après le « validé » de Yann)

## Où est quoi
- `REGLES.md` : toutes les règles du jeu, en français simple (la référence).
- `PRIORITES.md` : ce qui reste à faire (Indispensable / Sympa / Un jour).
- `CHANGEMENTS.md` : 10 lignes maximum par version.
- `donnees/` : les données lisibles (lieux, salle, clients, réglages) et **tous les textes** du jeu (`textes.json`).
- `src/moteur/` : les règles (sans affichage) : temps, salle, clients, service, sauvegarde, ancien jeu.
- `src/interface/` : l'affichage : barre, dessin de la salle, messages, volets, accueil.
- `statique/` : page, style, icônes, service hors connexion.
- `docs/` : le jeu assemblé, servi par GitHub Pages (`docs/test/` = lien TEST, `docs/` = lien OFFICIEL).

## Commandes
- `node outils/assembler.mjs test` : fabrique le lien TEST dans `docs/test/`.
- `node outils/simuler.mjs 30` : joue 30 jours dans 12 lieux sans écran et vérifie qu'il n'y a aucune valeur impossible.
- `python3 outils/tester.py` : ouvre le jeu dans Chrome aux tailles des téléphones, vérifie l'affichage et prend les captures dans `captures/`.
- `node outils/assembler.mjs officiel` : seulement après le « validé » de Yann.
