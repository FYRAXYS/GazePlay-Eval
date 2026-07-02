import {Injectable} from '@angular/core';
import JSZip from 'jszip';
import {saveAs} from 'file-saver';
import {SaveService} from '../save/save.service';
import {
  instructionScreenConstKey,
  instructionScreenConstModel,
  instructionScreenConstValue,
  screenTypeModel,
  stimuliScreenConstKey,
  stimuliScreenConstModel,
  stimuliScreenConstValue,
  transitionScreenConstKey,
  transitionScreenConstModel,
  transitionScreenConstValue
} from '../../shared/screenModel';
import {saveModel} from '../../shared/saveModel';
import {IndexedDBService} from '../indexedDB/indexed-db.service';

@Injectable({
  providedIn: 'root'
})
export class DownloadService {

  constructor(private idbService: IndexedDBService) {
  }

  private async getFileFromIDB(id: string): Promise<Blob | null> {
    if (!id) return null;
    try {
      const entry = await this.idbService.getFile(id);
      return entry.file;
    } catch {
      return null;
    }
  }

  private isValidFile(f: any): f is File | Blob {
    return f instanceof File || f instanceof Blob;
  }

  async generateEvalZip(saveService: SaveService) {
    const zip = new JSZip();

    const evalData = saveService.dataAuto.listScreens;
    let jsonData: any[] = [];

    for (let i = 0; i < evalData.length; i++) {
      const screen = this.withDefaultValues(evalData[i]);
      switch (screen.type) {

        case transitionScreenConstModel:
          this.generateTransitionScreen(screen, jsonData, true);
          break;

        case instructionScreenConstModel:
          if (screen.values[3] === "Texte") {
            this.generateInstructionScreenText(screen, jsonData, true);
          } else {
            await this.generateInstructionScreenMedia(screen, jsonData, saveService.getEvalName(), zip, true);
          }
          break;

        case stimuliScreenConstModel:
          await this.generateStimuliScreen(screen, jsonData, saveService.getEvalName(), zip, true);
          break;

        default:
          break;
      }
    }

    zip.file(saveService.getEvalName() + '/evalData.json', JSON.stringify(jsonData, null, 2));
    zip.file(saveService.getEvalName() + '/evalInfo.json', JSON.stringify(this.getInfoEval(saveService), null, 2));

    zip.generateAsync({type: 'blob'}).then(content => {
      saveAs(content, saveService.getEvalName() + '-gazeplayEval.zip');
    });
  }

  getInfoEval(saveService: SaveService) {
    return {
      "Nom de l'évaluation": saveService.getEvalName(),
      "Format choisi": saveService.dataAuto.format,
      "Informations participant": saveService.dataAuto.infoParticipant,
      ...this.buildGlobalParamsInfo(
        saveService.dataAuto.globalParamsTransitionScreen,
        saveService.dataAuto.globalParamsInstructionScreen,
        saveService.dataAuto.globalParamsStimuliScreen
      )
    };
  }

  /**
   * Sérialise les paramètres globaux (transition / instruction / stimuli) dans
   * `evalInfo.json`, sous la forme d'objets nommés que `LoadZipService` sait relire.
   *
   * Sans cette sérialisation, les paramètres globaux étaient perdus à l'import :
   * tout écran ajouté ensuite naissait depuis un tableau global vide, donc avec des
   * `values` indéfinies — silencieusement supprimées par `JSON.stringify` au ré-export
   * (champs manquants en fin d'écran). Les clés reflètent volontairement celles
   * attendues par `parseGlobal*` du LoadZipService pour garantir l'aller-retour.
   */
  private buildGlobalParamsInfo(gt: any[] = [], gi: any[] = [], gs: any[] = []) {
    return {
      globalParamsTransitionScreen: {
        "Mettre un temps avant passage à l'écran suivant": gt[0],
        "Combien de temps": gt[1],
        "Mettre une croix de fixation": gt[2],
        "Mettre un temps de fixation": gt[3],
        "Combien de temps de fixation": gt[4]
      },
      globalParamsInstructionScreen: {
        "Mettre un temps avant passage à l'écran suivant": gi[0],
        "Combien de temps": gi[1],
        "Ajouter un media": gi[2],
        "Type de media": gi[3],
        "Ajouter un bouton pour lancer evaluation": gi[4],
        "Combien de temps de fixation": gi[5]
      },
      globalParamsStimuliScreen: {
        "Nombre de lignes": gs[0],
        "Nombre de colonnes": gs[1],
        "Mettre un temps avant passage à l'écran suivant": gs[2],
        "Combien de temps": gs[3],
        "Combien de temps de fixation": gs[4],
        "Choix de sélection": gs[5],
        "Combien à sélectionner": gs[6],
        "Position stimuli aléatoire": gs[7]
      }
    };
  }

