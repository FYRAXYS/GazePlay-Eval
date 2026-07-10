# GazePlay-Eval

Une extension Web de [GazePlay-Learning](https://gazeplay.github.io/GazePlay/fr) permettant de créer des évaluations personnalisés.

lien : [https://lig-gazeplay.imag.fr/#/home](https://lig-gazeplay.imag.fr/#/home)


## Description du projet
> [!TIP]
> Vous plus de détails sur la description du projet, vous pouvez consulter ce [rapport de stage](https://github.com/GazePlay/reports-and-presentations/blob/master/Reports/Simon_Favreau_Thomas_Peterschmitt_Rapport.pdf). Les explications suivantes en sont une synthèse.

GazePlay-Eval est une application web construite avec Angular 21. Le site est "monopage", ce qui signifie que seuls les composants graphiques (des menus, des boutons, ...) sont rafraîchis.

### Architecture

L'architecture du projet se présente sous la forme suivante : 
```
src/
├── app/
│   ├── components/
│   │   └── [des éléments de page réutilisés, comme les notifications ou la navbar]
│   ├── pages/
│   │   └── [des pages entières de l'application, comme la page de save ou le guide]
│   ├── services/
│   │   └── [regroupement de méthodes qui interagissent avec la partie métier]
│   ├── shared/
│   │   └── [le modèle, la structure des objets de l'application]
│   ├── app.config.ts
│   ├── app.css
│   ├── app.html
│   ├── app.routes.ts
│   ├── app.spec.ts
│   └── app.ts
├── assets/
│   ├── guide/images/
│   │   └── [images utilisés dans les guides]
│   └── icons/
│       └── [toutes les îcones utilisés dans le projet, en version claire et sombre]
├── index.html
├── main.ts
└── styles.css
tests/
├── [fichiers png, mp3, gpSave]
└── README.md
[...]
README.md
package.json
```

Comme expliqué ci-dessus, l'application se compose de "pages" qui sont elle-mêmes créées avec des components. La seule différence entre les deux est qu'un component peut être utilisé à plusieurs endroits différents, ce qui n'est pas le cas des pages.

Pages et Components sont structurés de la même façon : 

```
un-composant/
├── un-composant.component.css
├── un-composant.component.html
├── un-composant.component.spec.ts
└── un-composant.component.ts
```
```
une-page/
├── une-page.component.css
├── une-page.component.html
├── une-page.component.spec.ts
└── une-page.component.ts
```
- Le CSS contient le style spécifique au component ou à la page. Pour rappel, le projet utilise **Bootstrap**.
- Le HTML contient le "layout" de l'élément. C'est la vue modifiée dynamiquement par le fichier **TypeScript**.
- Le SPEC contient les tests unitaires de l'élément. Ils utilisent Jasmine (plus de détails dans la partie sur les tests).
- Le TS (TypeScript) correspond au View-Model. Il permet d'afficher la vue et de récupérer les actions utilisateurs pour utiliser les services.

Les services sont structurés d'une façon similaire : 

```
un-service/
├── un-service.service.spec.ts
└── un-service.service.ts
```

Les services contiennent toute la logique métier de l'application. Ils permettent d'interagir avec les évaluations, les options, ... Ils font partis du modèle.

L'architecture globale de l'application est donc en **MVVM** (Model-View, Vue, Modèle).

*les graphes ont été réalisés avec un [outil](https://gitlab.com/nfriend/tree-online) créé par Nathan Friend.*

## Stockage

GazePlay-Eval n'utilise aucun serveur pour stocker les données des utilisateurs. La solution utilise un mélange de [Local Storage](https://developer.mozilla.org/fr/docs/Web/API/Window/localStorage) et d'[IndexedDB](https://developer.mozilla.org/fr/docs/Web/API/IndexedDB_API) (abrégé IDB):

- Le Local Storage contient :
  - 3 emplacements pour les évaluations, appelés `save1`, `save2`, `save3`.
  - 1 emplacement pour la sauvegarde automatique, appelé `saveAuto`.
  - une liste des options.

- L'IDB contient :
  - toutes les pièces jointes utilisés dans une évaluation : des images, des sons, des vidéos, ...

Le format d'une évaluation (complétée) est le suivant : 

```js
{
    "nomEval": "évaluationImportation",
    "format": "Csv&Xlsx",
    "infoParticipant": [
        "Nom",
        "Prénom",
        "Âge"
    ],
    "globalParamsTransitionScreen": [
        true,
        15,
        true,
        true,
        1.2
    ],
    "globalParamsInstructionScreen": [
        true,
        6.5,
        true,
        "Image",
        true,
        1.2
    ],
    "globalParamsStimuliScreen": [
        2,
        4,
        true,
        40,
        1.5,
        3,
        true,
        true
    ],
    "listScreens": [
        {
            "name": "Ecran 1",
            "type": "instruction",
            "values": [
                true,
                6.5,
                true,
                "Image",
                "gazeplay-mesange.png",
                null,
                true,
                1.2,
                "évaluationImportation/gazeplay-mesange.png"
            ]
        },
        {
            "name": "Ecran 2",
            "type": "stimuli",
            "values": [
                2,
                4,
                true,
                40,
                1.5,
                "Tout",
                3,
                true,
                true,
                false,
                "",
                null,
                {
                    "0": {
                        "imageId": "évaluationImportation/gazeplay-rouge-gorge.png",
                        "imageName": "gazeplay-rouge-gorge.png",
                        "soundId": "",
                        "soundName": "",
                        "goodAnswer": true
                    },
                    "1": {
                        "imageName": "",
                        "soundName": "",
                        "goodAnswer": false,
                        "hidden": false
                    },
                    "2": {
                        "imageName": "",
                        "soundName": "gazeplay-oiseau.mp3",
                        "goodAnswer": false,
                        "hidden": false,
                        "soundId": "évaluationImportation/gazeplay-oiseau.mp3"
                    },
                    "3": {
                        "imageName": "gazeplay-mesange.png",
                        "imageId": "évaluationImportation/gazeplay-mesange.png",
                        "soundName": "",
                        "soundId": "",
                        "goodAnswer": false,
                        "hidden": false
                    },
                    "4": {
                        "imageName": "",
                        "soundName": "",
                        "goodAnswer": false,
                        "hidden": false
                    },
                    "5": {
                        "imageName": "gazeplay-mesange.png",
                        "soundName": "",
                        "goodAnswer": false,
                        "hidden": false,
                        "imageId": "évaluationImportation/gazeplay-mesange.png"
                    },
                    "6": {
                        "imageName": "",
                        "soundName": "",
                        "goodAnswer": false,
                        "hidden": false
                    },
                    "7": {
                        "imageName": "gazeplay-rouge-gorge.png",
                        "imageId": "évaluationImportation/gazeplay-rouge-gorge.png",
                        "soundName": "",
                        "soundId": "",
                        "goodAnswer": true,
                        "hidden": false
                    }
                },
                ""
            ]
        },
        {
            "name": "Ecran 3",
            "type": "transition",
            "values": [
                true,
                15,
                true,
                true,
                1.2
            ]
        }
    ],
    "step": 4,
    "createdAt": "2026-07-09T08:51:58.638Z",
    "version": 1
}
```

Vous pouvez remarquer que chaque pièce jointe (dans le cas de l'exemple, des images et des sons) possède un attribut `imageID` ou `soundID`. Etant donné que le Local Storage ne peut pas stocker de gros fichiers, il stocke simplement un chemin vers ce fichier qui est stocké dans l'IDB. Ce chemin est construit de la façon suivante : `nomEval/nomFichier` (de cette façon, on s'assure du critère d'unicité et on évite d'avoir des doublons, ce qui optimise le stockage).

> [!NOTE]
> Vous pouvez retrouver toute la logique de gestion de fichier de l'IDB dans le service [indexed-db.service.ts](src/app/services/indexedDB/indexed-db.service.ts).

## Tests

Pour lancer les tests sous IntelliJ Idea, vous pouvez lancer les commandes suivantes : 

```bash
ng test
```
--> Lance *Karma* (outil permettant de simuler un navigateur web) et déroule l'ensemble des tests.

```bash
ng test --code-coverage GazePlay-Eval 
```
--> créé (ou recharge) un dossier `coverage` dans le projet. Lancer le fichier `index.html` pour obtenir le taux de couverture des tests, de façon globale et sur chaque fichier.

## Tâches restantes

Les tâches restantes sont représentés par les Issues dans le projet. Des commentaires sont rajoutés pour apporter plus de contexte ou des propositions de solutions à mettre en place.

### Guide utilisateur : 
- [ ] [#56](https://github.com/Noars/GazePlay-Eval/issues/56)
- [ ] [#55](https://github.com/Noars/GazePlay-Eval/issues/55)
- [ ] [#51](https://github.com/Noars/GazePlay-Eval/issues/51)
- [ ] [#49](https://github.com/Noars/GazePlay-Eval/issues/49)

### Options : 
- [ ] [#50](https://github.com/Noars/GazePlay-Eval/issues/50)
- [ ] [#48](https://github.com/Noars/GazePlay-Eval/issues/48)

### Tests : 
- [ ] [#53](https://github.com/Noars/GazePlay-Eval/issues/53)
- [ ] [#52](https://github.com/Noars/GazePlay-Eval/issues/52)

### Autre : 
- [ ] [#54](https://github.com/Noars/GazePlay-Eval/issues/54)
- [X] [#47](https://github.com/Noars/GazePlay-Eval/issues/47) (techniquement déjà fait, mais une revérification serait bien)
- [ ] [#23](https://github.com/Noars/GazePlay-Eval/issues/23)
- [X] [#7](https://github.com/Noars/GazePlay-Eval/issues/7) (à faire au fur et à mesure de l'avancée du projet)

## Contact

En cas de besoin d'éclaircissement sur des parties spécifiques du code, vous pouvez envoyer un mail aux adresses suivantes : 

- *thomas.peterschmitt@gmail.com*
- *fyraxys2006@gmail.com*
