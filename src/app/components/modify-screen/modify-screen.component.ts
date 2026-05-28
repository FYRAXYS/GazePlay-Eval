import {
  Component,
  EventEmitter,
  HostListener,
  Input, OnInit,
  Output,
} from '@angular/core';
import {
  transitionScreenConstModel,
  transitionScreenModel,
  defaultTransitionScreenModel,
  defaultInstructionScreenModel,
  defaultStimuliScreenModel,
  instructionScreenConstModel,
  instructionScreenModel,
  screenTypeModel,
  stimuliScreenConstModel,
  stimuliScreenModel
} from '../../shared/screenModel';
import {FormsModule} from '@angular/forms';
import {UpdateScreensService} from '../../services/updateScreens/update-screens.service';
import {SaveService} from '../../services/save/save.service';
import {ConfigStimuliComponent} from '../config-stimuli/config-stimuli.component';
import {Offcanvas} from 'bootstrap';
import {IndexedDBService} from '../../services/indexedDB/indexed-db.service';
import {AutoSaveService} from '../../services/auto-save/auto-save.service';
import {FlashService} from '../../services/flash-message/flash.service';
import {MatTooltip} from '@angular/material/tooltip';

@Component({
  selector: 'app-modify-screen',
  imports: [
    FormsModule,
    ConfigStimuliComponent,
    MatTooltip,
  ],
  templateUrl: './modify-screen.component.html',
  standalone: true,
  styleUrl: './modify-screen.component.css'
})
export class ModifyScreenComponent implements OnInit {
  tooltipFileSave: string = (
    `Tout les fichiers que vous importez dans le site sont sauvés dans le stockage de votre navigateur.

    Vous pouvez donc déplacer ou supprimer les fichiers de votre disque sans risquer d'altérer l'évaluation en cours.`
  );
  tooltipSelectionChoice: string = (
    ` Le choix de sélection détermine comment l'application doit tenir compte du type des cellules de stimuli:

    - Tout :
    Le type des cellules n'est pas compté dans la validation, du moment que l'utilisateur sélectionne le nombre requis. Le type des cellules reste cependant toujours accessible.

    - Bonnes réponses :
    Seules les cellules étant considérée comme des bonnes réponses sont comptées dans la validation.`
  );

  tooltipMaxSelection: string = (
    `Le nombre de stimuli ne peut pas être plus grand que le nombre de lignes multiplié par le nombre de colonnes.`
  )

  @Input() screenToModify!: screenTypeModel;
  @Output() selectedScreenChange = new EventEmitter<{ screen: screenTypeModel, flag: boolean }>();

  actualTypeScreen: string = "";
  typeFile: string = "";
  nameFile: string = "";
  haveInstructionFile: boolean = false;
  haveStimuliSoundFile: boolean = false;
  instructionFile: any = "";
  stimuliFile: any = "";
  textToRead: string = '';
  fileDuration: number = 0;
  showWarningMessage: boolean = false;
  private instructionObjectUrl: string | null = null;
  private stimuliObjectUrl: string | null = null;

  dataStimuli!: {
    cell: number;
    screen: any;
    rows: number;
    cols: number;
  }
  stimuliOffcanvasReady: boolean = false;
  activeCellIndex: number | null = null;
  duplicateMode: boolean = false;
  deleteMode: boolean = false;
  duplicateSourceIndex: number | null = null;
  pendingDuplicateTarget: number | null = null;
  swapMode: boolean = false;
  swapSourceIndex: number | null = null;
  cellSize: number = 80;
  private readonly minCellSize = 40;
  private readonly maxCellSize = 160;
  gridMaxHeight: number = 0;
  multiSelectMode: boolean = false;
  selectedCells: Set<number> = new Set<number>();
  pendingDeleteCells: number[] | null = null;

  constructor(
    private updateScreenService: UpdateScreensService,
    private saveService: SaveService,
    private autoSaveService: AutoSaveService,
    private idbService: IndexedDBService,
    private flashService: FlashService
  ) {
  }

  ngOnInit(): void {
    this.actualTypeScreen = this.screenToModify.type;
    void this.initializeMediaState();
    this.updateGridViewport();
  }

  @HostListener('window:resize')
  updateGridViewport(): void {
    // Hauteur max de la zone grille basée sur l'écran : ~60% de la hauteur visible.
    this.gridMaxHeight = Math.max(Math.round(window.innerHeight * 0.6), 240);
  }

