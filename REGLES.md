# Règles du jeu Bistrot

Ce document est **la référence unique** des règles. Il est tenu à jour à chaque version.
Version décrite : **0.1 (étape 1 : la salle en direct)**.

---

## 1. Le temps

- La journée commence à **11:30** et les portes ouvrent à **11:45**.
- À la vitesse **1×**, une minute de jeu passe en une seconde. **2×** et **4×** vont deux et quatre fois plus vite. **Pause** arrête tout.
- Le service du midi commence à 12:00 et celui du soir à 19:00. Plus aucun client n'arrive après **21:45**.
- La journée se termine quand il est au moins **22:30**, que le dernier client est parti et que les tables sont débarrassées. À **23:59** au plus tard, les derniers clients partent d'eux-mêmes.
- À la fin de la journée, un écran montre 3 chiffres : clients servis, clients repartis faute de place, attente moyenne avant la commande. Un bouton lance le jour suivant.

### Pauses automatiques
- **Volet ouvert** (Journal, Menu) : le jeu se met en pause et repart tout seul à la fermeture. Ce réglage peut être coupé dans Menu › Réglages.
- **Téléphone en portrait** : un écran demande de tourner le téléphone, et la partie est en pause.
- **Appli en arrière-plan** (on change d'appli, l'écran s'éteint) : pause et sauvegarde.
- **Écran d'accueil** et **fin de journée** : pause.

## 2. La salle

- La salle est dessinée **en largeur** : entrée à gauche, 10 tables au milieu sur deux rangées, passe et cuisine à droite.
- **10 tables : 6 tables de 4 places et 4 tables de 2 places** (comme la salle de départ de l'ancien jeu).
  - Rangée du haut : tables 1 (2 pl.), 2 (4), 3 (4), 4 (2), 5 (4).
  - Rangée du bas : tables 6 (4), 7 (2), 8 (4), 9 (4), 10 (2).
- **Tables rapprochées** : les tables 2-3 et 8-9 peuvent être collées pour un groupe de 5 ou 6 (8 places).
- Toucher une table montre son détail dans le cadre en bas à droite, par exemple : « Table 2-3 · 5 pers. · famille Martin · mange · depuis 33 min ». Toucher à nouveau la désélectionne.
- Sous ou au-dessus de chaque table, une étiquette dit ce qui s'y passe : arrive, carte, commande, cuisine, plat prêt, mange, addition, à nettoyer.
- Couleur de l'étiquette quand les clients attendent un serveur (commande, plat prêt, addition) : **vert** moins de 8 min, **orange** de 8 à 15 min, **rouge** au-delà.

## 3. Les clients

- Les clients arrivent par **groupes**. Six sortes de groupes :

| Groupe | Personnes | Part des arrivées | Durée du repas |
|---|---|---|---|
| Client seul | 1 | 12 % | 20 à 30 min |
| Couple | 2 | 26 % | 30 à 45 min |
| Amis | 2 à 4 | 20 % | 35 à 50 min |
| Famille | 3 à 6 | 14 % | 40 à 55 min |
| Repas d'affaires | 2 à 4 | 14 % | 25 à 35 min |
| Touristes | 2 à 4 | 14 % | 35 à 50 min |

- **Affluence** (groupes par heure, avant le coefficient du lieu) :
  11:45-12:00 : 3 · 12:00-13:30 : 5 · 13:30-14:15 : 4 · 14:15-18:30 : 1 · 18:30-19:15 : 3 · 19:15-21:00 : 5 · 21:00-21:45 : 3.
- Ce nombre est multiplié par **l'affluence du lieu** (Paris × 1,3 ; Tokyo × 1,45 ; Mayotte × 0,75…).
- **Placement** (automatique à cette étape) : le groupe prend la plus petite table libre et propre qui suffit. Pour 5 ou 6 personnes, il faut deux tables rapprochées libres.
- **File à la porte** : sans table, le groupe attend à l'entrée. Il repart au bout de **12 à 20 min** s'il n'a toujours pas de table. Les premiers arrivés passent en premier, sauf si leur table n'est pas libre et qu'un groupe plus petit peut s'asseoir.
- **Déroulé d'un repas** : s'installer → lire la carte (4 à 7 min) → attendre le serveur pour commander → plat en cuisine (12 à 18 min) → le serveur apporte le plat → manger (selon le groupe) → demander l'addition → le serveur l'apporte → départ. La table est ensuite **à débarrasser**.
- À cette étape, les clients ne paient pas encore : la carte, les prix et le paiement arrivent à l'étape 2. L'argent affiché ne bouge donc pas.

## 4. Les serveurs

- Deux serveurs pour l'instant : **le Patron** et **Léa**. On les reconnaît à leur rond noir cerclé de jaune avec un tablier blanc. Ils portent une assiette blanche quand ils servent, et une petite note quand ils apportent l'addition.
- Ils choisissent seuls quoi faire, dans cet ordre : 1) apporter un plat prêt (il refroidit), 2) apporter l'addition, 3) prendre une commande, 4) débarrasser une table. À priorité égale, ils servent celui qui attend depuis le plus longtemps.
- Temps de chaque geste : prendre une commande 1,5 min, prendre le plat à la passe 0,3 min, poser le plat 0,5 min, addition 1,5 min, débarrasser 1 min par table.
- Ils marchent par l'allée centrale. Quand il n'y a rien à faire, ils retournent près de la passe.
- L'équipe (recrutement, plannings, salaires) arrive à l'étape 4.