  /** Valeurs par défaut d'un écran selon son type (alignées sur le modèle, avant tout splice). */
  private defaultValuesFor(type: string): any[] {
    switch (type) {
      case transitionScreenConstModel:  return transitionScreenConstValue;
      case instructionScreenConstModel: return instructionScreenConstValue;
      case stimuliScreenConstModel:     return stimuliScreenConstValue;
      default:                          return [];
    }
  }

  /**
   * Renvoie une copie de l'écran dont chaque `values[i]` à `null`/`undefined` est
   * remplacé par la valeur par défaut du modèle.
   *
   * Garantit qu'un modèle pollué (champs perdus lors d'un import antérieur, devenus
   * `null` après un aller-retour localStorage) ne propage jamais de `null` dans
   * `evalData.json` — ce qui rendait l'évaluation inexploitable dans GazePlay-Learning.
   */
  private withDefaultValues(screen: screenTypeModel): screenTypeModel {
    const defaults = this.defaultValuesFor(screen.type);
    const values = structuredClone(screen.values);
    for (let i = 0; i < defaults.length; i++) {
      if (values[i] === undefined || values[i] === null) {
        values[i] = structuredClone(defaults[i]);
      }
    }
    return { ...screen, values } as screenTypeModel;
  }

  generateTransitionScreen(evalData: screenTypeModel, jsonData: any[], zip:boolean = true) {
    const transitionValues = structuredClone(evalData.values);
    const transitionResult = transitionScreenConstKey.reduce((acc, key, idx) => {
      acc[key] = transitionValues[idx];
      return acc;
    }, {} as Record<string, any>);
    let transitionData;
    if (zip) {
      transitionData = {
        Type: transitionScreenConstModel,
        ...transitionResult,
      }
    } else {
      transitionData = {
        Type: transitionScreenConstModel,
        Name: evalData.name,
        ...transitionResult,
      }
    }
    jsonData.push(transitionData);
  }

  generateInstructionScreenText(evalData: screenTypeModel, jsonData: any[], zip:boolean = true) {
    const instructionTextValues = structuredClone(evalData.values);
    instructionTextValues.splice(5, 1);
    const instructionTxtResult = instructionScreenConstKey.reduce((acc, key, idx) => {
      acc[key] = instructionTextValues[idx];
      return acc;
    }, {} as Record<string, any>);
    let instructionTxtData;
    if (zip) {
      instructionTxtData = {
        Type: instructionScreenConstModel,
        ...instructionTxtResult,
      }
    } else {
      instructionTxtData = {
        Type: instructionScreenConstModel,
        Name: evalData.name,
        ...instructionTxtResult,
      }
    }
    jsonData.push(instructionTxtData);
  }

  async generateInstructionScreenMedia(evalData: screenTypeModel, jsonData: any[], evalName: string, zip: JSZip, zipMode: boolean = true) {
    const instructionValues = structuredClone(evalData.values);
    const mediaType = instructionValues[3];

    if (mediaType !== 'Texte' && instructionValues[4]) {
      const idbId = instructionValues[8] || `${evalName}/${instructionValues[4]}`;
      let mediaFile: File | Blob | null = this.isValidFile(instructionValues[5]) ? instructionValues[5] : null;
      if (!mediaFile) {
        mediaFile = await this.getFileFromIDB(idbId);
      }
      if (mediaFile) {
        const mediaArrayBuffer = await mediaFile.arrayBuffer();
        const folder = mediaType === 'Image' ? 'images' : mediaType === 'Video' ? 'videos' : 'audio';
        zip.file(evalName + '/' + folder + '/' + instructionValues[4], mediaArrayBuffer);
      }
    }

    instructionValues.splice(5, 1);
    const instructionResult = instructionScreenConstKey.reduce((acc, key, idx) => {
      acc[key] = instructionValues[idx];
      return acc;
    }, {} as Record<string, any>);
    jsonData.push({
      Type: instructionScreenConstModel,
      ...(zipMode ? {} : { Name: evalData.name }),
      ...instructionResult,
    });
  }