  private async initializeMediaState(): Promise<void> {
    this.haveInstructionFile = await this.checkInstructionFileExist();
    this.haveStimuliSoundFile = await this.checkStimuliSoundFileExist();
  }

  changeTypeScreen(type: string) {
    this.actualTypeScreen = type;
    switch (type){
      case transitionScreenConstModel :
        let newTransitionScreen: transitionScreenModel = structuredClone(defaultTransitionScreenModel);
        newTransitionScreen = this.updateScreenService.updateTransitionScreen(newTransitionScreen, this.screenToModify.name, this.saveService.dataAuto.globalParamsTransitionScreen);
        this.screenToModify = newTransitionScreen;
        break;

      case instructionScreenConstModel :
        let newInstructionScreen: instructionScreenModel = structuredClone(defaultInstructionScreenModel);
        newInstructionScreen = this.updateScreenService.updateInstructionScreen(newInstructionScreen, this.screenToModify.name, this.saveService.dataAuto.globalParamsInstructionScreen);
        this.screenToModify = newInstructionScreen;
        void this.refreshInstructionMediaState();
        break;

      case stimuliScreenConstModel :
        let newStimuliScreen: stimuliScreenModel = structuredClone(defaultStimuliScreenModel);
        newStimuliScreen = this.updateScreenService.updateStimuliScreen(newStimuliScreen, this.screenToModify.name, this.saveService.dataAuto.globalParamsStimuliScreen);
        this.screenToModify = newStimuliScreen;
        void this.refreshStimuliSoundState();
        this.checkStimuliCells();
        break;

      default :
        break;
    }
  }

  changeTypeFile(type: string){
    if (this.screenToModify.type === instructionScreenConstModel){
      this.screenToModify.values[3] = type;
      this.screenToModify.values[4] = "";
      this.screenToModify.values[5] = undefined;
      this.screenToModify.values[8] = '';
      this.typeFile = type;
      this.haveInstructionFile = false;
      this.setInstructionPreview('');
    }
  }

