# Règles du jeu Bistrot

Ce document est **la référence unique** des règles. Il est tenu à jour à chaque version.
Version décrite : **0.8.1 (les 13 événements du jour ont maintenant un vrai effet ; base : 0.8, étape 6 « Lieux, météo et calendrier » : les 44 lieux avec leur climat, leur saison touristique et leur calendrier ; météo qui change l'affluence et les commandes ; jours de la semaine, saisons, fériés, vacances ; menus de fête, événements du jour et événements privés de l'ancien jeu)**.

---

## 1. Le temps

- La journée commence à **11:30** et les portes ouvrent à **11:45**.
- **Premier jour** : le restaurant reste **fermé** (l'horloge ne tourne pas) tant que l'équipe n'est pas prête et que tu n'as pas touché « Ouvrir le restaurant » dans le volet Équipe. Les jours suivants, il ouvre tout seul.
- À la vitesse **1×**, une minute de jeu passe en une seconde. **2×** et **4×** vont deux et quatre fois plus vite. **Pause** arrête tout.
- Le service du midi commence à 12:00 et celui du soir à 19:00. Plus aucun client n'arrive après **21:45**.
- La journée se termine quand il est au moins **22:30**, que le dernier client est parti et que les tables sont débarrassées. À **23:59** au plus tard, les derniers clients partent d'eux-mêmes (ceux qui ont mangé paient ; les autres comptent comme repartis, *v0.8.1*).
- À la fin de la journée, un écran montre 3 chiffres : clients servis, clients repartis faute de place, attente moyenne avant la commande. Un bouton lance le jour suivant.

### Pauses automatiques
- **Volet ouvert** (Équipe, Journal, Menu) : le jeu se met en pause et repart tout seul à la fermeture. Ce réglage peut être coupé dans Menu › Réglages.
- **Téléphone en portrait** : un écran demande de tourner le téléphone, et la partie est en pause.
- **Appli en arrière-plan** (on change d'appli, l'écran s'éteint) : pause et sauvegarde.
- **Écran d'accueil** et **fin de journée** : pause.
- **Événement du jour** (bus, match, canicule…, *v0.8*) : pause jusqu'à ta réponse.

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
- Ce nombre est multiplié par **l'affluence du lieu** (Paris × 1,3 ; Tokyo × 1,45 ; Mayotte × 0,75…), puis par celle **du jour** : jour de la semaine, météo, vacances, fériés, fêtes, touristes et événements (voir § 5b, *v0.8*).
- La part de **touristes** et de **familles** change selon le lieu et le jour (§ 5b) ; les autres groupes gardent leurs proportions.
- **Placement automatique** (par défaut) : le groupe prend la plus petite table libre et propre qui suffit. Pour 5 ou 6 personnes, il faut deux tables rapprochées libres.
- **Placement par le joueur** : le bouton « Placement : auto / moi » (en bas à droite, aussi dans Menu › Réglages) bascule le mode. En mode « moi », personne ne s'assoit tout seul : tu touches un groupe à la porte (il s'entoure en bleu), puis une table libre.
  - Si la table est trop petite, un message le dit (« Table 1 : 2 places, trop petite pour 4 pers. ») et le groupe reste choisi.
  - Pour 5 ou 6 personnes, touche la table 2, 3, 8 ou 9 : les deux tables rapprochées doivent être libres.
  - Les groupes que tu ne places pas repartent au bout de leur patience, comme en automatique.
  - Le mode choisi est enregistré avec la partie.
- **File à la porte** : sans table, le groupe attend à l'entrée. Il repart au bout de **12 à 20 min** s'il n'a toujours pas de table. Les premiers arrivés passent en premier, sauf si leur table n'est pas libre et qu'un groupe plus petit peut s'asseoir.
- **Déroulé d'un repas** : s'installer → lire la carte (4 à 7 min) → attendre le serveur pour commander → plat en cuisine (12 à 18 min) → le serveur apporte le plat → manger (selon le groupe) → demander l'addition → le serveur l'apporte → départ. La table est ensuite **à débarrasser**.
- À cette étape, les clients ne paient pas encore : la carte, les prix et le paiement arrivent à l'étape 2. L'argent affiché ne bouge donc pas.

## 4. L'équipe

### Démarrage (comme dans Chez YaYa)
- Tu démarres **seul, avec le patron**, et tu recrutes ton équipe dès le premier jour, avant d'ouvrir.
- **14 candidats** t'attendent : 3 serveurs, 1 commis de salle, 1 responsable de salle, 2 chefs de cuisine, 1 second de cuisine, 1 commis de cuisine, 1 aide de cuisine, **1 barman, 1 plongeur, 1 agent de nettoyage, 1 apprenti** *(v0.6)*. Chaque matin, 1 à 3 nouveaux candidats arrivent (8 au plus en attente), seulement pour des postes qui ont encore une place. Deux candidats n'ont jamais le même nom.

### L'effectif : 16 employés, comme dans Chez YaYa
- Source : l'équipe que Yann avait fixée dans Chez YaYa (cahier des charges v6, §1, et v6b, point 7 ; constantes `SLOTS` et `DEPS` de l'ancien jeu). Fichier : `donnees/equipe.json` (`effectif`).
- **16 employés : salle 8, cuisine 6, nettoyage 2.** Le patron est en plus, les intérimaires aussi.

| Groupe | Places |
|---|---|
| Salle (8) | 1 responsable de salle · 5 serveurs (un commis de salle peut prendre une place de serveur) · 2 barmans |
| Cuisine (6) | 1 chef · 1 second · 1 commis (ou aide de cuisine) · 1 apprenti · 2 plongeurs |
| Nettoyage (2) | 2 agents de nettoyage |