  async generateStimuliScreen(evalData: screenTypeModel, jsonData: any[], evalName: string, zip: JSZip, zipMode: boolean = true) {
    const stimuliValues = structuredClone(evalData.values);
    const stimuliList = stimuliValues[12];

    for (const key in stimuliList) {
      const entry = stimuliList[key];
      const entryNameImageFile: string = entry.imageName;
      const entryNameSoundFile: string = entry.soundName;

      let entryImageFile: File | Blob | null = this.isValidFile(entry.imageFile) ? entry.imageFile : null;
      if (!entryImageFile && entryNameImageFile) {
        entryImageFile = await this.getFileFromIDB(entry.imageId || `${evalName}/${entryNameImageFile}`);
      }
      if (entryImageFile) {
        const arrayImageFileBuffer = await entryImageFile.arrayBuffer();
        zip.file(evalName + '/images/' + entryNameImageFile, arrayImageFileBuffer);
      }

      let entrySoundFile: File | Blob | null = this.isValidFile(entry.soundFile) ? entry.soundFile : null;
      if (!entrySoundFile && entryNameSoundFile) {
        entrySoundFile = await this.getFileFromIDB(entry.soundId || `${evalName}/${entryNameSoundFile}`);
      }
      if (entrySoundFile) {
        const arraySoundFileBuffer = await entrySoundFile.arrayBuffer();
        zip.file(evalName + '/audio/' + entryNameSoundFile, arraySoundFileBuffer);
      }

      delete entry.imageFile;
      delete entry.soundFile;
      delete entry.imageId;
      delete entry.soundId;
      // L'attribut `hidden` est interne à l'éditeur (cases masquées de la grille) :
      // on ne l'exporte pas dans le .gpeval final, contrairement au .gpSave.
      delete entry.hidden;
    }

    let audioFile: File | Blob | null = this.isValidFile(stimuliValues[11]) ? stimuliValues[11] : null;
    if (!audioFile && stimuliValues[10]) {
      const soundId = stimuliValues[13] || `${evalName}/${stimuliValues[10]}`;
      audioFile = await this.getFileFromIDB(soundId);
    }
    if (audioFile) {
      const audioArrayBuffer = await audioFile.arrayBuffer();
      zip.file(evalName + '/audio/' + stimuliValues[10], audioArrayBuffer);
    }
    stimuliValues.splice(11, 1);

    const stimuliResult = stimuliScreenConstKey.reduce((acc, key, idx) => {
      acc[key] = stimuliValues[idx];
      return acc;
    }, {} as Record<string, any>);
    jsonData.push({
      Type: stimuliScreenConstModel,
      ...(zipMode ? {} : { Name: evalData.name }),
      ...stimuliResult,
    });
  }

  /**
   * Génère un fichier ZIP à partir d'une évaluation sauvegardée.
   * @param saveData l'évaluation à convertir en fichier ZIP.
   */
  async generateSlotZip(saveData: saveModel): Promise<void> {
    try {
      const zip = new JSZip();
      const evalName = saveData.nomEval || 'GazePlayEvalDefaultName';
      const jsonData: any[] = [];

      for (const rawScreen of saveData.listScreens) {
        const screen = this.withDefaultValues(rawScreen);
        switch (screen.type) {
          case transitionScreenConstModel:
            this.generateTransitionScreen(screen, jsonData, false);
            break;
          case instructionScreenConstModel:
            await this.generateInstructionScreenSlot(screen, jsonData, evalName, zip, false);
            break;
          case stimuliScreenConstModel:
            await this.generateStimuliScreenSlot(screen, jsonData, evalName, zip, false);
            break;
        }
      }


      zip.file(evalName + '/evalData.json', JSON.stringify(jsonData, null, 2));
      zip.file(evalName + '/evalInfo.json', JSON.stringify(this.getInfoEvalFromSlot(saveData), null, 2));


      const content = await zip.generateAsync({type: 'blob'});
      saveAs(content, evalName + '-gazeplayEval.gpSave');
    } catch (err) {
      console.error('[generateSlotZip] erreur:', err);
    }
  }