  async getInstructionFile(event: Event){
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0 && this.screenToModify.type === instructionScreenConstModel ) {
      const file = input.files[0];
      const projectName = this.saveService.getEvalName();
      const id = `${projectName}/${file.name}`;

      try {
        await this.idbService.addFile(id, file, this.getInstructionMediaType());
      } catch {
        await this.idbService.updateFile(id, file, this.getInstructionMediaType());
      }

      this.screenToModify.values[4] = file.name;
      this.screenToModify.values[5] = file;
      this.screenToModify.values[8] = id;
      this.haveInstructionFile = true;
      this.nameFile = file.name;
      this.setInstructionPreview(URL.createObjectURL(file));
      this.getFileDuration(file);

      input.value = '';
    }else {
      this.haveInstructionFile = false;
    }
  }

  async getStimuliSoundFile(event: Event){
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0 && this.screenToModify.type === stimuliScreenConstModel ) {
      const file = input.files[0];
      const projectName = this.saveService.getEvalName();
      const id = `${projectName}/${file.name}`;

      try {
        await this.idbService.addFile(id, file, 'sound');
      } catch {
        await this.idbService.updateFile(id, file, 'sound');
      }

      this.screenToModify.values[10] = file.name;
      this.screenToModify.values[11] = file;
      this.screenToModify.values[13] = id;
      this.haveStimuliSoundFile = true;
      this.nameFile = file.name;
      this.setStimuliPreview(URL.createObjectURL(file));
      this.typeFile = "Son";

      input.value = '';
    }else {
      this.haveStimuliSoundFile = false;
    }
  }

  async checkInstructionFileExist(): Promise<boolean> {
    if (this.screenToModify.type === instructionScreenConstModel){
      this.typeFile = this.screenToModify.values[3];
      if (this.typeFile === 'Texte'){
        this.textToRead = this.screenToModify.values[4];
        this.setInstructionPreview('');
        return false;
      }else {
        if (this.screenToModify.values[4] !== ''){
          this.nameFile = this.screenToModify.values[4];
          const mediaFile = await this.resolveInstructionMediaFile();
          if (mediaFile) {
            this.screenToModify.values[5] = mediaFile.file;
            this.screenToModify.values[8] = mediaFile.id;
            this.setInstructionPreview(URL.createObjectURL(mediaFile.file));
            this.getFileDuration(mediaFile.file);
            return true;
          }
        }else {
          this.setInstructionPreview('');
        }
      }
    }
    return false;
  }

  async checkStimuliSoundFileExist(): Promise<boolean> {
    if (this.screenToModify.type === stimuliScreenConstModel){
      this.typeFile = "Son";
      if (this.screenToModify.values[10] !== ''){
        this.nameFile = this.screenToModify.values[10];
        const mediaFile = await this.resolveStimuliSoundFile();
        if (mediaFile) {
          this.screenToModify.values[11] = mediaFile.file;
          this.screenToModify.values[13] = mediaFile.id;
          this.setStimuliPreview(URL.createObjectURL(mediaFile.file));
          return true;
        }
      }else {
        this.setStimuliPreview('');
        return false;
      }
    }
    return false;
  }

  private async refreshInstructionMediaState(): Promise<void> {
    this.haveInstructionFile = await this.checkInstructionFileExist();
  }

  private async refreshStimuliSoundState(): Promise<void> {
    this.haveStimuliSoundFile = await this.checkStimuliSoundFileExist();
  }

  async deleteImageInstruction(): Promise<void> {
    const imageName = this.screenToModify.values[4];
    const imageId = this.screenToModify.values[8];

    if (imageId || imageName) {
      await this.deleteFileFromIDB(imageId || imageName, 'image');
    }

    this.screenToModify.values[4] = '';
    this.screenToModify.values[5] = undefined;
    this.screenToModify.values[8] = '';

    this.haveInstructionFile = false;
    this.setInstructionPreview('');

    this.autoSaveService.autoSave('instruction');
  }

  async deleteSoundInstruction(): Promise<void> {
    const soundName = this.screenToModify.values[4];
    const soundId = this.screenToModify.values[8];

    if (soundId || soundName) {
      await this.deleteFileFromIDB(soundName, 'sound');
    }

    this.screenToModify.values[4] = '';
    this.screenToModify.values[5] = undefined;
    this.screenToModify.values[8] = '';

    this.haveInstructionFile = false;
    this.setInstructionPreview('');

    this.autoSaveService.autoSave('instruction');
  }

  async deleteSoundStimuli(): Promise<void> {
    const soundName = this.screenToModify.values[10];
    const soundId = this.screenToModify.values[13];

    if (soundId || soundName) {
      await this.deleteFileFromIDB(soundId || soundName, 'sound');
    }

    this.screenToModify.values[10] = '';
    this.screenToModify.values[11] = undefined;
    this.screenToModify.values[13] = '';

    this.haveStimuliSoundFile = false;
    this.setStimuliPreview('');

    this.autoSaveService.autoSave('stimuli');
  }

  private async deleteFileFromIDB(fileName: string, expectedType: 'image' | 'sound'): Promise<void> {
    const candidateIds = this.getCandidateIds(fileName);

    for (const id of candidateIds) {
      try {
        const evalFile = await this.idbService.getFile(id);
        if (evalFile.type !== expectedType) continue;
        await this.idbService.deleteFile(id);
      } catch {
        // peut déjà être supprimé ou absent
      }
    }

    try {
      const allFiles = await this.idbService.getAllFiles();
      const baseName = this.extractFileNameFromId(fileName);
      const matches = allFiles.filter((entry) =>
        entry.type === expectedType && this.extractFileNameFromId(entry.id) === baseName
      );

      for (const match of matches) {
        try {
          await this.idbService.deleteFile(match.id);
        } catch {
          // peut déjà être supprimé ou absent
        }
      }
    } catch {
      // ignore: cleanup best-effort
    }
  }

  private getInstructionMediaType(): 'image' | 'video' | 'sound' {
    switch (this.typeFile) {
      case 'Video':
        return 'video';
      case 'Son':
        return 'sound';
      default:
        return 'image';
    }
  }

  private async resolveInstructionMediaFile(): Promise<{ file: File, id: string } | undefined> {
    const expectedType = this.getInstructionMediaType();
    const mediaId = this.screenToModify.values[8] || this.screenToModify.values[4];
    const candidateIds = this.getCandidateIds(mediaId);

    for (const id of candidateIds) {
      try {
        const evalFile = await this.idbService.getFile(id);
        if (evalFile.type !== expectedType) continue;
        if (!(evalFile.file instanceof Blob)) continue;

        if (evalFile.file instanceof File) {
          return { file: evalFile.file, id };
        }

        const inferredName = this.extractFileNameFromId(id);
        return {
          file: new File([evalFile.file], inferredName, { type: evalFile.file.type }),
          id
        };
      } catch {
        // essaie le candidat suivant
      }
    }

    try {
      const allFiles = await this.idbService.getAllFiles();
      const baseName = this.extractFileNameFromId(mediaId);
      const match = allFiles.find((entry) =>
        entry.type === expectedType && this.extractFileNameFromId(entry.id) === baseName
      );

      if (match?.file instanceof Blob) {
        if (match.file instanceof File) {
          return { file: match.file, id: match.id };
        }
        return {
          file: new File([match.file], baseName, { type: match.file.type }),
          id: match.id
        };
      }
    } catch {
      // ignore: fallback best-effort
    }

    return undefined;
  }

  private async resolveStimuliSoundFile(): Promise<{ file: File, id: string } | undefined> {
    const mediaId = this.screenToModify.values[13] || this.screenToModify.values[10];
    const candidateIds = this.getCandidateIds(mediaId);

    for (const id of candidateIds) {
      try {
        const evalFile = await this.idbService.getFile(id);
        if (evalFile.type !== 'sound') continue;
        if (!(evalFile.file instanceof Blob)) continue;

        if (evalFile.file instanceof File) {
          return { file: evalFile.file, id };
        }

        const inferredName = this.extractFileNameFromId(id);
        return {
          file: new File([evalFile.file], inferredName, { type: evalFile.file.type }),
          id
        };
      } catch {
        // essaie le candidat suivant
      }
    }

    try {
      const allFiles = await this.idbService.getAllFiles();
      const baseName = this.extractFileNameFromId(mediaId);
      const match = allFiles.find((entry) =>
        entry.type === 'sound' && this.extractFileNameFromId(entry.id) === baseName
      );

      if (match?.file instanceof Blob) {
        if (match.file instanceof File) {
          return { file: match.file, id: match.id };
        }
        return {
          file: new File([match.file], baseName, { type: match.file.type }),
          id: match.id
        };
      }
    } catch {
      // ignore: fallback best-effort
    }

    return undefined;
  }

  private getCandidateIds(fileName: any): string[] {
    if (fileName == null) return [];

    let cleanName = '';
    if (typeof fileName === 'string') {
      cleanName = fileName.trim();
    } else if (fileName instanceof File) {
      cleanName = (fileName.name || '').toString().trim();
    } else if (typeof fileName === 'object' && fileName.name) {
      cleanName = String(fileName.name).trim();
    } else if (typeof fileName === 'object' && fileName.id) {
      cleanName = String(fileName.id).trim();
    } else {
      cleanName = String(fileName).trim();
    }

    if (!cleanName) return [];

    const projectName = this.saveService.getEvalName();
    const baseName = this.extractFileNameFromId(cleanName);
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
    if (typeof id === 'object' && (id.name || id.id)) return String(id.name ?? id.id);
    const asString = String(id);
    const parts = asString.split('/');
    return parts[parts.length - 1] || asString;
  }

  private setInstructionPreview(url: string): void {
    if (this.instructionObjectUrl) {
      URL.revokeObjectURL(this.instructionObjectUrl);
      this.instructionObjectUrl = null;
    }
    this.instructionFile = url;
    if (url) {
      this.instructionObjectUrl = url;
    }
  }

  private setStimuliPreview(url: string): void {
    if (this.stimuliObjectUrl) {
      URL.revokeObjectURL(this.stimuliObjectUrl);
      this.stimuliObjectUrl = null;
    }
    this.stimuliFile = url;
    if (url) {
      this.stimuliObjectUrl = url;
    }
  }

  getFileDuration(fileUser: File){
    if (this.typeFile === 'Video' || this.typeFile === 'Son'){
     const file = fileUser;

      const media = document.createElement(file.type.startsWith('audio') ? 'audio' : 'video');
      media.src = URL.createObjectURL(file);

      media.preload = 'metadata';

      media.onloadedmetadata = () => {
        this.fileDuration = media.duration;
        console.log('Durée :', this.fileDuration);

        URL.revokeObjectURL(media.src);
      };
    }
  }

  getText(event: string){
    if (this.screenToModify.type === instructionScreenConstModel){
      this.textToRead = event;
      this.screenToModify.values[4] = event;
    }
  }

  playText() {
    if (!this.textToRead.trim()) return;

    const utterance = new SpeechSynthesisUtterance(this.textToRead);
    utterance.lang = 'fr-FR';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  get totalCells(): number[] {
    return Array.from({ length: this.screenToModify.values[0] * this.screenToModify.values[1] }, (_, i) => i + 1);
  }

  checkStimuliCells(){
    let numberCells = this.screenToModify.values[0] * this.screenToModify.values[1];
    const listScreen = this.screenToModify.values[12];
    const numberKey = Object.keys(listScreen).length;
    if (numberKey < numberCells){
      for (let i = numberKey; i < numberCells; i++){
        listScreen[i] = {
          imageName: "",
          imageFile: undefined,
          soundName: "",
          soundFile: undefined,
          goodAnswer: false,
          hidden: false,
        }
      }
    }else {
      for (const keyNumber in listScreen){
        if (Number(keyNumber) >= numberCells){
          delete listScreen[keyNumber];
        }
      }
    }
  }

  openStimuliData(cellNumber: number) {
    const listScreenAll = this.screenToModify.values[12];
    if (this.multiSelectMode) {
      if (listScreenAll[cellNumber]?.hidden) return;
      if (this.selectedCells.has(cellNumber)) {
        this.selectedCells.delete(cellNumber);
      } else {
        this.selectedCells.add(cellNumber);
      }
      return;
    }
    if (this.swapMode) {
      if (this.swapSourceIndex === null) {
        if (listScreenAll[cellNumber]?.hidden) return;
        this.swapSourceIndex = cellNumber;
        return;
      }
      if (this.swapSourceIndex === cellNumber) {
        this.swapSourceIndex = null;
        return;
      }
      this.swapCells(this.swapSourceIndex, cellNumber);
      this.swapSourceIndex = null;
      this.swapMode = false;
      return;
    }
    if (this.duplicateMode) {
      if (this.pendingDuplicateTarget !== null) return;
      if (this.duplicateSourceIndex === null) {
        if (listScreenAll[cellNumber]?.hidden) return;
        this.duplicateSourceIndex = cellNumber;
        // S'il n'y a qu'une seule case, on ajoute une colonne pour avoir une destination
        if (Number(this.screenToModify.values[0]) * Number(this.screenToModify.values[1]) === 1) {
          this.screenToModify.values[1] = Number(this.screenToModify.values[1]) + 1;
          this.checkStimuliCells();
        }
        return;
      }
      const target = listScreenAll[cellNumber];
      if (!target) return;
      if (this.duplicateSourceIndex === cellNumber) return;
      if (!target.hidden && (target.imageName || target.soundName)) {
        this.pendingDuplicateTarget = cellNumber;
        return;
      }
      this.duplicateCell(this.duplicateSourceIndex, cellNumber);
      this.duplicateSourceIndex = null;
      this.duplicateMode = false;
      return;
    }
    if (this.deleteMode) {
      if (listScreenAll[cellNumber]?.hidden) return;
      this.requestDelete([cellNumber]);
      return;
    }
    // Clic sur un emplacement vide (masqué) en mode normal : on le matérialise en case.
    if (listScreenAll[cellNumber]?.hidden) {
      listScreenAll[cellNumber] = this.emptyCell();
    }
    const listScreen = this.screenToModify.values[12];
    this.activeCellIndex = cellNumber;
    this.dataStimuli = {
      cell: cellNumber,
      screen: listScreen,
      rows: this.screenToModify.values[0],
      cols: this.screenToModify.values[1]
    };
    this.stimuliOffcanvasReady = true;
    setTimeout(() => {
      this.openOffcanvasStimuli();
    });
  }

  toggleDuplicateMode() {
    this.duplicateMode = !this.duplicateMode;
    this.duplicateSourceIndex = null;
    this.pendingDuplicateTarget = null;
    if (this.duplicateMode) {
      this.deleteMode = false;
      this.swapMode = false;
      this.swapSourceIndex = null;
      this.multiSelectMode = false;
      this.selectedCells.clear();
    }
  }

  toggleMultiSelectMode() {
    this.multiSelectMode = !this.multiSelectMode;
    this.selectedCells.clear();
    this.pendingDeleteCells = null;
    if (this.multiSelectMode) {
      this.duplicateMode = false;
      this.duplicateSourceIndex = null;
      this.pendingDuplicateTarget = null;
      this.swapMode = false;
      this.swapSourceIndex = null;
      this.deleteMode = false;
    }
  }

  /** Clic sur la corbeille : en multi-sélection on supprime la sélection, sinon on (dé)active le mode suppression simple. */
  onDeleteClick() {
    if (this.multiSelectMode) {
      if (this.selectedCells.size > 0) {
        this.requestDelete([...this.selectedCells]);
      }
      return;
    }
    this.toggleDeleteMode();
  }

  confirmOverwrite() {
    if (this.duplicateSourceIndex !== null && this.pendingDuplicateTarget !== null) {
      this.duplicateCell(this.duplicateSourceIndex, this.pendingDuplicateTarget);
    }
    this.pendingDuplicateTarget = null;
    this.duplicateSourceIndex = null;
    this.duplicateMode = false;
  }

  cancelOverwrite() {
    this.pendingDuplicateTarget = null;
  }

  private emptyCell() {
    return {
      imageName: "",
      imageFile: undefined,
      soundName: "",
      soundFile: undefined,
      goodAnswer: false,
      hidden: false,
    };
  }

  private hiddenCell() {
    return {
      imageName: "",
      imageFile: undefined,
      soundName: "",
      soundFile: undefined,
      goodAnswer: false,
      hidden: true,
    };
  }

  /**
   * Compte combien de cases référencent ce fichier (par son nom) dans toute l'évaluation.
   * Sert à éviter de supprimer de l'IDB un fichier encore utilisé par une case dupliquée.
   * @param fileName nom du fichier recherché.
   * @param type 'image' ou 'sound'.
   */
  private countFileReferences(fileName: string | undefined, type: 'image' | 'sound'): number {
    if (!fileName) return 0;

    let count = 0;
    const tally = (cells: { [key: number]: any }) => {
      for (const key of Object.keys(cells)) {
        const cell = cells[Number(key)];
        const name = type === 'image' ? cell?.imageName : cell?.soundName;
        if (name === fileName) count++;
      }
    };

    // Écran courant (où se font les duplications)
    tally(this.screenToModify.values[12]);

    // Autres écrans stimuli de l'évaluation
    const screens = this.saveService.dataAuto?.listScreens ?? [];
    for (const screen of screens) {
      if (screen?.type !== stimuliScreenConstModel) continue;
      const cells = screen.values?.[12];
      if (!cells || cells === this.screenToModify.values[12]) continue; // évite le double comptage
      tally(cells);
    }

    return count;
  }

  addAdjacent(event: Event, cellIndex: number, direction: 'top' | 'bottom' | 'left' | 'right') {
    event.stopPropagation();
    const rows = Number(this.screenToModify.values[0]);
    const cols = Number(this.screenToModify.values[1]);
    const listScreen = this.screenToModify.values[12];
    const r = Math.floor(cellIndex / cols);
    const c = cellIndex % cols;

    let targetR = r;
    let targetC = c;
    if (direction === 'top') targetR = r - 1;
    if (direction === 'bottom') targetR = r + 1;
    if (direction === 'left') targetC = c - 1;
    if (direction === 'right') targetC = c + 1;

    if (targetR >= 0 && targetR < rows && targetC >= 0 && targetC < cols) {
      const targetIdx = targetR * cols + targetC;
      if (listScreen[targetIdx]?.hidden) {
        listScreen[targetIdx] = this.emptyCell();
      }
      return;
    }

    if (direction === 'bottom') {
      this.screenToModify.values[0] = rows + 1;
      this.checkStimuliCells();
      const newRowStart = rows * cols;
      for (let cc = 0; cc < cols; cc++) {
        listScreen[newRowStart + cc] = cc === c ? this.emptyCell() : this.hiddenCell();
      }
      return;
    }

    if (direction === 'top') {
      const snapshot: { [key: number]: any } = {};
      for (let i = 0; i < rows * cols; i++) snapshot[i] = listScreen[i];
      this.screenToModify.values[0] = rows + 1;
      for (let cc = 0; cc < cols; cc++) {
        listScreen[cc] = cc === c ? this.emptyCell() : this.hiddenCell();
      }
      for (let rr = 0; rr < rows; rr++) {
        for (let cc = 0; cc < cols; cc++) {
          listScreen[(rr + 1) * cols + cc] = snapshot[rr * cols + cc];
        }
      }
      return;
    }

    const newCols = cols + 1;
    const snapshot: { [key: number]: any } = {};
    for (let i = 0; i < rows * cols; i++) snapshot[i] = listScreen[i];
    this.screenToModify.values[1] = newCols;
    this.checkStimuliCells();

    for (let rr = 0; rr < rows; rr++) {
      const newCell = rr === r ? this.emptyCell() : this.hiddenCell();
      if (direction === 'right') {
        for (let cc = 0; cc < cols; cc++) {
          listScreen[rr * newCols + cc] = snapshot[rr * cols + cc];
        }
        listScreen[rr * newCols + cols] = newCell;
      } else {
        listScreen[rr * newCols] = newCell;
        for (let cc = 0; cc < cols; cc++) {
          listScreen[rr * newCols + cc + 1] = snapshot[rr * cols + cc];
        }
      }
    }
  }

  toggleDeleteMode() {
    this.deleteMode = !this.deleteMode;
    if (this.deleteMode) {
      this.duplicateMode = false;
      this.duplicateSourceIndex = null;
      this.pendingDuplicateTarget = null;
      this.swapMode = false;
      this.swapSourceIndex = null;
      this.multiSelectMode = false;
      this.selectedCells.clear();
    }
  }

  /**
   * Demande la suppression des cases données. Si au moins une contient des données,
   * on ouvre une confirmation ; sinon on supprime directement.
   */
  private requestDelete(indices: number[]) {
    const listScreen = this.screenToModify.values[12];
    const toDelete = indices.filter(i => listScreen[i] && !listScreen[i].hidden);
    if (toDelete.length === 0) {
      this.deleteMode = false;
      return;
    }
    // On garde toujours au moins une case visible dans la grille.
    if (toDelete.length >= this.countVisibleCells()) {
      this.flashService.show('warning', 'Vous devez conserver au moins une case.');
      this.deleteMode = false;
      this.selectedCells.clear();
      return;
    }
    const hasData = toDelete.some(i => listScreen[i].imageName || listScreen[i].soundName);
    if (hasData) {
      this.pendingDeleteCells = toDelete;
    } else {
      this.performDelete(toDelete);
    }
  }

  /** Nombre de cases visibles (non masquées) dans l'écran courant. */
  private countVisibleCells(): number {
    const listScreen = this.screenToModify.values[12];
    let count = 0;
    for (const key of Object.keys(listScreen)) {
      if (!listScreen[Number(key)]?.hidden) count++;
    }
    return count;
  }

  confirmDelete() {
    if (this.pendingDeleteCells) {
      this.performDelete(this.pendingDeleteCells);
    }
  }

  cancelDelete() {
    this.pendingDeleteCells = null;
  }

  private performDelete(indices: number[]) {
    for (const i of indices) {
      this.clearCellWithIDB(i);
    }
    this.autoShrinkGrid();
    this.selectedCells.clear();
    this.pendingDeleteCells = null;
    this.deleteMode = false;
  }

  /** Masque/vide une case et retire ses fichiers de l'IDB s'ils ne sont plus référencés. */
  private clearCellWithIDB(cellNumber: number) {
    const listScreen = this.screenToModify.values[12];
    const cell = listScreen[cellNumber];
    if (!cell || cell.hidden) return;

    const removedImageName = cell.imageName;
    const removedSoundName = cell.soundName;
    const shouldDeleteImage = !!removedImageName && this.countFileReferences(removedImageName, 'image') <= 1;
    const shouldDeleteSound = !!removedSoundName && this.countFileReferences(removedSoundName, 'sound') <= 1;

    listScreen[cellNumber] = {
      imageName: "",
      imageFile: undefined,
      soundName: "",
      soundFile: undefined,
      goodAnswer: false,
      hidden: true,
    };

    if (shouldDeleteImage) void this.deleteFileFromIDB(removedImageName, 'image');
    if (shouldDeleteSound) void this.deleteFileFromIDB(removedSoundName, 'sound');

    if (this.activeCellIndex === cellNumber) {
      this.activeCellIndex = null;
    }
  }

  /** Retire les dernières lignes/colonnes entièrement masquées, en boucle. */
  private autoShrinkGrid() {
    while (this.shrinkOnce()) { /* continue tant qu'on peut rétrécir */ }
  }

  private shrinkOnce(): boolean {
    const rows = Number(this.screenToModify.values[0]);
    const cols = Number(this.screenToModify.values[1]);
    const listScreen = this.screenToModify.values[12];

    let lastColAllHidden = cols > 1;
    for (let r = 0; r < rows && lastColAllHidden; r++) {
      if (!listScreen[r * cols + (cols - 1)]?.hidden) {
        lastColAllHidden = false;
      }
    }

    if (lastColAllHidden) {
      const newCols = cols - 1;
      const snapshot: { [key: number]: any } = {};
      for (let i = 0; i < rows * cols; i++) snapshot[i] = listScreen[i];

      this.screenToModify.values[1] = newCols;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < newCols; c++) {
          listScreen[r * newCols + c] = snapshot[r * cols + c];
        }
      }
      for (let i = rows * newCols; i < rows * cols; i++) {
        delete listScreen[i];
      }
      return true;
    }

    if (rows > 1) {
      let lastRowAllHidden = true;
      for (let c = 0; c < cols && lastRowAllHidden; c++) {
        if (!listScreen[(rows - 1) * cols + c]?.hidden) {
          lastRowAllHidden = false;
        }
      }
      if (lastRowAllHidden) {
        this.screenToModify.values[0] = rows - 1;
        for (let i = (rows - 1) * cols; i < rows * cols; i++) {
          delete listScreen[i];
        }
        return true;
      }
    }

    return false;
  }

  duplicateCell(sourceIndex: number, targetIndex: number) {
    const listScreen = this.screenToModify.values[12];
    const source = listScreen[sourceIndex];
    if (!source || sourceIndex === targetIndex) return;

    listScreen[targetIndex] = structuredClone({
      imageName: source.imageName ?? '',
      imageFile: source.imageFile,
      soundName: source.soundName ?? '',
      soundFile: source.soundFile,
      goodAnswer: source.goodAnswer ?? false,
      hidden: false,
    });
  }

  openOffcanvasStimuli() {
    const element = document.getElementById('configStimuli');

    if (element) {
      const instance = Offcanvas.getOrCreateInstance(element);
      instance.show();
    }
  }

  checkFileDurationAndTimeScreen(){
    console.log(this.fileDuration, this.screenToModify.values[1])
    if (this.fileDuration > this.screenToModify.values[1]){
      if (this.showWarningMessage){
        this.showWarningMessage = false;
        this.selectedScreenChange.emit({screen: this.screenToModify, flag: false});
      }else {
        this.showWarningMessage = true;
      }
    }else {
      this.showWarningMessage = false;
      this.selectedScreenChange.emit({screen: this.screenToModify, flag: false});
    }
  }

  backToScreenList(){
    if (this.screenToModify.type === instructionScreenConstModel && (this.typeFile === 'Video' || this.typeFile === 'Son')){
      console.log("check file duration")
      this.checkFileDurationAndTimeScreen();
    }else {
      this.selectedScreenChange.emit({screen: this.screenToModify, flag: false});
    }
    this.autoSaveService.autoSave('backToScreenList');
  }

  toggleSwapMode() {
    this.swapMode = !this.swapMode;
    this.swapSourceIndex = null;
    if (this.swapMode) {
      this.duplicateMode = false;
      this.duplicateSourceIndex = null;
      this.pendingDuplicateTarget = null;
      this.deleteMode = false;
      this.multiSelectMode = false;
      this.selectedCells.clear();
    }
  }

  swapCells(a: number, b: number) {
    const list = this.screenToModify.values[12];
    const tmp = list[a];
    list[a] = list[b];
    list[b] = tmp;
  }

  zoomIn() {
    this.cellSize = Math.min(this.cellSize + 20, this.maxCellSize);
  }

  zoomOut() {
    this.cellSize = Math.max(this.cellSize - 20, this.minCellSize);
  }

  protected readonly instructionScreenConstModel = instructionScreenConstModel;
  protected readonly stimuliScreenConstModel = stimuliScreenConstModel;
  protected readonly transitionScreenConstModel = transitionScreenConstModel;
  protected readonly Number = Number;
}


