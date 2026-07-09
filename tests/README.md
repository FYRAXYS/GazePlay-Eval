# Tests utilisateurs


## Test du parcours principal de l’application (créer une évaluation de zéro) : 

- Sur l’écran d’accueil, cliquer sur le bouton **“créer une nouvelle évaluation”**.
- Changer le nom de l’évaluation. Dans le cas contraire, elle s’appellera **“Nouvelle évaluation”**. Laisser le format sur **“CSV & XLSX”**.
- Dans la liste d’informations, ajouter plusieurs champs. Les renommer et changer leur ordre. Si aucun champ n’est renseigné, l’évaluation associera automatiquement le nom du profil utilisé sur *Gazeplay-Learning* pour identifier l’évalué.e.
- Choisir le mode de création manuel. Concernant les paramètres globaux : 
  - des écrans de transition : Mettre un temps avant passage à l'écran suivant de <code>5.5 secondes</code> et mettre une croix de fixation.
  - des écrans d’instruction : Ajouter un média par défaut de type image et mettre un bouton avec une durée de fixation de <code>1.5 secondes</code>.
  - des écrans de stimuli : Définir la grille à <code>2</code> lignes et <code>3</code> colonnes. Mettre le nombre de stimuli à valider pour passage à l'écran suivant à <code>2</code>. Activer le placement des stimulis aléatoires.
- Créer 3 nouveaux écrans (un pour chaque type), et les renommer selon leur type (un d’instruction, un de transition, un de stimuli). Pour chaque écran, cliquer dessus et le modifier, en constatant que les paramètres globaux sont bien présents : 
  - écran de transition : augmenter le temps avant le passage à l’écran suivant à <code>8 secondes</code>.
  - écran d’instruction : garder les paramètres par défaut. Ajouter l’image [“gazeplay-mesange.png”](gazeplay-mesange.png).
  - écran de stimuli : garder les paramètres par défaut. Descendre jusqu’à la grille de stimuli et la modifier : 
    - cliquer sur la première cellule pour l’éditer. La définir comme étant une bonne réponse, ajouter l’image [“gazeplay-mesange.png”](gazeplay-mesange.png) et le son [“gazeplay-oiseau.mp3”](gazeplay-oiseau.mp3). Valider.
    - Dupliquer cette cellule dans une autre cellule.
    - Cliquer sur une autre cellule pour l’éditer. La laisser comme étant une mauvaise réponse, ajouter l’image [“gazeplay-rouge-gorge.png”](gazeplay-rouge-gorge.png).
    - Dupliquer cette cellule dans les autres cellules qui n’ont pas encore été modifiées.
- Télécharger l’évaluation pour GazePlay-Learning avec le bouton “Exporter pour GazePlay-Learning”. Cela vous permettra de continuer le test sur *GazePlay-Learning*.

- *Bonus : constater que l’avancée de l’évaluation est conservée si l’utilisateur recharge la page, la ferme ou quitte son navigateur.*


## Test de la sauvegarde/du chargement d’évaluation : 
- Ouvrir le menu latéral et se rendre sur la page de sauvegarde. Choisir un emplacement pour sauvegarder l’évaluation créée dans le test précédent. 
- Cliquer ensuite sur le bouton pour créer une nouvelle évaluation, ce qui ramène l’utilisateur à une autre page. Revenir ensuite à la page de sauvegarde, cliquer sur l’évaluation précédemment sauvegardée. Puis, cliquer sur le bouton pour la modifier. Accepter d’écraser la nouvelle évaluation et constater que le site est retourné à la dernière étape atteinte dans le précédent test.
- Ouvrir le menu latéral et se rendre sur la page de chargement. Constater que l’évaluation sauvegardée est en cours de modification. Cliquer dessus pour revenir à la dernière étape atteinte.


## Test d’importation d’évaluation : 
- Ouvrir le menu latéral et cliquer sur le bouton **“Importer”**.
- Dans la fenêtre qui s’ouvre, choisir le mode **“Sauvegarder”**. Choisir ensuite le fichier [“gazeplay-eval-import.gpSave”](gazeplay-eval-import.gpSave). Enfin, sélectionner un emplacement de sauvegarde non-occupé et cliquer sur **“Importer”**.
- Vérifier que le site nous amène bien sur une nouvelle évaluation appelée **“évaluation Importation”**.
