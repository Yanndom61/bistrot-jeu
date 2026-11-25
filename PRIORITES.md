# Priorités de Bistrot

On ne travaille que sur la colonne **Indispensable**, dans l'ordre. Toute nouvelle idée de Yann est rangée ici avec lui.

| Indispensable | Sympa | Un jour |
|---|---|---|
| ✅ 1. Salle lisible en paysage, clients qui arrivent et mangent, Pause/1×/2×/4×, écran portrait *(v0.1)* | Ambiance sonore (salle, cuisine, terrasse, pluie), sons libres de droits | Écran « caisse » et « tickets cuisine » |
| ✅ 1b. Retours de Yann : placement des clients par le joueur (option), départ seul avec recrutement *(v0.2)* ; effectif de 16, intérim, renvoi *(v0.3, en test)* | Images libres de droits (Kenney), style unique | Étoile au guide |
| ✅ 2. Carte des plats, prix et paiement des clients *(v0.4, en test)* | Contrôle d'hygiène surprise (type Alim'confiance) | |
| 3. Stocks, fournisseurs et vrais prix de gros (Rungis) | Fiches techniques des plats (grammages, coût matière) | |
| 4. Équipe complète : plannings, repos, contrats, formations, recrutement des barmans, plongeurs, nettoyage et apprentis, **les 16 postes tous recrutables** (décision de Yann), intérim pour les absences, effets du sens du service et de la qualité | Écran « Crédits et sources » | |
| 5. Argent : loyer, charges, paiement des salaires (et de l'intérim), indemnités de renvoi (à décider), 3 difficultés, bilan de fin de journée | | |
| 6. Lieux (effets complets), météo et calendrier | | |
| 7. Tutoriel progressif, mode d'emploi « ? », objectifs | | |
| 8. Avis clients, réputation | | |

## Décisions de Yann
- **Placement des clients** : automatique par défaut, avec une option pour les placer soi-même *(fait en v0.2)*.
- **Heures creuses** : pas de bouton pour les sauter. Le « Passer à demain » du cahier des charges n'est pas ajouté, sauf si Yann change d'avis.
- **Équipe** : même déroulement que Chez YaYa : on démarre seul avec le patron et on recrute dès le début *(première version simple en v0.2)*.
- **Effectif** : le même que dans Chez YaYa, 16 employés (salle 8, cuisine 6, nettoyage 2), plus les intérimaires *(fait en v0.3)*.
- **Intérim** : comme dans l'ancien jeu, en version simple ; automatique seulement en option, jamais par défaut en Normal et Difficile *(fait en v0.3)*.
- **Salaires** : payés avec l'étape « Argent », pas avant. Rien ne change d'ici là.
- **Version finale : les 16 postes seront tous recrutables** (salle, cuisine, bar, plonge, nettoyage, apprentis). À faire à l'étape 4 « Équipe ». En test, on recrute pour l'instant serveurs, commis de salle, responsable de salle, chef, second, commis et aide de cuisine.
- **Renvoyer** : possible dès maintenant *(fait en v0.3)*. Pas le patron, jamais la salle ou la cuisine vide en service, et en plein service la personne finit sa tâche puis part.

## Questions en attente pour Yann
- **Indemnités de renvoi** (pour l'étape « Argent ») : faut-il payer quelque chose quand on renvoie quelqu'un (par exemple selon son ancienneté), ou rester simple sans indemnité ?
- **Choix de la v0.4 à valider** (tous expliqués dans REGLES §4b) :
  - Limites de la carte 2-6 entrées, 3-9 plats, 2-6 desserts, prix réglés de 50 en 50 centimes, entre 1 € et 3 fois le conseillé.
  - Coût matière seulement affiché (pas retiré de l'argent) jusqu'aux stocks ; TVA pas encore comptée.
  - Une cuisson ratée est toujours renvoyée et refaite (pas de client qui « accepte » le plat).
  - Pourboires dans la cagnotte de l'équipe, pas dans ton argent. À quoi servira la cagnotte (partage avec l'équipe, motivation) ? À décider à l'étape « Équipe ».
  - Trop cher = moins de clients et moins de commandes ; pas encore d'effet sur la note du restaurant (étape 8 « Avis »).
  - Pas encore de plats de saison, menu du jour ni boissons : à quelle étape les veux-tu ?