## 5. Les lieux

- Les **44 lieux** de l'ancien jeu sont repris tels quels : 14 en France, 7 en Outre-mer et 23 capitales du monde. Fichier : `donnees/lieux.json`.
- À cette étape, le lieu change seulement **l'affluence** et **les noms des clients**. Les salaires, les prix, la météo, le calendrier et les spécialités viendront à l'étape 6.

## 6. La difficulté

- Une seule difficulté pour l'instant : **Facile**. Tu es propriétaire, avec **600 000 €** au départ et une note de 3 sur 5.
- Normal et Difficile (loyer, charges, prêt) arrivent à l'étape 5.

## 7. Messages et Journal

- Les messages s'affichent dans **leur propre zone, en haut à droite**. Elle ne recouvre jamais un bouton ni la salle.
- On voit au plus **3 messages** à la fois. S'il y en a plus, une ligne indique « +4 messages ». Chaque message disparaît seul après 6 secondes.
- Tous les messages restent lisibles dans le **Journal** (bouton en haut), du plus récent au plus ancien. Les 300 derniers sont gardés.

## 8. Sauvegarde

- La partie est **enregistrée toute seule** : toutes les 5 minutes de jeu, quand on ouvre un volet, en fin de journée, et quand on quitte l'appli.
- L'avant-dernière sauvegarde est gardée en secours. Si la dernière est abîmée, le jeu reprend la précédente.
- Chaque sauvegarde porte un **numéro de version** (actuellement 1). Quand une future version changera le format, elle saura convertir les anciennes sauvegardes. Une sauvegarde venant d'une version plus récente n'est jamais écrasée sans prévenir : un message demande de mettre le jeu à jour.
- **Cases séparées** sur le téléphone :
  - lien TEST : `bistrotjeu.test.partie` (+ `bistrotjeu.test.partie-precedente`, `bistrotjeu.test.reglages`) ;
  - lien OFFICIEL : `bistrotjeu.officiel.partie`, etc.
  Un test ne peut donc jamais abîmer la vraie partie.

### Reprendre une partie de l'ancien jeu (Chez YaYa)
- L'ancien jeu et Bistrot sont sur la même adresse (yanndom61.github.io). Bistrot peut donc **lire** les parties de l'ancien jeu sur le même téléphone : les 5 emplacements (`bistrot_slot1` à `bistrot_slot5`) et la sauvegarde principale (`bistrot_save_v1`).
- Bistrot **ne modifie jamais et n'efface jamais** ces cases. Il fait une copie dans ses propres cases (`bistrotjeu.test.copie-ancien-jeu`).
- À l'étape 1, Bistrot reprend : le **nom** du restaurant, le **lieu**, le **jour**, l'**argent** et la **note**. La partie repart au matin de ce jour. La carte, les stocks, l'équipe et le plan seront repris aux étapes suivantes, à partir de la copie.
- Les anciennes sauvegardes testées vont de la version 9 à la version 11 de l'ancien format (Chez YaYa v8 à v10.2).

## 9. Affichage sur téléphone

Tailles de référence testées (en pixels « CSS », téléphone en paysage) :

| Téléphone | Taille | Part de l'écran pour la salle | Plus petit texte de la salle |
|---|---|---|---|
| Galaxy S22 | 780 × 360 | 69 % (dessin : 62 %) | 13,6 px |
| Galaxy S23 FE | 832 × 384 | 71 % (dessin : 64 %) | 14,8 px |
| Avec les barres de Chrome | 780 × 300 | 67 % (dessin : 61 %) | 12,4 px |

- Tous les boutons font au moins 44 × 44 px et tous les textes au moins 12 px.
- Ces chiffres sont mesurés automatiquement par `outils/tester.py` à chaque version.
- Installé sur l'écran d'accueil, le jeu s'ouvre **en plein écran et en paysage**.

## 10. Équilibre mesuré (simulateur, 30 jours, Facile)

| Lieu | Clients par jour | Servis | Repartis faute de place |
|---|---|---|---|
| Mayotte | 39 | 39 | 1 % |
| La Réunion | 65 | 62 | 3 % |
| Bretagne | 70 | 67 | 4 % |
| Île-de-France | 81 | 77 | 4 % |
| Paris | 99 | 90 | 9 % |
| Tokyo | 115 | 100 | 13 % |
| New York | 119 | 104 | 13 % |

Attente moyenne avant la commande : environ 3 min. Aucune valeur impossible, toutes les journées se terminent.
Détail complet : `tests/resultat-simulation-30-jours.txt`.
