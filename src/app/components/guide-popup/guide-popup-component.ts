import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {Router} from '@angular/router';

interface GuideSection {
  title: string;
  body: string;
}

interface PageGuide {
  title: string;
  intro?: string;
  sections: GuideSection[];
}

@Component({
  selector: 'app-guide-popup',
  standalone: true,
  imports: [],
  templateUrl: './guide-popup-component.html',
  styleUrl: './guide-popup-component.css',
})
export class GuidePopupComponent {

  router = inject(Router);
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();

  panelWidth = 400;
  isResizing = false;

  private readonly minWidth = 280;

  // Guide affiché lorsque la page courante n'a pas de guide dédié.
  private readonly defaultGuide: PageGuide = {
    title: 'Guide',
    intro: "Aucune aide dédiée pour cette page pour le moment.",
    sections: [],
  };

  // Un guide personnalisé par page, indexé par le premier segment de l'URL.
  private readonly guides: Record<string, PageGuide> = {
    home: {
      title: "Accueil",
      intro: "Point de départ pour créer ou reprendre une évaluation.",
      sections: [
        {
          title: "Nouvelle évaluation",
          body: "Lancez la création d'une évaluation et laissez-vous guider pas à pas.",
        },
        {
          title: "Reprendre l'évaluation précédente",
          body: "Si une évaluation est en cours, reprenez-la là où vous vous étiez arrêté.",
        },
      ],
    },
    'info-eval': {
      title: "Informations de l'évaluation",
      intro: "Définissez les informations générales de votre évaluation.",
      sections: [
        {
          title: "Nom de l'évaluation",
          body: "Choisissez un nom clair : il identifiera votre évaluation dans GazePlay-Eval.",
        },
      ],
    },
    'info-participant': {
      title: "Informations sur le participant",
      intro: "Choisissez les informations à renseigner sur la personne évaluée.",
      sections: [
        {
          title: "Champs personnalisés",
          body: "Sélectionnez le type d'informations que vous souhaitez collecter lors de la passation.",
        },
      ],
    },
    'setup-eval': {
      title: "Configuration de l'évaluation",
      intro: "Mettez en place la structure de votre évaluation.",
      sections: [
        {
          title: "Écrans",
          body: "Organisez les écrans et leur disposition avant d'ajouter vos contenus.",
        },
      ],
    },
    'create-eval': {
      title: "Création des stimuli",
      intro: "Ajoutez et configurez les stimuli de chaque écran.",
      sections: [
        {
          title: "Médias",
          body: "Importez les images, sons, vidéos ou textes à présenter dans chaque case.",
        },
        {
          title: "Bonne réponse",
          body: "Indiquez pour chaque case si elle correspond à la bonne réponse attendue.",
        },
      ],
    },
    'download-eval': {
      title: "Téléchargement",
      intro: "Exportez votre évaluation pour l'utiliser dans GazePlay-Eval.",
      sections: [
        {
          title: "Export",
          body: "Téléchargez le fichier de l'évaluation une fois la création terminée.",
        },
      ],
    },
    sauvegarde: {
      title: "Sauvegardes",
      intro: "Gérez les sauvegardes de vos évaluations.",
      sections: [
        {
          title: "Enregistrer",
          body: "Sauvegardez votre progression pour la retrouver plus tard.",
        },
      ],
    },
    'load-save': {
      title: "Chargement",
      intro: "Rechargez une évaluation sauvegardée précédemment.",
      sections: [
        {
          title: "Charger une sauvegarde",
          body: "Sélectionnez une sauvegarde existante pour reprendre son édition.",
        },
      ],
    },
    option: {
      title: "Options",
      intro: "Personnalisez le comportement et l'apparence de l'application.",
      sections: [
        {
          title: "Préférences",
          body: "Ajustez les options disponibles selon vos besoins.",
        },
      ],
    },
  };

  // Guide correspondant à la page actuellement affichée.
  get currentGuide(): PageGuide {
    const segment = (this.router.url ?? '')
      .split('?')[0]
      .split('#')[0]
      .split('/')
      .filter(Boolean)[0] ?? 'home';

    return this.guides[segment] ?? this.defaultGuide;
  }

  close(): void {
    this.closed.emit();
  }

  startResize(event: MouseEvent): void {
    event.preventDefault();
    this.isResizing = true;

    document.addEventListener('mousemove', this.resize);
    document.addEventListener('mouseup', this.stopResize);
  }

  resize = (event: MouseEvent): void => {
    if (!this.isResizing) return;

    // Le panneau est ancré à droite : la largeur correspond à l'espace
    // entre la souris et le bord droit de la fenêtre.
    const newWidth = window.innerWidth - event.clientX;
    const maxWidth = window.innerWidth * 0.9;

    this.panelWidth = Math.min(Math.max(newWidth, this.minWidth), maxWidth);
  };

  stopResize = (): void => {
    this.isResizing = false;

    document.removeEventListener('mousemove', this.resize);
    document.removeEventListener('mouseup', this.stopResize);
  };
}