  /**
   * Créé l'objet JSON correspondant à `evalInfo.json` à partir d'une sauvegarde dans un slot.
   * @param saveData l'évaluation dont les données seront extraites.
   */
  getInfoEvalFromSlot(saveData: saveModel) {
    return {
      "Nom de l'évaluation": saveData.nomEval,
      "Format choisi": saveData.format,
      "Informations participant": saveData.infoParticipant,
      ...this.buildGlobalParamsInfo(
        saveData.globalParamsTransitionScreen,
        saveData.globalParamsInstructionScreen,
        saveData.globalParamsStimuliScreen
      )
    };
  }

  async generateInstructionScreenSlot(evalData: screenTypeModel, jsonData: any[], evalName: string, zip: JSZip, zipMode: boolean = true): Promise<void> {
    const values = structuredClone(evalData.values);

    if (values[3] !== 'Texte' && values[4]) {
      const idbId = values[8] || `${evalName}/${values[4]}`;
      let file: File | Blob | null = this.isValidFile(values[5]) ? values[5] : null;
      if (!file) {
        file = await this.getFileFromIDB(idbId);
      }
      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        const folder = values[3] === 'Image' ? 'images' : values[3] === 'Video' ? 'videos' : 'audio';
        zip.file(`${evalName}/${folder}/${values[4]}`, arrayBuffer);
      }
    }

    values.splice(5, 1);
    const result = instructionScreenConstKey.reduce((acc, key, idx) => {
      acc[key] = values[idx];
      return acc;
    }, {} as Record<string, any>);
    jsonData.push({
      Type: instructionScreenConstModel,
      ...(zipMode ? {} : { Name: evalData.name }),
      ...result
    });
  }

  async generateStimuliScreenSlot(evalData: screenTypeModel, jsonData: any[], evalName: string, zip: JSZip, zipMode: boolean = true): Promise<void> {
    const values = structuredClone(evalData.values);
    const stimuliList = values[12];

    for (const key in stimuliList) {
      const entry = stimuliList[key];

      let imageFile: File | Blob | null = this.isValidFile(entry.imageFile) ? entry.imageFile : null;
      if (!imageFile && entry.imageName) {
        imageFile = await this.getFileFromIDB(entry.imageId || `${evalName}/${entry.imageName}`);
      }
      if (imageFile) {
        const arrayBuffer = await imageFile.arrayBuffer();
        zip.file(`${evalName}/images/${entry.imageName}`, arrayBuffer);
      }

      let soundFile: File | Blob | null = this.isValidFile(entry.soundFile) ? entry.soundFile : null;
      if (!soundFile && entry.soundName) {
        soundFile = await this.getFileFromIDB(entry.soundId || `${evalName}/${entry.soundName}`);
      }
      if (soundFile) {
        const arrayBuffer = await soundFile.arrayBuffer();
        zip.file(`${evalName}/audio/${entry.soundName}`, arrayBuffer);
      }

      delete entry.imageFile;
      delete entry.soundFile;
    }

    let globalAudioFile: File | Blob | null = this.isValidFile(values[11]) ? values[11] : null;
    if (!globalAudioFile && values[10]) {
      const soundId = values[13] || `${evalName}/${values[10]}`;
      globalAudioFile = await this.getFileFromIDB(soundId);
    }
    if (globalAudioFile) {
      const arrayBuffer = await globalAudioFile.arrayBuffer();
      zip.file(`${evalName}/audio/${values[10]}`, arrayBuffer);
    }

    values.splice(11, 1);
    if (values[12] !== undefined) {
      values.splice(12, 1);
    }

    const result = stimuliScreenConstKey.reduce((acc, key, idx) => {
      acc[key] = values[idx];
      return acc;
    }, {} as Record<string, any>);
    jsonData.push({
      Type: stimuliScreenConstModel,
      ...(zipMode ? {} : { Name: evalData.name }),
      ...result
    });
  }
}

