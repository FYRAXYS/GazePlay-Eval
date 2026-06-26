import {Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {CdkDrag, CdkDragHandle, CdkDropList} from '@angular/cdk/drag-drop';
import {SaveService} from '../../services/save/save.service';
import {
  transitionScreenModel,
  screenTypeModel,
  defaultTransitionScreenModel,
  transitionScreenConstModel,
  instructionScreenConstModel,
  stimuliScreenConstModel,
} from '../../shared/screenModel';
import {ModifyScreenComponent} from '../../components/modify-screen/modify-screen.component';
import {UpdateScreensService} from '../../services/updateScreens/update-screens.service';
import {AutoSaveService} from '../../services/auto-save/auto-save.service';
import {IndexedDBService} from '../../services/indexedDB/indexed-db.service';

@Component({
  selector: 'app-create-eval',
  imports: [ReactiveFormsModule, FormsModule, CdkDropList, CdkDrag, CdkDragHandle, ModifyScreenComponent],
  templateUrl: './create-eval.component.html',
  standalone: true,
  styleUrl: './create-eval.component.css'
})
export class CreateEvalComponent implements OnInit, OnDestroy {

  @ViewChildren('listScreenInputText') inputs!: QueryList<ElementRef<HTMLInputElement>>;

  isModifyScreen: boolean = false;
  listScreens: screenTypeModel[] = [];
  selectedScreen: screenTypeModel | null = null;
  indexSelectedScreen: number = -1;
  idScreen: number = 1;
  editNameScreenDisable: boolean = true;
  cellSize: number = 70;

  /** Miniatures (data URLs réduites) des images de stimuli de l'écran prévisualisé. */
  cellImageUrls: { [key: number]: string } = {};
  /** Taille max (px) des miniatures générées pour la prévisualisation, pour limiter l'impact perf. */
  private readonly thumbnailMaxSize = 96;

  /** Index de la case dont le son est en cours de lecture, ou null si aucun. */
  playingSoundCell: number | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private currentAudioUrl: string | null = null;

  /** Aperçu de l'écran d'instruction sélectionné (type de média, texte et URL du fichier). */
  instructionPreviewType: string = '';
  instructionPreviewText: string = '';
  instructionPreviewUrl: string = '';
  instructionSoundPlaying: boolean = false;
  private instructionPreviewObjectUrl: string | null = null;

  protected readonly stimuliScreenConstModel = stimuliScreenConstModel;
  protected readonly instructionScreenConstModel = instructionScreenConstModel;

  constructor(private router: Router,
              private saveService: SaveService,
              private updateScreenService: UpdateScreensService,
              private autoSaveService: AutoSaveService,
              private idbService: IndexedDBService) {
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.cellImageUrls = {};
    this.stopSound();
    this.clearInstructionPreview();
  }

  saveData(){
    this.saveService.saveDataAuto(
      this.saveService.dataAuto.nomEval,
      this.saveService.dataAuto.format,
      this.saveService.dataAuto.infoParticipant,
      this.saveService.dataAuto.globalParamsTransitionScreen,
      this.saveService.dataAuto.globalParamsInstructionScreen,
      this.saveService.dataAuto.globalParamsStimuliScreen,
      this.listScreens,
      this.saveService.dataAuto.step);
  }

  loadData(){
    this.listScreens = this.saveService.dataAuto.listScreens;
  }

  addScreen() {
    let newScreen: transitionScreenModel = structuredClone(defaultTransitionScreenModel);
    newScreen = this.updateScreenService.updateTransitionScreen(newScreen, 'Ecran ' + this.idScreen++, this.saveService.dataAuto.globalParamsTransitionScreen);
    this.selectedScreen = newScreen;
    this.listScreens.push(newScreen);
    this.indexSelectedScreen = this.listScreens.length - 1;
    this.cellImageUrls = {};
    this.stopSound();
    this.clearInstructionPreview();

    this.autoSaveService.autoSave('create-eval');

    // Scroll en bas de la liste
    setTimeout(() => {
      const container = this.inputs.last?.nativeElement.closest('.screen-list-scroll');
      container?.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }, 200);
  }

  selectScreen(screen: screenTypeModel, index: number) {
    this.selectedScreen = screen;
    this.indexSelectedScreen = index;
    void this.loadScreenPreview(screen);
  }

  editNameScreen(screen: screenTypeModel, value: boolean, index: number) {
    this.selectedScreen = screen;
    if (this.selectedScreen === screen) {
      this.editNameScreenDisable = value;
      setTimeout(() => {
        this.inputs.toArray()[index].nativeElement.focus();
        this.inputs.toArray()[index].nativeElement.select();
      }, 0);
    }
  }

  exitInputScreen() {
    this.editNameScreenDisable = true;
  }

  removeScreen(screen: screenTypeModel) {
    if (this.selectedScreen === screen) {
      this.selectedScreen = null;
      this.cellImageUrls = {};
      this.stopSound();
      this.clearInstructionPreview();
    }
    this.listScreens = this.listScreens.filter(s => s !== screen);

    this.saveData();
    this.autoSaveService.autoSave('create-eval');
  }

  getNameCurrentScreen() {
    return this.selectedScreen?.name ?? '';
  }

  getTypeCurrentScreen() {
    switch (this.selectedScreen?.type) {
      case transitionScreenConstModel:
        return 'Écran de transition';
      case instructionScreenConstModel:
        return "Écran d'instruction";
      case stimuliScreenConstModel:
        return 'Écran de stimuli';
      default:
        return '';
    }
  }

  getStimuliCells(): null[] {
    if (this.selectedScreen?.type !== stimuliScreenConstModel) {
      return [];
    }
    const rows = Number(this.selectedScreen.values[0]) || 0;
    const cols = Number(this.selectedScreen.values[1]) || 0;
    return Array.from({length: rows * cols}, () => null);
  }

  onModifyScreenChange(event: { screen: screenTypeModel, flag: boolean }){
    this.saveData();
    this.selectedScreen = event.screen;
    this.listScreens[this.indexSelectedScreen] = event.screen;
    this.isModifyScreen = event.flag;
    void this.loadScreenPreview(event.screen);
  }

  /** Prépare l'aperçu de l'écran sélectionné selon son type (stimuli ou instruction). */
  private async loadScreenPreview(screen: screenTypeModel): Promise<void> {
    await this.loadStimuliImages(screen);
    await this.loadInstructionPreview(screen);
  }

  /**
   * Charge le média (image, vidéo, son) ou le texte de l'écran d'instruction sélectionné
   * pour l'afficher dans le panneau de prévisualisation de la page de gestion.
   */
  private async loadInstructionPreview(screen: screenTypeModel): Promise<void> {
    this.clearInstructionPreview();
    if (screen.type !== instructionScreenConstModel) return;
    // values[2] = "Ajouter un media" : si désactivé, l'écran n'a aucun contenu à prévisualiser.
    if (!screen.values[2]) return;

    const type = screen.values[3];
    this.instructionPreviewType = type;

    if (type === 'Texte') {
      this.instructionPreviewText = screen.values[4] || '';
      return;
    }

    const name = screen.values[4];
    if (!name) return;

    const expectedType = type === 'Video' ? 'video' : type === 'Son' ? 'sound' : 'image';
    let file: Blob | undefined = screen.values[5] instanceof Blob ? screen.values[5] : undefined;
    if (!file) {
      file = await this.resolveCellMediaFile(screen.values[8] || name, expectedType);
    }
    if (!(file instanceof Blob)) return;

    // L'écran a pu changer pendant la résolution asynchrone : on ignore les résultats périmés.
    if (this.selectedScreen !== screen) return;

    const url = URL.createObjectURL(file);
    this.instructionPreviewObjectUrl = url;
    this.instructionPreviewUrl = url;
  }

  /** Réinitialise l'aperçu d'instruction, stoppe le son et libère l'URL objet associée. */
  private clearInstructionPreview(): void {
    this.stopSound();
    if (this.instructionPreviewObjectUrl) {
      URL.revokeObjectURL(this.instructionPreviewObjectUrl);
      this.instructionPreviewObjectUrl = null;
    }
    this.instructionPreviewType = '';
    this.instructionPreviewText = '';
    this.instructionPreviewUrl = '';
  }

  /**
   * Charge les images des cases de l'écran stimuli sélectionné sous forme de miniatures
   * réduites (data URLs) pour la prévisualisation, afin de limiter l'impact sur les perfs.
   */
  private async loadStimuliImages(screen: screenTypeModel): Promise<void> {
    this.cellImageUrls = {};
    this.stopSound();
    if (screen.type !== stimuliScreenConstModel) return;

    const listScreen = screen.values[12];
    const total = Number(screen.values[0]) * Number(screen.values[1]);
    for (let i = 0; i < total; i++) {
      const cell = listScreen[i];
      if (!cell || cell.hidden) continue;

      let file: Blob | undefined = cell.imageFile instanceof Blob ? cell.imageFile : undefined;
      if (!file && (cell.imageId || cell.imageName)) {
        file = await this.resolveCellMediaFile(cell.imageId || cell.imageName, 'image');
      }

      if (file instanceof Blob) {
        try {
          // L'écran a pu changer pendant la résolution asynchrone : on ignore les résultats périmés.
          if (this.selectedScreen !== screen) return;
          this.cellImageUrls[i] = await this.generateThumbnail(file, this.thumbnailMaxSize);
        } catch {
          // miniature non générée : on garde le repli texte/icône
        }
      }
    }
  }

  /** Génère une miniature réduite (data URL PNG) d'une image, bornée à maxSize px. */
  private generateThumbnail(file: Blob, maxSize: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Chargement image impossible'));
      };
      img.src = url;
    });
  }

  private async resolveCellMediaFile(ref: any, expectedType: 'image' | 'sound' | 'video'): Promise<File | undefined> {
    for (const id of this.getCandidateIds(ref)) {
      try {
        const evalFile = await this.idbService.getFile(id);
        if (evalFile?.type === expectedType && evalFile.file instanceof Blob) {
          return evalFile.file instanceof File
            ? evalFile.file
            : new File([evalFile.file], this.extractFileNameFromId(id), {type: evalFile.file.type});
        }
      } catch {
        // essaie le candidat suivant
      }
    }

    try {
      const allFiles = await this.idbService.getAllFiles();
      const baseName = this.extractFileNameFromId(ref);
      const match = allFiles.find((entry) =>
        entry.type === expectedType && this.extractFileNameFromId(entry.id) === baseName);
      if (match?.file instanceof Blob) {
        return match.file instanceof File
          ? match.file
          : new File([match.file], baseName, {type: match.file.type});
      }
    } catch {
      // ignore: repli best-effort
    }

    return undefined;
  }

  /**
   * Lance (ou arrête si déjà en cours) la lecture du son de la case prévisualisée.
   * Un seul son joue à la fois : relancer une autre case coupe le précédent.
   */
  async toggleCellSound(cellIndex: number): Promise<void> {
    if (this.playingSoundCell === cellIndex) {
      this.stopSound();
      return;
    }
    this.stopSound();

    const screen = this.selectedScreen;
    if (!screen || screen.type !== stimuliScreenConstModel) return;
    const cell = screen.values[12][cellIndex];
    if (!cell || !cell.soundName) return;

    let file: Blob | undefined = cell.soundFile instanceof Blob ? cell.soundFile : undefined;
    if (!file && (cell.soundId || cell.soundName)) {
      file = await this.resolveCellMediaFile(cell.soundId || cell.soundName, 'sound');
      if (file) cell.soundFile = file;
    }
    if (!(file instanceof Blob)) return;

    // L'écran a pu changer pendant la résolution asynchrone : on ignore les résultats périmés.
    if (this.selectedScreen !== screen) return;

    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.onended = () => this.stopSound();
    audio.onerror = () => this.stopSound();
    this.currentAudio = audio;
    this.currentAudioUrl = url;
    this.playingSoundCell = cellIndex;
    try {
      await audio.play();
    } catch {
      this.stopSound();
    }
  }

  /**
   * Lance (ou arrête si déjà en cours) la lecture du son de l'écran d'instruction prévisualisé.
   * On réutilise l'URL d'aperçu déjà créée ; elle est libérée par clearInstructionPreview().
   */
  async toggleInstructionSound(): Promise<void> {
    if (this.instructionSoundPlaying) {
      this.stopSound();
      return;
    }
    this.stopSound();
    if (!this.instructionPreviewUrl) return;

    const audio = new Audio(this.instructionPreviewUrl);
    audio.onended = () => this.stopSound();
    audio.onerror = () => this.stopSound();
    // On ne renseigne pas currentAudioUrl : l'URL appartient à l'aperçu, pas à la lecture.
    this.currentAudio = audio;
    this.instructionSoundPlaying = true;
    try {
      await audio.play();
    } catch {
      this.stopSound();
    }
  }

  /** Arrête la lecture en cours et libère l'URL objet associée (si gérée par la lecture). */
  private stopSound(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.onended = null;
      this.currentAudio.onerror = null;
      this.currentAudio = null;
    }
    if (this.currentAudioUrl) {
      URL.revokeObjectURL(this.currentAudioUrl);
      this.currentAudioUrl = null;
    }
    this.playingSoundCell = null;
    this.instructionSoundPlaying = false;
  }

  private getCandidateIds(ref: any): string[] {
    const baseName = this.extractFileNameFromId(ref);
    if (!baseName) return [];

    const projectName = this.saveService.getEvalName();
    const cleanName = typeof ref === 'string' ? ref.trim() : baseName;
    const ids = new Set<string>();
    ids.add(cleanName);
    ids.add(baseName);
    if (projectName) {
      ids.add(`${projectName}/${cleanName}`);
      ids.add(`${projectName}/${baseName}`);
    }
    return [...ids];
  }

  private extractFileNameFromId(id: any): string {
    if (id == null) return '';
    if (id instanceof File) return id.name || '';
    const asString = String(id).trim();
    const parts = asString.split('/');
    return parts[parts.length - 1] || asString;
  }

  drop(event: any) {
    const previousIndex = event.previousIndex;
    const currentIndex = event.currentIndex;
    const field = this.listScreens.splice(previousIndex, 1)[0];
    this.listScreens.splice(currentIndex, 0, field);
    this.indexSelectedScreen = currentIndex;
  }

  backToSetupEval() {
    this.saveData();
    void this.router.navigate(['/setup-eval']);
  }

  goToDownloadEval() {
    this.saveData()
    void this.router.navigate(['/download-eval']);
  }
}