- Quand une place est prise, on ne peut plus embaucher à ce poste : le candidat affiche « Poste complet » et n'a plus de bouton Entretien. Renvoyer quelqu'un libère sa place.
- **Les 16 places sont toutes recrutables** *(v0.6, décision de Yann)* : responsable de salle, serveurs, commis de salle, **barmans**, chef, second, commis et aide de cuisine, **apprenti**, **plongeurs**, **agents de nettoyage**.
- Le volet Équipe a 5 onglets : **Équipe** (ton équipe, fiche de chacun, renvoi), **Embauche** (candidats, intérim, places), **Planning**, **Formations**, **Cagnotte**. Avant la toute première ouverture, il s'ouvre sur « Embauche » ; ensuite sur « Équipe ».
- Une ancienne partie peut dépasser une place (l'ancien jeu le permettait) : tout le monde est gardé, mais on ne peut plus embaucher à ce poste tant qu'il est au-dessus.

### L'intérim (comme dans Chez YaYa, version simple)
- Un intérimaire **remplace pour la journée une place vide ou une personne absente** (en repos ou en formation, *v0.6*). Il repart le lendemain matin et ne compte pas dans les 16.
- Bouton « Appeler un serveur intérimaire » (salle) ou « Appeler un commis intérimaire » (cuisine) dans l'onglet Embauche. Il y a au plus autant d'intérimaires que de places vides ou d'absents aujourd'hui en salle (responsable + 5 serveurs) ou en cuisine (chef + second + commis + apprenti). Pas d'intérimaire au bar, à la plonge ni au nettoyage : sans eux, la salle et la cuisine se débrouillent (plus lentement).
- **Pas avant ta première ouverture** : le premier jour, tu recrutes toi-même.
- Salaire : minimum de la grille (3 ans d'expérience) **+ 30 %**, comme dans l'ancien jeu. Il est payé le soir de sa journée *(v0.7)* : salaire horaire × 7 h 53.
- Intérimaire « moyen » : note 5, vitesse 5. Il peut être renvoyé comme les autres.
- **Intérim automatique** (option dans l'onglet Embauche) : le matin, s'il n'y a personne en salle ou en cuisine pour ouvrir (par exemple ton seul cuisinier est en repos), un intérimaire est appelé tout seul (dernier recours, comme dans l'ancien jeu). **Activé par défaut en Facile, coupé par défaut en Normal et Difficile** (ces difficultés viendront plus tard).
- Pour ouvrir, il faut **au moins une personne en salle et une en cuisine**. Le patron compte pour l'une des deux : il est en salle au départ, et tu peux le passer en cuisine (bouton dans Équipe), sauf s'il laisserait son poste vide.
- La v0.1 avait une serveuse automatique (Léa) : elle est supprimée.

### Les candidats et l'entretien
- Chaque candidat a un prénom, un âge, un poste, des années d'expérience et une **personnalité** : sérieux, souriant, ambitieux, discret, stressé, blagueur ou posé (accordée au féminin quand il le faut).
- Il a aussi une **note sur 10**, une **vitesse**, un **sens du service** (salle) ou une **qualité en cuisine**, et un **salaire souhaité**. Ces chiffres sont cachés : on les découvre en posant les questions.
- **4 questions** (on peut les poser dans l'ordre qu'on veut) :
  1. « Parlez-moi de votre parcours. » : la réponse dépend de l'expérience ;
  2. « Que faites-vous en plein coup de feu ? » : révèle la vitesse ;
  3. « Racontez-moi un client difficile. » (salle) ou « Comment travaillez-vous vos plats ? » (cuisine) : révèle le sens du service ou la qualité ;
  4. « Quel salaire souhaitez-vous ? » : révèle le salaire demandé.
- Les réponses mêlent une entrée en matière selon la personnalité, une réponse selon le niveau, et parfois une petite phrase de fin. Sur 192 réponses tirées au hasard, 93 % sont différentes.
- **Proposer un salaire** (en € brut de l'heure, par pas de 10 centimes) :
  - jamais en dessous du **minimum de la grille** pour ce poste ;
  - le candidat **accepte** si l'offre atteint son souhait (il accepte jusqu'à 6 % de moins selon sa personnalité ; l'ambitieux ne lâche rien) ;
  - il fait une **contre-proposition** si l'offre atteint au moins 92 % de son souhait ;
  - sinon il **refuse**. Au 2ᵉ refus, il retire sa candidature.
- Le candidat embauché rejoint l'équipe tout de suite.

### Salaires : la grille officielle
- Source : convention collective Hôtels, cafés, restaurants (IDCC 1979), **avenant n° 36 du 4 juin 2026**, minima horaires bruts en vigueur depuis le **1er novembre 2026**. Vérifié sur Légifrance le 24 novembre 2026. Fichier : `donnees/equipe.json`.

| | Niveau I | Niveau II | Niveau III | Niveau IV | Niveau V |
|---|---|---|---|---|---|
| Échelon 1 | 12,31 € | 12,58 € | 13,59 € | 14,69 € | 18,80 € |
| Échelon 2 | 12,37 € | 12,80 € | 13,81 € | 15,07 € | 22,22 € |
| Échelon 3 | 12,47 € | 13,43 € | 14,28 € | 15,71 € | 28,68 € |

- Niveau de chaque poste (choix du jeu) : commis de salle **I**, aide de cuisine **I**, serveur **II**, commis de cuisine **II**, responsable de salle **III**, second de cuisine **III**, chef de cuisine **IV**. Barman **II**, plongeur **I**, agent de nettoyage **I**, apprenti 53 % du niveau I-1 (comme dans l'ancien jeu).
- Échelon selon l'expérience : jusqu'à 2 ans → échelon 1 ; 3 à 7 ans → échelon 2 ; 8 ans et plus → échelon 3.
- Le coefficient « salaires » du lieu s'applique par-dessus (Paris × 1,15). Il ne descend jamais sous 1, donc jamais sous la grille.
- Le candidat demande entre le minimum et environ 35 % de plus, selon sa note et sa personnalité.
- Salaire mensuel affiché : taux horaire × 170,73 h (39 h par semaine, dont 4 h majorées de 10 %).
- **Les salaires sont payés chaque soir** *(v0.7, étape « Argent » comme décidé avec Yann)* : chaque employé reçoit 1/30,42 de son salaire du mois (39 h par semaine), jours de repos et de formation compris. Le patron ne se paie pas : il garde le bénéfice. Le coût mensuel de l'équipe est affiché dans le volet Équipe et dans le volet Argent. Voir §6.

### Renvoyer un employé
- Chaque employé (intérimaires compris) a un bouton **« Renvoyer »** dans l'onglet Équipe et sur sa fiche *(v0.6 : barmans, plongeurs, agents de nettoyage et apprentis aussi ; une personne absente part tout de suite ; une formation pas encore commencée est remboursée)*. **Le patron ne peut pas être renvoyé** : il n'a pas ce bouton.
- Toucher « Renvoyer » ouvre une **confirmation** : « Veux-tu vraiment renvoyer … ? », avec ce qui va se passer et deux boutons, « Oui, renvoyer … » et « Non, garder … ».
- **Pendant le service** (restaurant ouvert, journée pas finie), il est **impossible de laisser la salle ou la cuisine vide**. Si c'est la dernière personne de son poste (le patron compte), un message court l'explique : « Impossible de renvoyer … : la cuisine serait vide pendant le service. Recrute quelqu'un ou passe le patron en cuisine d'abord. »
- **Hors service** (avant la première ouverture, ou restaurant fermé faute d'équipe), on peut renvoyer n'importe quel employé. Si un poste se retrouve vide, le restaurant reste fermé jusqu'au prochain recrutement (ou jusqu'à un intérimaire).
- **En plein service**, la personne renvoyée **finit sa tâche en cours, puis part** :
  - en salle, elle termine ce qu'elle fait (commande, plat, addition ou table à débarrasser) et ne prend plus rien d'autre ;
  - en cuisine, elle termine les commandes qu'elle a sur le feu et n'en prend plus de nouvelles ;
  - si elle n'a rien en cours, elle part tout de suite.
- Le volet affiche « Renvoyé(e) : finit sa tâche en cours, puis part. » Le journal note le renvoi, puis le départ.
- Une personne renvoyée ne compte plus pour tenir un poste, ni dans l'effectif, ni dans le coût des salaires. Elle ne revient pas parmi les candidats.
- **Indemnité de renvoi** *(v0.7)* : rien pendant les **30 premiers jours** (période d'essai) ; ensuite **3 jours de salaire** (règle de Chez YaYa) ; à partir de **8 mois** d'ancienneté, on ajoute l'indemnité de la loi (1/4 de mois de salaire par année d'ancienneté). Elle est payée tout de suite, affichée avant de confirmer, et un intérimaire n'en a pas. En plein service, la journée de la personne renvoyée lui est aussi payée. On peut toujours renvoyer, même si la caisse est vide.

### Le travail en salle
- Les personnes en salle (patron compris) choisissent seules quoi faire, dans cet ordre : 1) apporter un plat prêt, 2) apporter l'addition, 3) prendre une commande, 4) débarrasser. À priorité égale, elles servent celui qui attend depuis le plus longtemps.
- Temps de base de chaque geste : prendre une commande 1,5 min, prendre le plat à la passe 0,3 min, poser le plat 0,5 min, addition 1,5 min, débarrasser 1 min par table.
- La **vitesse** change la marche et les gestes : × (0,8 + 0,04 × vitesse). Une vitesse de 5 donne la vitesse normale, 10 va 20 % plus vite, 1 va 16 % moins vite.
- *(v0.6)* Quand un **responsable de salle** travaille, toute la salle va **5 %** plus vite. Quand un **barman** travaille, les boissons sont prêtes au bar : le serveur met 0,3 × (1,25 − 0,05 × vitesse du barman) du temps habituel par boisson (9 s → environ 2 s).
- À l'écran : rond noir cerclé de jaune avec un tablier blanc ; **le patron est en rouge foncé**. Ils portent une assiette ou une note quand ils servent.

### Le travail en cuisine
- Chaque personne en cuisine (patron compris s'il y est) prépare **2 commandes à la fois** ; **l'apprenti 1 seule** *(v0.6)*. Les autres attendent leur tour, dans l'ordre d'arrivée.
- Durée d'une commande : 12 à 18 min × (1,25 − 0,05 × vitesse). Une vitesse de 5 donne la durée normale, 10 va 25 % plus vite.
- *(v0.6)* **Plonge** : sans plongeur au travail, les cuisiniers font la vaisselle et vont **15 % moins vite**. Avec des plongeurs, ce retard baisse selon leur vitesse (vitesses additionnées ; à 8 ou plus, plus aucun retard ; un plongeur à 5 laisse 6 %).
- À l'écran : rond blanc avec une toque, cerclé d'orange quand la personne cuisine (rouge foncé pour le patron).

### Effet des qualités des employés *(v0.6)*
Chaque fiche (onglet Équipe › « Fiche ») montre les qualités et ce qu'elles changent. Fichier : `donnees/equipe.json` (`effets`).

| Qualité / poste | Effet |
|---|---|
| Vitesse (tous) | Salle : marche et gestes ; cuisine : durée des plats ; bar : préparation des boissons ; plonge : vaisselle ; nettoyage : ménage du soir |
| Sens du service (salle) | Les clients donnent une note (étoiles) qui décide du pourboire : + 0,08 étoile par point au-dessus de 5 (moyenne de ceux qui ont pris la commande et apporté l'addition), − 0,08 par point en dessous |
| Qualité (cuisine) | Cuissons ratées : 16 % − 1,8 % par point (entre 1 et 15 %) |
| Qualité (nettoyage) | Ménage du soir mieux fait |
| Chef de cuisine présent | **+1 en qualité** pour les autres cuisiniers ; s'il n'est pas là, le **second** donne ce +1 |
| Responsable de salle présent | Salle 5 % plus rapide et + 0,15 étoile pour chaque table |
| Barman présent | Boissons préparées au bar (voir « Le travail en salle ») |
| Plongeur présent | La cuisine ne ralentit pas (voir « Le travail en cuisine ») |
| Sommelier (formation) présent en salle ou au bar | Les clients prennent **45 % plus souvent du vin** (verre ou bouteille), comme dans l'ancien jeu |
| Apprenti | 1 commande à la fois |

- La personnalité ne change que les réponses à l'entretien et le salaire demandé.
- Dans la salle : les barmans sont dessinés derrière le comptoir du bar (en haut, près de la passe), rond noir cerclé de bleu avec un verre ; les plongeurs en bas de la cuisine, rond blanc cerclé de bleu. Les agents de nettoyage travaillent le soir, après la fermeture : ils ne sont pas dessinés.

### Propreté de la salle *(v0.6)*
- Une jauge de **0 à 100** (onglet Équipe ; 80 au départ). Chaque soir : − 0,12 par client servi, puis ménage : + 8 (l'équipe en fermant) + pour chaque agent de nettoyage au travail (4 + vitesse + qualité ; 14 pour un agent à 5 et 5).
- En dessous de **50** : chaque table perd jusqu'à 0,6 étoile (moins de pourboires), et un message le dit le matin. En dessous de **25** : jusqu'à 20 % des groupes font demi-tour en entrant.
- Un restaurant calme (Mayotte, Bretagne…) reste propre sans agent ; un restaurant plein (Paris, Tokyo, New York) a besoin d'un agent de nettoyage.

### Plannings et jours de repos *(v0.6)*
- Chaque employé a **2 jours de repos qui se suivent** chaque semaine (par exemple lundi et mardi). Le patron et les intérimaires n'en ont pas.
- À l'embauche, le jeu choisit les 2 jours qui gênent le moins : là où le moins de collègues du même service sont déjà en repos (à égalité, lundi-mardi, puis mardi-mercredi, mercredi-jeudi, jeudi-vendredi, dimanche-lundi, vendredi-samedi, samedi-dimanche).
- Onglet **Planning** : un tableau dit combien de personnes travaillent chaque jour en salle, au bar, en cuisine, à la plonge et au ménage (patron compris ; jour du jour surligné ; case rouge si la salle ou la cuisine est vide). Un message prévient des jours sans personne en salle ou en cuisine.
- Les boutons **◀ ▶** décalent les 2 jours de repos d'un jour. Le changement compte **dès le lendemain** (aujourd'hui ne change pas).
- Le matin, le Journal dit qui est en repos ou en formation. Un absent ne travaille pas et n'est pas dessiné. S'il n'y a plus personne en salle ou en cuisine, l'intérim automatique appelle un remplaçant (s'il est activé), sinon le restaurant ne peut pas ouvrir.

### Formations *(v0.6)*
- Onglet **Formations** › « Former » ouvre la fiche de l'employé avec les formations possibles :

| Formation | Pour qui | Prix | Effet |
|---|---|---|---|
| Rapidité | tous | 60 € × (vitesse + 1) | vitesse + 1 |
| Accueil et service | salle | 60 € × (sens du service + 1) | sens du service + 1 |
| Soin et qualité | cuisine, nettoyage | 60 € × (qualité + 1) | qualité + 1 |
| Sommellerie | salle et bar | 600 € (prix de l'ancien jeu) | devient sommelier (une seule fois) |

- On **paie à l'inscription** (l'argent baisse, le bilan du soir l'affiche). L'employé est **absent le prochain jour où il travaille** (il est en formation), et revient formé **le lendemain matin**. Une formation à la fois ; 10 au maximum pour une qualité.
- On peut **annuler** une formation qui n'a pas commencé : elle est remboursée.
- Après une formation, la note sur 10 devient la moyenne des 3 qualités (elle ne baisse jamais).

### La cagnotte des pourboires *(v0.6)*
- Les pourboires vont dans la **cagnotte de l'équipe**, **jamais dans ta caisse** (comme dans l'ancien jeu).
- **Le dernier soir de chaque mois**, elle est **partagée à parts égales** entre tous les employés de l'équipe, même ceux en repos ce jour-là. **Ni le patron ni les intérimaires** n'ont de part. Les centimes qui ne se partagent pas restent pour le mois suivant.
- Onglet **Cagnotte** : le montant, la date du prochain partage, ce que chacun toucherait, les 6 derniers partages, et ce que chaque employé a reçu. Le Journal et le bilan du soir annoncent le partage.

### Pas encore là
- Contrats (CDD, CDI, saisonniers), motivation, fatigue, départs volontaires : pas demandés pour cette étape.

## 4b. La carte et le paiement *(v0.4)*

Tout vient de l'ancien jeu (`bistrot/bistrot.html`, lu sans le modifier) et est rangé dans `donnees/catalogue.json` (les plats) et `donnees/carte.json` (les règles). L'outil `outils/extraction/extraire-carte.py` refait ce fichier.

### Les plats
- **20 classiques du bistrot** (soupe à l'oignon, œufs mayo, steak frites, bourguignon, blanquette, crème brûlée, tarte Tatin…) proposés partout.
- **Les spécialités de chaque lieu** : 616 au total sur les 44 lieux (par exemple pastéis de nata à Lisbonne, rougail saucisse à La Réunion). Elles portent le badge « Spécialité ».
- **Plats de saison** (v0.5) : 4 par lieu, voir §4c.

### Ta carte
- Au départ, la carte reprend celle de l'ancien jeu pour ce lieu (classiques + spécialités).
- Entre **2 et 6 entrées**, **3 et 9 plats**, **2 et 6 desserts** (limites de l'ancien jeu). Un message explique pourquoi on ne peut pas retirer ou ajouter un plat.
- Bouton **Carte** en haut : chaque plat montre son prix, le prix conseillé, le coût et la marge. Boutons − / + : 50 centimes par appui (entre 1 € et 3 fois le prix conseillé). Toucher un plat ouvre sa **fiche**.
- **Prix conseillé** = prix de référence de l'ancien jeu × coefficient du lieu (Paris × 1,2), arrondi à 50 centimes.
- **Coût matière** = ingrédients de la recette × prix d'achat du jour chez ton fournisseur habituel (§4c). Depuis la v0.5, l'argent est retiré **à l'achat** des produits, pas à la vente.
- **Marge brute** = prix − coût matière. La TVA n'est pas encore comptée : les recettes sont TTC.

### La fiche d'un plat
- Ingrédients, **allergènes** parmi les 14 obligatoires (seulement affichés : pas encore de client allergique).
- **Origine de la viande** : celle du fournisseur du lot en réserve (§4c).
- **Fait maison** : tous les plats le sont, comme dans l'ancien jeu (pas encore d'effet).
- **Cuisson** : seulement pour les pièces grillées ou rôties. Bœuf : bleu, saignant, à point, bien cuit ; agneau pareil ; veau et canard : saignant/rosé, à point, bien cuit ; porc et volaille : à point ou bien cuit. Les plats mijotés n'ont pas de question.

### Ce que commandent les clients
- Chaque client prend un **plat**, et parfois une **entrée** (4 sur 10) et un **dessert** (presque 1 sur 2). Moins souvent si c'est cher.
- Le choix du plat dépend de sa **popularité** (ancien jeu) et de son **prix** comparé au conseillé : un plat 2 fois trop cher est choisi environ 8 fois moins. Les touristes préfèrent les spécialités.
- Les cuissons demandées suivent les goûts de la région du monde (ancien jeu : plus de saignant en France, plus de bien cuit ailleurs).
- **Prix de la carte et affluence** : si ta carte est en moyenne plus chère que conseillé, il vient moins de monde : à 1,3 fois le prix conseillé, environ 40 % de clients en moins ; à 1,6 fois, environ 60 % en moins. Moins chère, il en vient un peu plus (au plus + 25 %, car les tables limitent vite).

### Cuisson ratée, plat renvoyé
- Un cuisinier rate une cuisson selon sa **qualité** : 14 % pour une qualité de 1, 2 % pour 8, jamais moins de 1 %. 2 fois sur 3, c'est trop cuit.
- Une cuisson ratée est **toujours renvoyée** : message, la table attend que le plat soit refait (en moitié moins de temps), le second est toujours réussi, et la matière est comptée deux fois.

### Paiement
- La table paie **à la fin du repas** (bouton « Voir le ticket » dans le détail d'une table). À la fermeture, ceux qui ont mangé paient aussi.
- **L'argent monte avec les recettes** et baisse quand tu achètes des produits (§4c). Depuis la v0.7, salaires, loyer, charges (et en Normal et Difficile cotisations et TVA) sont payés chaque soir (§6).
- **Pourboires** selon les usages du lieu (ancien jeu) : en France on laisse souvent la monnaie, aux États-Unis 15 à 20 %, **zéro à Tokyo, Pékin et Séoul**. Ils vont dans la **cagnotte de l'équipe**, pas dans ton argent (comme dans l'ancien jeu).
- La satisfaction (attente, plat renvoyé, prix) ne joue pour l'instant que sur le pourboire, pas encore sur la note du restaurant.
- Le **bilan de fin de journée** montre clients servis, recettes, ticket moyen par table, coût des produits utilisés, marge brute, plats renvoyés, pourboires, plat le plus vendu, et depuis la v0.5 : achats, recettes − achats, gaspillage, menus du jour, boissons et ruptures (avec leur cause).

## 4c. Stocks, fournisseurs, menu du jour et boissons *(v0.5)*

Données : `donnees/stocks.json` (réserve, fournisseurs, règles), `donnees/prix-gros.json` (prix d'achat et leurs sources), `donnees/catalogue.json` (plats de saison, menu du jour, boissons). Outil qui refait ces fichiers : `outils/extraction/extraire-stocks.py` (lit l'ancien jeu sans le modifier).

### Les prix d'achat (prix de gros)
- **Source** : mercuriales officielles du **MIN de Rungis**, publiées par le Réseau des Nouvelles des Marchés (**RNM, FranceAgriMer**). Séances du 2 au 12 novembre 2026, relevées le 25/11/2026. Copie des cotes utilisées : `outils/extraction/sources-prix/` (11 fichiers : fruits et légumes, découpes de viande, veau, agneau, gros bovins, volaille, porc, marée, filets, marée congelée, œufs).
- **23 produits** ont un prix calculé sur ces cotes (prix au kilo × poids d'une portion ; par exemple faux-filet 14,55 €/kg × 200 g = 2,91 € la portion ; poulet label 5,70 €/kg × 400 g = 2,28 €). Le détail de chaque calcul (libellé, prix, date de séance) est dans `prix-gros.json`.
- **31 produits non cotés à Rungis** (pain, jambon, fromage, épicerie, beurre, boissons…) gardent le prix de l'ancien jeu.
- **Saison** : un produit de saison coûte **15 % de moins**, hors saison **30 % de plus** (fruits, légumes, salades, herbes, pommes). Les mois sont inversés dans l'hémisphère sud (La Réunion, Mayotte, Nouvelle-Calédonie, Canberra…).
- Tous les prix sont × le coefficient « prix » du lieu (Paris × 1,2). Le jeu reste hors ligne : aucun prix n'est téléchargé pendant la partie.

### Les fournisseurs (repris de l'ancien jeu)
| Fournisseur | Prix | Livré en | Livraison | Qualité | Viande (France) |
|---|---|---|---|---|---|
| 🧺 Marché | +20 % | 2 h | 8 € | 4,6/5 | France |
| 🚚 Grossiste (habituel) | prix de base | 8 h | 25 € | 3,4/5 | Union européenne |
| 🏷️ Discount | −22 % | 1 jour | 12 € | 2,2/5 | Hors UE |
| 🌾 Bio | +45 % | 12 h | 15 € | 5/5 | France, Label Rouge |
- Chaque lieu a ses propres noms de fournisseurs et ses origines (ancien jeu). Le bio ne vend ni poisson, ni café, ni alcool.
- **Qualité** : un produit du marché ou du bio se garde **1 jour de plus** ; du discount, **1 jour de moins**.
- **Offres** : chaque soir, 2 ou 3 offres pour le lendemain (−15 à −40 % sur un produit chez un fournisseur). Elles servent au menu du jour et à la commande automatique.
- **Payer** : l'argent est retiré **au moment de la commande** (produits + livraison). Rien n'est remboursé.

### La réserve
- 3 rangements : **chambre froide** (1 000 portions : viande, poisson, laitages, légumes frais), **congélateur** (200 : glaces, fruits de mer surgelés), **étagères** (2 000 : pain, épicerie, pommes de terre, boissons).
- Chaque livraison forme un **lot** avec sa **date limite** (durées de l’ancien jeu : pain et poisson 2 jours, viande et légumes 5, crème et œufs 9, fromage 16, surgelés 180…). On utilise toujours le lot le plus ancien d'abord.
- **Gaspillage** : chaque matin, les lots qui ont dépassé leur date limite sont **jetés** (message + bilan). Leur prix est perdu.
- Une commande qui ne rentre pas dans la réserve est réduite.
- Au tout début, les **premières courses** (2 jours de besoins) sont livrées et payées avant l'ouverture (sans frais de livraison).

### Commander
- Bouton **Stocks** → onglet **Commander** : choisis le fournisseur, règle les quantités (de 5 en 5) ou touche « Proposer les quantités », puis « Commander et payer ». Le jeu dit à quelle heure ça arrive.
- **Commande automatique** (onglet Réglages) : **activée par défaut en Facile seulement**. Chaque soir, elle rachète ce qu'il faut pour **1 jour** (produits qui se gardent 3 jours ou moins), **2 jours** (jusqu'à 16 jours) ou **4 jours** (le reste), **+ la marge de sécurité** (15 % par défaut, de 0 à 50 %), moins ce qui sera encore bon demain et ce qui est déjà en route. Elle ajoute ce qu'il faut pour le menu du jour prévu le lendemain. Elle passe par le fournisseur habituel (réglable), ou par une offre moins chère si elle arrive à temps. Livraison avant l'ouverture.
- **Prévision des ventes** : moyenne des 3 derniers jours (en comptant les clients refusés pour rupture), jamais moins de 70 % de ce que la carte laisse prévoir.

### Ruptures
- Quand il manque un ingrédient, le plat (ou la boisson) **disparaît de la carte** pour les clients suivants, avec un message qui dit **pourquoi** : commande en route (avec l'heure), rien commandé (commande automatique coupée), dernière commande trop petite, réserve pleine, ou plus de ventes que prévu.
- Le client choisit autre chose. **S'il n'y a plus rien à manger**, la table repart sans manger (message).
- Le plat revient tout seul à la livraison. Le bilan liste les ruptures du jour et leur cause.

### Plats de saison
- **4 par lieu**, repris de l'ancien jeu (par exemple à Paris : asperges en mars-mai, tomates et burrata en juin-août, omelette aux cèpes en septembre-novembre, petit salé en décembre-février).
- Ils ne sont proposés **qu'à leurs mois** : au changement de mois, ceux qui ne sont plus de saison quittent la carte et les nouveaux prennent la place libre (sinon un message propose de les ajouter). Les clients les choisissent **25 % plus souvent**.
- Le calendrier commence le jour de création de la partie (jour 1 = cette date). La date du jour est affichée dans les Stocks et le menu du jour.

### Menu du jour
- Composé **chaque matin** automatiquement (entrée, plat, dessert) parmi les plats du jour de l'ancien jeu : 6 propres au lieu + 37 classiques du bistrot en France. On choisit d'abord ce qui **doit être écoulé** (date limite proche), puis les **offres** des fournisseurs, puis la saison. Le jeu dit pourquoi chaque plat a été choisi.
- **Formules** : entrée + plat 17 €, plat + dessert 17 €, entrée + plat + dessert 22 € (× coefficient du lieu), réglables de 50 en 50 centimes. Environ 1 client sur 3 le prend (moins s'il est cher).
- **30 portions sur place** au plus, et **jusqu'à 8 à emporter** (payées tout de suite, vendues entre 11 h 30 et 13 h 30 puis 18 h 30 et 20 h 30). Moins si la réserve ne suffit pas : le menu ne prend jamais ce dont la carte a besoin (80 % de ce qu'elle vend d'habitude), et depuis la v0.5.1 l'entrée, le plat et le dessert doivent **tous** être faisables pour chaque menu compté. Pas assez de produits → pas de menu ce jour-là (message).
- On peut le couper (Carte → Menu du jour).

### Modifier le menu du jour *(v0.5.1, demande de Yann)*
- Carte → Menu du jour : chaque place (entrée, plat, dessert) a un gros bouton **« Changer »**. Il ouvre la liste des plats du menu du jour de ce lieu :
  - en **vert** : assez de produits pour au moins 8 menus (le nombre de menus possibles est écrit) ;
  - en **orange** : faisable, mais moins de 8 menus, avec les ingrédients qui manquent ;
  - en **gris** : impossible, avec les ingrédients qui manquent. Si on le touche, un message rouge explique pourquoi et propose de commander dans Stocks ; le menu ne change pas.
- On peut aussi choisir **« Pas d'entrée »** ou **« Pas de dessert »** (le menu devient « plat + dessert » ou « entrée + plat »). Le **plat est obligatoire**.
- Le calcul tient compte des autres plats du menu et de ce que la carte garde pour elle.
- Changer en cours de journée est permis : les menus déjà vendus restent vendus, et le nombre de menus restants est recalculé (30 sur place et 8 à emporter au plus sur la journée).
- **« Revenir au menu proposé »** remet la proposition automatique du matin (la même, sans nouveau tirage).
- **Prix** : les formules se règlent toujours de 50 en 50 centimes ; un bouton « Revenir aux prix conseillés » apparaît quand un prix a été changé. Les prix choisis restent d'un jour à l'autre ; le choix des plats ne vaut que pour la journée (chaque matin, nouvelle proposition automatique).
- Si un ingrédient vient à manquer pendant la journée, un avertissement rouge s'affiche sous le plat concerné et le menu ne se vend plus jusqu'à ce que tu changes ce plat ou que la commande arrive.
- Le menu du jour prévu pour le lendemain (et commandé le soir par la commande automatique) reste le menu automatique.
- La sauvegarde garde le choix (format toujours 5) ; une partie de la v0.5 se relit sans changement.

### Boissons
- **18 boissons de base** (café, vins, bière, sodas, jus, eau, kir, spritz, cidre, cappuccino…) dont 4 de saison (vin chaud et lait de poule l'hiver, citronnade et thé glacé l'été), + **5 boissons du lieu** (dont une bouteille de vin et une bière en bouteille). Entre 3 et 20 à la carte.
- Les clients prennent parfois un apéritif, souvent un verre de vin ou une boisson fraîche, un café ou un thé à la fin ; certaines tables prennent une bouteille. Moins si c'est cher.
- Les boissons sont **servies par la salle avec les plats**, ce qui ajoute un petit temps de service (9 secondes par boisson, environ 2 secondes quand un barman travaille, *v0.6*). Elles consomment le stock (café, vin, bière…) comme les plats.

## 5. Les lieux

- Les **44 lieux** de l'ancien jeu sont repris tels quels : 14 en France, 7 en Outre-mer et 23 capitales du monde. Fichier : `donnees/lieux.json`.
- Chaque lieu a ses vraies particularités, reprises de l'ancien jeu :
  - **affluence** (Paris × 1,3 ; Tokyo × 1,45 ; Mayotte × 0,75…), **noms des clients**, **prix conseillés**, **spécialités**, **pourboires**, **salaires**, **loyer** et **charges** (v0.4 à v0.7) ;
  - **climat** (lu dans la description du lieu, comme l'ancien jeu : tropical, continental, méditerranéen…, saisons inversées dans l'hémisphère sud) ;
  - **saison touristique** (« pic en été », « toute l'année », « faible »…) qui change la part de touristes et l'affluence ;
  - **calendrier** : jours fériés de France, de l'Outre-mer (abolition de l'esclavage, etc.) ou du pays, **vacances scolaires** (zones A, B, C en métropole, calendriers locaux ailleurs), **fête locale** et **fête nationale** avec leurs plats, nouvel an chinois et Chuseok en Asie.

## 5b. Météo, calendrier et événements *(v0.8, étape 6)*

### Le bouton Calendrier (en haut à droite)
- Il montre la **météo du jour** (☀️ ⛅ 🌧️ ❄️ et la température), la **date** et ce qui se passe (férié, fête, vacances, menu de fête, événement privé). Une pastille rouge dit combien de choses attendent ta réponse.
- Il ouvre le volet **Calendrier et météo** (le jeu se met en pause) avec 4 onglets :
  - **Aujourd'hui** : clients attendus par rapport à un jour ordinaire (« +12 % ») et **pourquoi** (jour de la semaine, météo, touristes, vacances, férié, fête, match…), ce que les clients vont commander, la part de touristes.
  - **7 jours** : météo prévue, clients attendus et ce qu'il faut noter, pour la semaine.
  - **Le mois** : grille du mois (◀ ▶ pour changer), fériés en rouge, vacances en vert, météo des 15 prochains jours.
  - **Fêtes et événements** : menus de fête et événements privés à traiter.
- À la fin de la journée, une ligne « Demain » donne la météo et l'affluence prévues.

### Affluence : ce qui la change (repris de l'ancien jeu)
- **Jour de la semaine** : lundi et mardi × 0,95 · mercredi × 1 · jeudi × 1,08 · vendredi × 1,18 · samedi × 1,28 · dimanche × 1,05.
- **Météo** : soleil × 1,05 · nuages × 1 · pluie ou neige × 0,92.
- **Vacances scolaires** : + 3,5 % par zone en vacances (une seule zone hors métropole).
- **Jour férié** : midi × 1,2, soir × 0,9 (et × 0,8 en plus le 1er janvier et à Noël). **Fête des mères et des pères** : midi × 1,15, soir × 1,1. **Saint-Valentin** × 1,1.
- **Touristes** : selon la saison touristique du lieu, × 1,35 en pleine saison, × 1,15 toute l'année, × 1,05 sinon, × 1 si le tourisme est faible (comparé à Paris).
- La **part de touristes** parmi les groupes suit la formule de l'ancien jeu (plus en vacances et en pleine saison, au plus 35 %). Les **familles** sont plus nombreuses en vacances, les jours fériés à midi et pour la fête des mères et des pères.
- La **commande automatique** tient compte de l'affluence prévue pour le lendemain (moins de commandes avant un lundi pluvieux, plus avant un samedi de vacances).

### Météo et commandes des clients *(choix de Bistrot, voir PRIORITES)*
- La météo est tirée pour chaque jour et chaque lieu à l'avance : la prévision est donc toujours juste.
- **Il fait chaud** (22° ou plus, ou soleil à 19° ou plus) : les plats frais (salade, tartare, gaspacho…) sont choisis 1,5 fois plus, les plats chauds (soupe, gratin, pot-au-feu…) 0,7 fois ; boissons fraîches × 1,3, chaudes × 0,6.
- **Il fait froid ou il pleut** (11° ou moins, ou pluie) : l'inverse (boissons chaudes × 1,3, fraîches × 0,8).
- Le genre d'un plat (frais, chaud ou rien) est lu dans son nom, comme l'ancien jeu le faisait pour le menu du jour.

### Menus de fête (repris de l'ancien jeu)
- **7 jours avant** chaque fête (Noël, Saint-Valentin, Pâques, fête des mères, 14 juillet, fête locale, nouvel an chinois…), le chef propose un menu de 2 ou 3 plats. Tu réponds **Oui** ou **Non** dans le volet (onglet Fêtes et événements).
- Si tu dis oui, ces plats sont à la carte **pendant la fête**, **en plus** de ta carte (ils ne comptent pas dans les limites 6/9/6), au prix conseillé, que tu peux changer dans Carte. Ils portent un badge « Fête ». Sans réponse, rien n'est ajouté.

### Événements du jour (repris de l'ancien jeu, tous actifs depuis la v0.8.1)
- Chaque matin à partir du jour 4, il y a **42 % de chances** qu'un événement soit tiré parmi les 13 de l'ancien jeu (chacun a un délai avant de pouvoir revenir). Un événement impossible ce jour-là n'arrive pas (pas de pluie battante sans pluie, pas de malade si personne ne peut le remplacer…).
- Une fenêtre s'ouvre au milieu de l'écran, avec de gros boutons qui disent l'effet, et le jeu se met en pause jusqu'à ta réponse. Les dépenses vont dans le poste « Événements (écran, amendes, réparations…) » du bilan ; la promo va dans « Achats ». Les effets en cours (panne, grève, hausse de prix) sont rappelés dans Calendrier → Aujourd'hui.
- Les 13 événements :
  - 🚌 **Bus de touristes** : accueillir le groupe (5 groupes pressés arrivent d'un coup) ou refuser.
  - ⚽ **Grand match ce soir** (le sport du lieu) : installer un écran (150 €, + 60 % de clients le soir) ou ne rien faire (+ 20 % quand même).
  - 🌧️ **Pluie battante** (seulement un jour de pluie) : − 20 % de clients pour la journée.
  - 🥵 **Canicule** (seulement à 25° ou plus) : louer un climatiseur (180 €, − 8 % de clients pendant 3 jours) ou ouvrir les fenêtres (− 15 %).
  - 🧑‍⚕️ **Inspection sanitaire** *(v0.8.1)* : nettoyage express (80 €, propreté + 25) ou le recevoir tel quel. Puis le résultat selon la propreté de la salle : **75 ou plus** = félicitations, + 5 % de clients pendant 5 jours ; **50 à 74** = rien ; **30 à 49** = amende de 250 € ; **sous 30** = amende de 800 € et − 5 % de clients pendant 5 jours.
  - 🧐 **Critique gastronomique** *(v0.8.1)* : il arrive seul ; tu peux lui offrir l'apéritif (20 €). Sa note = la note habituelle du repas − 0,35 (il est exigeant), + 0,4 avec l'apéritif. **4 ★ ou plus** : + 10 % de clients pendant 7 jours ; **moins de 3 ★** (ou s'il repart sans manger) : − 10 % pendant 7 jours ; entre les deux, rien.
  - 🔧 **Panne** *(v0.8.1)* : le **four** (la cuisine va presque 2 fois moins vite, × 1,82) ou le **réfrigérateur** (les produits frais perdent 1 jour de fraîcheur de plus chaque matin). Réparer tout de suite (180 à 420 €) ou bricoler (gratuit, panne aujourd'hui et demain).
  - ✊ **Grève chez un fournisseur** *(v0.8.1)* : pendant 2 ou 3 jours, impossible de lui commander, et ses livraisons en route arrivent à la fin de la grève. La commande automatique passe par le fournisseur le moins cher qui reste.
  - 📸 **Influenceuse** *(v0.8.1)* : lui offrir le repas (40 €, + 25 % de clients pendant 4 jours) ou rien (+ 8 % pendant 4 jours, elle parle quand même de toi).
  - 💬 **Demande d'augmentation** *(v0.8.1)* : un employé demande 8 € de plus par jour. Accepter = + 1,44 € de l'heure sur son salaire ; refuser = 1 chance sur 5 qu'il démissionne (il part le soir, après le service).
  - 🏷️ **Promo grossiste** *(v0.8.1)* : un lot de 30 portions (bœuf, paleron, poisson, jambon ou fromage) à − 40 %, livré tout de suite. Le lot est réduit s'il n'y a pas assez de place dans la réserve.
  - 📈 **Flambée des prix** *(v0.8.1)* : un produit (bœuf, poisson, fromage, jambon, vin, café ou crème) coûte 30 % plus cher à l'achat pendant 5 jours.
  - 🤒 **Employé malade** *(v0.8.1)* : il reste chez lui aujourd'hui (toujours payé) et revient demain. Il n'est choisi que si son service reste tenu par quelqu'un (ou par l'intérim automatique).

### Événements privés (repris de l'ancien jeu, en plus simple)
- À partir du jour 4, environ **1 jour sur 9** (1,5 fois plus de mai à septembre), un client appelle pour un **anniversaire**, une **réunion de famille**, un **séminaire**, un **repas de mariage** ou le repas de fête du lieu, 1 à 4 semaines plus tard, à midi ou le soir.
- Le chef propose un menu pris **dans ta carte**. Tu vois le coût par personne et un prix conseillé, tu règles le prix (− / +) et tu proposes :
  - prix dans le budget du client : **réservé** ;
  - un peu trop cher (jusqu'à 20 % de plus) : le client fait une **contre-offre** (accepter ou refuser) ;
  - beaucoup trop cher : il demande de revoir le prix, puis abandonne au 2e refus.
- Tu as 3 jours pour répondre. À l'accord, le client verse **30 % d'acompte** ; le reste est payé à la fin de l'événement.
- Le jour J, des tables sont **gardées une heure avant** (étiquette « réservé ») : plus personne ne s'y assoit. À l'heure dite, les invités s'installent (étiquette « événement »), puis partent à la fin en payant le reste. Les produits du menu sont pris dans la réserve (la commande automatique les prévoit la veille).
- Avec 32 places, au plus 19 invités : les mariages (30 personnes et plus) deviennent des réunions de famille.

## 6. L'argent et les niveaux *(v0.7, étape 5)*

Fichier : `donnees/argent.json`. Tout ce qui coûte chaque mois est **payé chaque soir, au jour le jour** (le montant du mois divisé par 30,42), pour que l'argent ne tombe jamais d'un coup.

### Trois niveaux, choisis au lancement (Facile par défaut)

| | Facile | Normal | Difficile |
|---|---|---|---|
| Caisse au départ | 600 000 € | 40 000 € | 15 000 € (petit apport) |
| Local | propriétaire, pas de loyer | locataire | locataire |
| Prêt de la banque | non | non | 80 000 € à 5 % sur 5 ans (≈ 1 510 €/mois), qui a servi à acheter le restaurant : il n'est pas dans la caisse |
| Salaires (grille HCR × lieu) | payés | payés | payés |
| Cotisations sur les salaires | non | 25 % | 25 % |
| TVA | non | 10 % | 10 % |
| Charges courantes | oui | oui | oui |
| Concurrence | normale | normale | les concurrents prennent 20 % des clients |
| Intérim et commande automatiques au départ | oui | non (option) | non (option) |

- Une partie commencée avant la v0.7 reste en **Facile**.
- Le niveau s'affiche dans le volet Argent et sur le bouton « Continuer » de l'accueil.

### Loyer (Normal et Difficile)
- Loyer par an ≈ **4,8 % de la valeur du local** du lieu (valeurs reprises de Chez YaYa), pour un bistrot de 32 places d'environ **90 m²**.
- Exemples par mois : Paris 6 000 € (800 €/m²/an), Île-de-France 2 800 €, Bretagne et La Réunion 1 280 €, Mayotte 720 €, New York 10 000 €, Tokyo 8 000 €.

### Charges courantes (tous les niveaux)
- Par mois, multipliées par le coefficient « prix » du lieu : électricité 950 €, gaz 400 €, eau 250 €, assurances 300 €, entretien et réparations 250 €, frais de banque 60 € (Paris × 1,2 ≈ 2 650 € par mois, ≈ 87 € par jour).

### Salaires, cotisations, TVA
- **Salaires** : grille officielle HCR (§4) × coefficient du lieu, 39 h par semaine, payés chaque soir (repos compris). **Intérimaires** : payés le soir de leur journée (7 h 53). Le patron ne se paie pas.
- **Cotisations** (Normal et Difficile) : 25 % des salaires des employés, en moyenne pour des salaires proches du minimum après la réduction générale. L'intérim est facturé tout compris (+ 30 %, §4).
- **TVA** (Normal et Difficile) : les prix de la carte sont TTC ; chaque soir, **10 %** des recettes hors taxe reviennent à l'État (sur 110 € payés, 10 €).

### Découvert et faillite (claire et pas brutale)
- La caisse peut passer **sous zéro**. On peut encore commander des produits jusqu'à **5 000 € sous zéro** (découvert de la banque) ; les formations, elles, demandent d'avoir l'argent.
- Chaque soir sous zéro, le bilan affiche une **alerte rouge** : « Soir 2 sur 7 : encore 5 soirs sous zéro et c'est la faillite », avec des conseils. Le volet Argent le rappelle aussi. Dès qu'un soir finit au-dessus de zéro, le compteur repart à zéro.
- **Faillite** : si la caisse reste sous zéro **7 soirs de suite**. Un écran explique pourquoi : le montant, les recettes et la perte des 7 derniers jours, et les 3 plus grosses dépenses.
- **La sauvegarde n'est jamais perdue** : la partie en faillite reste enregistrée (on peut la revoir depuis l'accueil) et une copie est gardée à part (`bistrotjeu.test.copie-faillite`). On peut recommencer une nouvelle partie quand on veut.

### Bilans
- **Bilan du soir** : 3 gros chiffres (clients servis, bénéfice ou perte du jour, caisse), puis l'argent ligne par ligne (recettes, produits, salaires, intérimaires, cotisations, loyer, charges, TVA, prêt, indemnités, formations), puis le détail du service comme avant.
- **Bilan de la semaine** : tous les 7 jours de jeu (jours 1 à 7, 8 à 14…), sous le bilan du soir : clients, recettes, bénéfice ou perte de la semaine, les dépenses ligne par ligne, et la semaine d'avant pour comparer.
- **Volet Argent** (on l'ouvre en touchant la caisse, en haut à gauche) : onglets **Aujourd'hui** (l'argent du jour jusqu'ici, ce que coûte une journée, les 7 derniers jours), **Semaines** (la semaine en cours et les 8 dernières) et **Loyer et charges** (tout par mois, le prêt, les règles).
- Ce qui est payé la nuit, après le bilan (commandes, formations, renvois), compte pour le lendemain.

## 7. Messages et Journal

- Les messages s'affichent dans **leur propre zone, en haut à droite**. Elle ne recouvre jamais un bouton ni la salle.
- On voit au plus **3 messages** à la fois. S'il y en a plus, une ligne indique « +4 messages ». Chaque message disparaît seul après 6 secondes.
- Tous les messages restent lisibles dans le **Journal** (bouton en haut), du plus récent au plus ancien. Les 300 derniers sont gardés.

## 8. Sauvegarde

- La partie est **enregistrée toute seule** : toutes les 5 minutes de jeu, quand on ouvre un volet, en fin de journée, et quand on quitte l'appli.
- L'avant-dernière sauvegarde est gardée en secours. Si la dernière est abîmée, le jeu reprend la précédente.
- Chaque sauvegarde porte un **numéro de version** (actuellement 8). Quand une version change le format, elle sait convertir les anciennes sauvegardes.
- **Format 7 → 8 (Bistrot 0.8)** : la partie reprend exactement où elle était (même en plein service). Elle reçoit le calendrier (météo, fériés, vacances selon son lieu, à partir de sa date) ; aucune table n'est réservée ; les menus de fête des 7 prochains jours sont proposés le jour même. Rien d'autre ne change (argent, équipe, carte, stocks gardés).
- **Format 6 → 7 (Bistrot 0.7)** : la partie reprend exactement où elle était (même en plein service), **en Facile** (propriétaire, pas de prêt). Les salaires et les charges sont payés à partir du soir même. L'ancienneté des employés compte à partir de la mise à jour (période d'essai de 30 jours). Les comptes de la semaine démarrent le jour de la reprise.
- **Format 5 → 6 (Bistrot 0.6)** : la partie reprend exactement où elle était (même en plein service). Les barmans, plongeurs et agents de nettoyage « en attente de rôle » prennent leur poste ; chaque employé reçoit 2 jours de repos qui se suivent (personne n'est absent le jour de la reprise : les repos commencent le lendemain) ; la cagnotte garde son montant ; propreté 80 ; un candidat est ajouté pour chaque nouveau poste (barman, plongeur, nettoyage, apprenti) s'il reste une place.
- **Format 4 → 5 (Bistrot 0.5)** : une partie de la v0.4 reçoit les boissons de base à sa carte, un calendrier (jour 1 = date de création), et ses premières courses (payées). La commande automatique suit la règle Facile.
- **Format 3 → 4 (Bistrot 0.4)** : une partie de la v0.3 reçoit la carte de départ de son lieu, une cagnotte vide, et les tables déjà assises reçoivent leur commande.
- **Format 2 → 3 (Bistrot 0.3)** : une partie de la v0.2 reprend là où elle était. L'option d'intérim automatique prend la valeur par défaut (activée en Facile). Un employé nommé « Intérimaire » repris par erreur de l'ancien jeu (remplaçant d'un jour) est retiré.
- **Format 1 → 2 (Bistrot 0.2)** : une partie de la v0.1 est relue ainsi : le patron reste seul (Léa part), 8 candidats arrivent, et la journée en cours repart au matin, restaurant fermé jusqu'au recrutement. Le nom, le lieu, le jour, l'argent et le journal sont gardés. Une sauvegarde venant d'une version plus récente n'est jamais écrasée sans prévenir : un message demande de mettre le jeu à jour.
- **Cases séparées** sur le téléphone :
  - lien TEST : `bistrotjeu.test.partie` (+ `bistrotjeu.test.partie-precedente`, `bistrotjeu.test.reglages`, et depuis la v0.7 `bistrotjeu.test.copie-faillite`) ;
  - lien OFFICIEL : `bistrotjeu.officiel.partie`, etc.
  Un test ne peut donc jamais abîmer la vraie partie.

### Reprendre une partie de l'ancien jeu (Chez YaYa)
- L'ancien jeu et Bistrot sont sur la même adresse (yanndom61.github.io). Bistrot peut donc **lire** les parties de l'ancien jeu sur le même téléphone : les 5 emplacements (`bistrot_slot1` à `bistrot_slot5`) et la sauvegarde principale (`bistrot_save_v1`).
- Bistrot **ne modifie jamais et n'efface jamais** ces cases. Il fait une copie dans ses propres cases (`bistrotjeu.test.copie-ancien-jeu`).
- Bistrot reprend : le **nom** du restaurant, le **lieu**, le **jour**, l'**argent**, la **note** et **l'équipe**. La partie repart au matin de ce jour.
- **Équipe reprise** : chaque employé lisible garde son nom, son poste, sa note, sa vitesse, son sens du service, sa qualité, son expérience et sa personnalité. Les serveurs, commis de salle et responsables vont en salle ; les chefs, seconds, commis, aides et apprentis vont en cuisine. Les barmans vont au bar, les plongeurs à la plonge, les agents de nettoyage au nettoyage *(v0.6)*, et chacun reçoit 2 jours de repos qui se suivent. Le genre est déduit du prénom. Les intérimaires d'un jour de l'ancien jeu ne sont pas repris.
- Le salaire est **recalculé sur la grille officielle** (poste + expérience), car l'ancien jeu comptait autrement.
- Si l'ancienne équipe n'a personne en cuisine, le patron y passe. Si elle est vide, le restaurant reste fermé jusqu'au recrutement. **La carte est reprise** (v0.4) : chaque plat de l'ancienne carte qui existe dans Bistrot garde sa place et son prix (si le prix est raisonnable) ; ensuite la carte est ramenée aux limites 6/9/6 et complétée si besoin. Les plats de l'ancien jeu absents de Bistrot (saison, menu du jour, boissons) sont gardés dans la copie pour plus tard. **Les stocks sont repris** (v0.5) : quantités, dates limites (recalculées par rapport au jour repris ; ce qui est déjà périmé est jeté), prix payés, et les commandes en route sont livrées tout de suite (déjà payées dans l'ancien jeu). Si au moins un produit avait la commande automatique, elle est activée. Une partie sans stock lisible reçoit les premières courses. La réserve peut déborder après la reprise : rien n'est jeté, on ne peut juste pas commander dans ce rangement tant qu'il déborde. Les jours de repos de l'ancien jeu ne sont pas repris : ils sont choisis automatiquement (modifiables dans Planning). Le plan sera repris plus tard.
- Les anciennes sauvegardes testées vont de la version 9 à la version 11 de l'ancien format (Chez YaYa v8 à v10.2), dont une partie au « Jour 0 » sans équipe, et une partie à Tokyo.

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

## 10. Équilibre mesuré (simulateur, 30 jours, v0.8.1)

Joueur moyen : patron en salle + 1 serveur + 1 commis de cuisine, prix conseillés, **commande automatique** et **intérim automatique** activés (ils le sont d'office en Facile ; en Normal et Difficile, il faut activer ces options ou s'en occuper soi-même), partie commencée le 25 novembre (météo, calendrier et événements compris depuis la v0.8 : il dit oui aux menus de fête, propose le prix conseillé aux événements privés et répond un événement du jour sur deux ; depuis la v0.8.1, les 13 événements ont leur effet). Les jours de repos du commis, un commis intérimaire est appelé ; ceux du serveur, le patron sert seul. Pas d'agent de nettoyage.

**Bénéfice réel par jour** (celui du bilan du soir, après tout ce qui est payé) :

| Lieu | Facile | Normal | Difficile | Caisse au jour 30 (Facile / Normal / Difficile) |
|---|---|---|---|---|
| Mayotte | **516 €** | **343 €** | **218 €** | 615 000 € / 49 812 € / 21 053 € |
| La Réunion | **1 658 €** | **1 351 €** | **1 006 €** | 648 960 € / 79 772 € / 44 410 € |
| Bretagne | **1 069 €** | **824 €** | **551 €** | 631 465 € / 64 131 € / 30 934 € |
| Île-de-France | **1 397 €** | **1 049 €** | **683 €** | 641 090 € / 70 649 € / 34 694 € |
| Paris | **2 148 €** | **1 610 €** | **1 251 €** | 663 071 € / 86 947 € / 51 181 € |
| Tokyo | **2 267 €** | **1 659 €** | **1 348 €** | 666 743 € / 88 500 € / 54 170 € |
| New York | **2 853 €** | **2 081 €** | **1 610 €** | 683 695 € / 100 548 € / 61 403 € |

**Facile, les 44 lieux** (bénéfice réel par jour, 30 jours, v0.8.1) : tous bénéficiaires. Les plus serrés : Mayotte 516 €, Brasilia 635 €, Guyane 685 €, Dakar 751 €, Hauts-de-France 919 €, Canberra 924 € ; les plus forts : New York 2 853 €, Londres 2 558 €, Tokyo 2 267 €, Paris 2 148 €. Détail lieu par lieu dans `tests/resultat-simulation-30-jours.txt`.

- **Facile : un joueur moyen reste bénéficiaire partout** (contrôle automatique). Paris, par jour : recettes 3 198 €, produits 704 €, salaires 198 € + intérim 45 €, charges 87 €.
- **Normal : plus serré** (≈ 25 à 30 % de moins), mais encore bénéficiaire partout. Paris, en plus : loyer 197 €, cotisations 50 €, TVA 291 €, événements (écran, amendes, réparations…) 16 € par jour.
- **Difficile : encore plus serré** (≈ 35 à 60 % de moins que Facile) : 20 % de clients en moins, prêt (≈ 50 € par jour) et seulement 15 000 € en caisse au départ. **Les erreurs coûtent cher** (Difficile, 30 jours, par jour) :

| Erreur | Paris | Mayotte |
|---|---|---|
| Aucune (joueur moyen) | 1 251 € | 218 € |
| Prix de toute la carte 50 % trop hauts | 398 € | **−51 €** |
| Oublier de commander les produits | **−384 €** | **−328 €** |
| Embaucher tout le monde (16 employés) | **−183 €** | **−1 036 €**, faillite le jour 20 |

- Ce que le simulateur ne sait pas faire : un « très bon joueur ». Avec le moteur actuel, un 2e serveur ne fait pas gagner plus (la cuisine limite) ; la marge vient surtout d'une équipe à la bonne taille, de bons prix et de commandes régulières.
- **Équipe complète en Facile** (Paris, on embauche chaque candidat qui a une place) : 16/16 au bout de 20 jours ; 95 servis par jour, salaires ≈ 1 440 € par jour, **bénéfice réel ≈ 1 104 € par jour** (moins que le joueur moyen : une grosse équipe coûte cher).
- **Autres contrôles automatiques** : les salaires, l'intérim, le loyer et le prêt du soir sont exacts ; indemnités (0 € en période d'essai, 3 jours de salaire après, loi après 8 mois) ; faillite seulement après 7 soirs sous zéro avec une alerte chaque soir, partie relue avec la faillite ; le compteur repart à zéro quand la caisse remonte ; achats refusés au-delà du découvert ; bilan de la semaine = somme des 7 bilans du jour ; sauvegarde 0.6 reprise en plein service, en Facile ; *(v0.8)* 44 lieux contrôlés sur 2 ans (météo, fériés, vacances, touristes, affluence sans valeur absurde), samedi plus fort que lundi, saisons inversées au sud, 14 juillet férié à Paris et 22 mai en Martinique, plus de plats frais vendus les jours chauds (Provence : 38 % contre 14 % les jours froids), menus de fête et événements privés menés jusqu'au bout, sauvegarde 0.7 reprise en plein service ; *(v0.8.1)* chacun des 9 nouveaux événements déclenché avec chaque réponse et son effet vérifié (inspection, critique, panne, grève, influenceuse, augmentation et démission, promo, flambée, malade).
- **Effets mesurés** (Paris, 8 jours) : serveur aimable (9) ≈ 102 € de pourboires par jour contre ≈ 32 € (2) ; sommelier : 862 → 948 boissons ; propreté après 20 jours sans agent 36/100, avec un agent 100/100 ; chef ou second : +1 en qualité ; plongeur : cuisine × 1,15 → × 1,07 ; barman : 9 s → 2 s par boisson.
- Les recettes ont augmenté depuis la v0.4 (boissons et menu du jour) ; les achats font 20 à 29 % des recettes.
- **Menu du jour modifié** (contrôle automatique) : un plat faisable est accepté, un plat sans ingrédients est refusé avec la liste de ce qui manque, « pas de dessert » donne la formule entrée + plat, le plat est obligatoire, le choix tient dans la sauvegarde, et le lendemain un nouveau menu est proposé automatiquement.

**Ruptures expliquées** (Paris, 6 jours) : toutes les ruptures ont une cause affichée (contrôle automatique).

| Façon de jouer | Ruptures | Cause donnée |
|---|---|---|
| Commande automatique (Facile, 7 lieux, 30 jours) | 0 à 1,9 par jour | 126 fois « il s'en est vendu plus que prévu », 7 fois « la commande arrive à … » |
| Commande automatique sans marge de sécurité | 3 | « il s'en est vendu plus que prévu : augmente la marge » |
| Commande chaque soir au grossiste avec « Proposer les quantités » | 2 | « la dernière commande était trop petite » |
| Ne jamais commander | 107 (416 clients partis sans manger) | « rien n'a été commandé depuis hier » |

Autres contrôles : 300 pains achetés sans clients → jetés en 3 matins et payés quand même ; les fruits coûtent 0,64 € en mai contre 0,98 € en novembre (et 0,60 € à La Réunion en novembre, saisons inversées) ; au 1er juin, les asperges quittent la carte et les tomates-burrata arrivent.

Effet des prix à Paris (même équipe, 10 jours, moyenne par jour) :

| Prix de toute la carte | Clients servis | Recettes | Marge brute |
|---|---|---|---|
| × 0,7 | 104 | 3 033 € | 2 238 € |
| × 1 (conseillé) | 90 | 3 235 € | 2 593 € |
| × 1,3 | 65 | 2 466 € | 2 084 € |
| × 1,6 | 40 | 1 707 € | 1 460 € |

Selon l'équipe, à Paris (moyenne par jour) :

| Équipe | Servis | Repartis | Attente avant la commande |
|---|---|---|---|
| Patron seul en salle + 1 commis | 82 | 15 % | 5,5 min |
| Patron + 1 serveur + 1 commis | 86 | 7 % | 3 min |
| Patron + 2 serveurs + chef + commis | 95 | 8 % | 3 min |

Contrôles automatiques : chaque jour, l'argent bouge exactement de « recettes − toutes les dépenses du bilan », chaque client servi paie, aucun stock négatif, zéro pourboire là où ce n'est pas l'usage, les 44 cartes sont complètes. Les 7 anciennes parties de Chez YaYa se reprennent (stocks compris quand ils existent). Aucune valeur impossible, toutes les journées se terminent. Détail complet : `tests/resultat-simulation-30-jours.txt`.
