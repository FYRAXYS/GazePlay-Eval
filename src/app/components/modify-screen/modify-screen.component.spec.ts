import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModifyScreenComponent } from './modify-screen.component';
import { UpdateScreensService } from '../../services/updateScreens/update-screens.service';
import { SaveService } from '../../services/save/save.service';
import { AutoSaveService } from '../../services/auto-save/auto-save.service';
import { IndexedDBService } from '../../services/indexedDB/indexed-db.service';
import { ConfigStimuliComponent } from '../config-stimuli/config-stimuli.component';
import { Component } from '@angular/core';
import * as bootstrap from 'bootstrap';

@Component({ selector: 'app-config-stimuli', template: '', standalone: true })
class ConfigStimuliStubComponent {}

describe('ModifyScreenComponent', () => {
  let component: ModifyScreenComponent;
  let fixture: ComponentFixture<ModifyScreenComponent>;
  let updateScreenSpy: jasmine.SpyObj<UpdateScreensService>;
  let saveSpy: jasmine.SpyObj<SaveService>;
  let autoSaveSpy: jasmine.SpyObj<AutoSaveService>;
  let idbSpy: jasmine.SpyObj<IndexedDBService>;

  function makeTransition(): any {
    return { name: 'TS', type: 'transition', values: [false, 0, false, false, 0] };
  }

  function makeInstruction(typeFile = 'Image', fileName = '', fileId = ''): any {
    return {
      name: 'IS', type: 'instruction',
      values: [false, 10, false, typeFile, fileName, undefined, false, 1, fileId]
    };
  }

  function makeStimuli(soundName = '', soundId = ''): any {
    return {
      name: 'SS', type: 'stimuli',
      values: [
        1, 1, false, 10, 1, 'Tout', 1, false, false, false,
        soundName, undefined,
        { 0: { imageId: '', imageName: '', imageFile: undefined, soundId: '', soundName: '', soundFile: undefined, goodAnswer: false } },
        soundId
      ]
    };
  }

  beforeEach(async () => {
    updateScreenSpy = jasmine.createSpyObj('UpdateScreensService', [
      'updateTransitionScreen', 'updateInstructionScreen', 'updateStimuliScreen'
    ]);
    saveSpy = jasmine.createSpyObj('SaveService', ['getEvalName'], {
      dataAuto: {
        globalParamsTransitionScreen: [false, 0, false, false, 0],
        globalParamsInstructionScreen: [false, 1, false, 'Image', false, 1],
        globalParamsStimuliScreen: [1, 1, false, 10, 1, 1, false, false]
      }
    });
    autoSaveSpy = jasmine.createSpyObj('AutoSaveService', ['autoSave']);
    idbSpy = jasmine.createSpyObj('IndexedDBService', [
      'getFile', 'addFile', 'updateFile', 'deleteFile', 'getAllFiles'
    ]);

    saveSpy.getEvalName.and.returnValue('TestProject');
    idbSpy.getFile.and.returnValue(Promise.reject(new Error('not found')));
    idbSpy.addFile.and.returnValue(Promise.resolve());
    idbSpy.updateFile.and.returnValue(Promise.resolve());
    idbSpy.deleteFile.and.returnValue(Promise.resolve());
    idbSpy.getAllFiles.and.returnValue(Promise.resolve([]));

    updateScreenSpy.updateTransitionScreen.and.callFake((s: any, name: string) => { s.name = name; return s; });
    updateScreenSpy.updateInstructionScreen.and.callFake((s: any, name: string) => { s.name = name; return s; });
    updateScreenSpy.updateStimuliScreen.and.callFake((s: any, name: string) => { s.name = name; return s; });

    await TestBed.configureTestingModule({
      imports: [ModifyScreenComponent],
      providers: [
        { provide: UpdateScreensService, useValue: updateScreenSpy },
        { provide: SaveService, useValue: saveSpy },
        { provide: AutoSaveService, useValue: autoSaveSpy },
        { provide: IndexedDBService, useValue: idbSpy }
      ]
    })
    .overrideComponent(ModifyScreenComponent, {
      remove: { imports: [ConfigStimuliComponent] },
      add: { imports: [ConfigStimuliStubComponent] }
    })
    .compileComponents();

    spyOn(URL, 'createObjectURL').and.returnValue('blob:fake-url');
    spyOn(URL, 'revokeObjectURL');
  });

  function createComponent(screen: any): void {
    fixture = TestBed.createComponent(ModifyScreenComponent);
    component = fixture.componentInstance;
    component.screenToModify = screen;
    fixture.detectChanges();
  }

  // ─── Création ─────────────────────────────────────────────────────────────────

  it('devrait être créé', async () => {
    createComponent(makeTransition());
    await fixture.whenStable();
    expect(component).toBeTruthy();
  });

  // ─── ngOnInit ─────────────────────────────────────────────────────────────────

  it('ngOnInit — actualTypeScreen est initialisé sur le type de l\'écran', async () => {
    createComponent(makeInstruction());
    await fixture.whenStable();
    expect(component.actualTypeScreen).toBe('instruction');
  });

  it('ngOnInit — écran transition → haveInstructionFile et haveStimuliSoundFile restent false', async () => {
    createComponent(makeTransition());
    await fixture.whenStable();
    expect(component.haveInstructionFile).toBeFalse();
    expect(component.haveStimuliSoundFile).toBeFalse();
  });

  it('ngOnInit — instruction type Texte → textToRead défini et haveInstructionFile false', async () => {
    createComponent(makeInstruction('Texte', 'Bonjour'));
    await fixture.whenStable();
    expect(component.textToRead).toBe('Bonjour');
    expect(component.haveInstructionFile).toBeFalse();
  });

  it('ngOnInit — instruction avec image trouvée dans IDB → haveInstructionFile true', async () => {
    const mockFile = new File(['img'], 'photo.png', { type: 'image/png' });
    idbSpy.getFile.and.returnValue(Promise.resolve({
      id: 'TestProject/photo.png', file: mockFile, type: 'image', lastEdit: new Date()
    } as any));

    createComponent(makeInstruction('Image', 'photo.png', 'TestProject/photo.png'));
    await fixture.whenStable();

    expect(component.haveInstructionFile).toBeTrue();
    expect(component.nameFile).toBe('photo.png');
  });

  it('ngOnInit — stimuli avec son trouvé dans IDB → haveStimuliSoundFile true', async () => {
    const mockFile = new File(['snd'], 'son.mp3', { type: 'audio/mp3' });
    idbSpy.getFile.and.returnValue(Promise.resolve({
      id: 'TestProject/son.mp3', file: mockFile, type: 'sound', lastEdit: new Date()
    } as any));

    createComponent(makeStimuli('son.mp3', 'TestProject/son.mp3'));
    await fixture.whenStable();

    expect(component.haveStimuliSoundFile).toBeTrue();
  });

  // ─── changeTypeScreen ─────────────────────────────────────────────────────────

  it('changeTypeScreen → transition — appelle updateTransitionScreen et met à jour screenToModify', async () => {
    createComponent(makeInstruction());
    await fixture.whenStable();

    component.changeTypeScreen('transition');

    expect(updateScreenSpy.updateTransitionScreen).toHaveBeenCalled();
    expect(component.screenToModify.type).toBe('transition');
    expect(component.actualTypeScreen).toBe('transition');
  });

  it('changeTypeScreen → instruction — appelle updateInstructionScreen', async () => {
    createComponent(makeTransition());
    await fixture.whenStable();

    component.changeTypeScreen('instruction');

    expect(updateScreenSpy.updateInstructionScreen).toHaveBeenCalled();
    expect(component.actualTypeScreen).toBe('instruction');
  });

  it('changeTypeScreen → stimuli — appelle updateStimuliScreen', async () => {
    createComponent(makeTransition());
    await fixture.whenStable();

    component.changeTypeScreen('stimuli');

    expect(updateScreenSpy.updateStimuliScreen).toHaveBeenCalled();
    expect(component.actualTypeScreen).toBe('stimuli');
  });

  it('changeTypeScreen → valeur inconnue — actualTypeScreen mis à jour mais aucun service appelé', async () => {
    createComponent(makeTransition());
    await fixture.whenStable();

    component.changeTypeScreen('inconnu');

    expect(component.actualTypeScreen).toBe('inconnu');
    expect(updateScreenSpy.updateTransitionScreen).not.toHaveBeenCalled();
  });

  // ─── changeTypeFile ───────────────────────────────────────────────────────────

  it('changeTypeFile — écran instruction → met à jour typeFile et réinitialise le fichier', async () => {
    createComponent(makeInstruction('Image', 'old.png', 'TestProject/old.png'));
    await fixture.whenStable();

    component.changeTypeFile('Video');

    expect(component.typeFile).toBe('Video');
    expect(component.screenToModify.values[3]).toBe('Video');
    expect(component.screenToModify.values[4]).toBe('');
    expect(component.screenToModify.values[5]).toBeUndefined();
    expect(component.haveInstructionFile).toBeFalse();
  });

  it('changeTypeFile — écran transition → ne fait rien', async () => {
    createComponent(makeTransition());
    await fixture.whenStable();

    component.changeTypeFile('Video');

    expect(component.typeFile).toBe('');
  });

  // ─── getInstructionFile ───────────────────────────────────────────────────────

  it('getInstructionFile — image sélectionnée → addFile + mise à jour des valeurs + haveInstructionFile true', async () => {
    createComponent(makeInstruction('Image'));
    await fixture.whenStable();

    const file = new File(['img'], 'photo.png', { type: 'image/png' });
    const event = { target: { files: [file], value: '' } } as unknown as Event;

    await component.getInstructionFile(event);

    expect(idbSpy.addFile).toHaveBeenCalledWith('TestProject/photo.png', file, 'image');
    expect(component.screenToModify.values[4]).toBe('photo.png');
    expect(component.screenToModify.values[5]).toBe(file);
    expect(component.screenToModify.values[8]).toBe('TestProject/photo.png');
    expect(component.haveInstructionFile).toBeTrue();
    expect(component.nameFile).toBe('photo.png');
  });

  it('getInstructionFile — video sélectionnée → addFile avec type video', async () => {
    createComponent(makeInstruction('Video'));
    await fixture.whenStable();

    const file = new File(['vid'], 'video.mp4', { type: 'video/mp4' });
    const event = { target: { files: [file], value: '' } } as unknown as Event;

    await component.getInstructionFile(event);

    expect(idbSpy.addFile).toHaveBeenCalledWith('TestProject/video.mp4', file, 'video');
  });

  it('getInstructionFile — son sélectionné → addFile avec type sound', async () => {
    createComponent(makeInstruction('Son'));
    await fixture.whenStable();

    const file = new File(['snd'], 'son.mp3', { type: 'audio/mp3' });
    const event = { target: { files: [file], value: '' } } as unknown as Event;

    await component.getInstructionFile(event);

    expect(idbSpy.addFile).toHaveBeenCalledWith('TestProject/son.mp3', file, 'sound');
  });

  it('getInstructionFile — addFile échoue → updateFile appelé en fallback', async () => {
    createComponent(makeInstruction('Image'));
    await fixture.whenStable();
    idbSpy.addFile.and.returnValue(Promise.reject(new Error('exists')));

    const file = new File(['img'], 'photo.png', { type: 'image/png' });
    const event = { target: { files: [file], value: '' } } as unknown as Event;

    await component.getInstructionFile(event);

    expect(idbSpy.updateFile).toHaveBeenCalledWith('TestProject/photo.png', file, 'image');
  });

  it('getInstructionFile — aucun fichier sélectionné → haveInstructionFile false, rien ajouté', async () => {
    createComponent(makeInstruction('Image'));
    await fixture.whenStable();

    const event = { target: { files: [] } } as unknown as Event;
    await component.getInstructionFile(event);

    expect(idbSpy.addFile).not.toHaveBeenCalled();
    expect(component.haveInstructionFile).toBeFalse();
  });

  it('getInstructionFile — type écran non instruction → rien ne se passe', async () => {
    createComponent(makeTransition());
    await fixture.whenStable();

    const file = new File(['img'], 'photo.png', { type: 'image/png' });
    const event = { target: { files: [file], value: '' } } as unknown as Event;

    await component.getInstructionFile(event);

    expect(idbSpy.addFile).not.toHaveBeenCalled();
  });

  // ─── getStimuliSoundFile ──────────────────────────────────────────────────────

  it('getStimuliSoundFile — son sélectionné → addFile + valeurs mises à jour + haveStimuliSoundFile true', async () => {
    createComponent(makeStimuli());
    await fixture.whenStable();

    const file = new File(['snd'], 'son.mp3', { type: 'audio/mp3' });
    const event = { target: { files: [file], value: '' } } as unknown as Event;

    await component.getStimuliSoundFile(event);

    expect(idbSpy.addFile).toHaveBeenCalledWith('TestProject/son.mp3', file, 'sound');
    expect(component.screenToModify.values[10]).toBe('son.mp3');
    expect(component.screenToModify.values[11]).toBe(file);
    expect(component.screenToModify.values[13]).toBe('TestProject/son.mp3');
    expect(component.haveStimuliSoundFile).toBeTrue();
    expect(component.typeFile).toBe('Son');
    expect(component.nameFile).toBe('son.mp3');
  });

  it('getStimuliSoundFile — addFile échoue → updateFile appelé en fallback', async () => {
    createComponent(makeStimuli());
    await fixture.whenStable();
    idbSpy.addFile.and.returnValue(Promise.reject(new Error('exists')));

    const file = new File(['snd'], 'son.mp3', { type: 'audio/mp3' });
    const event = { target: { files: [file], value: '' } } as unknown as Event;

    await component.getStimuliSoundFile(event);

    expect(idbSpy.updateFile).toHaveBeenCalledWith('TestProject/son.mp3', file, 'sound');
  });

  it('getStimuliSoundFile — aucun fichier → haveStimuliSoundFile false, rien ajouté', async () => {
    createComponent(makeStimuli());
    await fixture.whenStable();

    const event = { target: { files: [] } } as unknown as Event;
    await component.getStimuliSoundFile(event);

    expect(idbSpy.addFile).not.toHaveBeenCalled();
    expect(component.haveStimuliSoundFile).toBeFalse();
  });

  it('getStimuliSoundFile — type écran non stimuli → rien ne se passe', async () => {
    createComponent(makeInstruction());
    await fixture.whenStable();

    const file = new File(['snd'], 'son.mp3', { type: 'audio/mp3' });
    const event = { target: { files: [file], value: '' } } as unknown as Event;

    await component.getStimuliSoundFile(event);

    expect(idbSpy.addFile).not.toHaveBeenCalled();
  });

  // ─── deleteImageInstruction ───────────────────────────────────────────────────

  it('deleteImageInstruction → réinitialise les valeurs image et appelle autoSave', async () => {
    createComponent(makeInstruction('Image', 'photo.png', 'TestProject/photo.png'));
    await fixture.whenStable();

    await component.deleteImageInstruction();

    expect(component.screenToModify.values[4]).toBe('');
    expect(component.screenToModify.values[5]).toBeUndefined();
    expect(component.screenToModify.values[8]).toBe('');
    expect(component.haveInstructionFile).toBeFalse();
    expect(autoSaveSpy.autoSave).toHaveBeenCalledWith('instruction');
  });

  it('deleteImageInstruction → deleteFile appelé si imageId présent', async () => {
    createComponent(makeInstruction('Image', 'photo.png', 'TestProject/photo.png'));
    await fixture.whenStable();
    idbSpy.getFile.and.returnValue(Promise.resolve({
      id: 'TestProject/photo.png', file: new File([''], 'photo.png'), type: 'image', lastEdit: new Date()
    } as any));

    await component.deleteImageInstruction();

    expect(idbSpy.deleteFile).toHaveBeenCalled();
  });

  // ─── deleteSoundInstruction ───────────────────────────────────────────────────

  it('deleteSoundInstruction → réinitialise les valeurs son instruction et appelle autoSave', async () => {
    createComponent(makeInstruction('Son', 'son.mp3', 'TestProject/son.mp3'));
    await fixture.whenStable();

    await component.deleteSoundInstruction();

    expect(component.screenToModify.values[4]).toBe('');
    expect(component.screenToModify.values[5]).toBeUndefined();
    expect(component.screenToModify.values[8]).toBe('');
    expect(component.haveInstructionFile).toBeFalse();
    expect(autoSaveSpy.autoSave).toHaveBeenCalledWith('instruction');
  });

  // ─── deleteSoundStimuli ───────────────────────────────────────────────────────

  it('deleteSoundStimuli → réinitialise les valeurs son stimuli et appelle autoSave', async () => {
    createComponent(makeStimuli('son.mp3', 'TestProject/son.mp3'));
    await fixture.whenStable();

    await component.deleteSoundStimuli();

    expect(component.screenToModify.values[10]).toBe('');
    expect(component.screenToModify.values[11]).toBeUndefined();
    expect(component.screenToModify.values[13]).toBe('');
    expect(component.haveStimuliSoundFile).toBeFalse();
    expect(autoSaveSpy.autoSave).toHaveBeenCalledWith('stimuli');
  });

  it('deleteSoundStimuli → deleteFile appelé si soundId présent', async () => {
    createComponent(makeStimuli('son.mp3', 'TestProject/son.mp3'));
    await fixture.whenStable();
    idbSpy.getFile.and.returnValue(Promise.resolve({
      id: 'TestProject/son.mp3', file: new File([''], 'son.mp3'), type: 'sound', lastEdit: new Date()
    } as any));

    await component.deleteSoundStimuli();

    expect(idbSpy.deleteFile).toHaveBeenCalled();
  });

  // ─── getText ──────────────────────────────────────────────────────────────────

  it('getText — écran instruction → met à jour textToRead et values[4]', async () => {
    createComponent(makeInstruction('Texte'));
    await fixture.whenStable();

    component.getText('Bonjour le monde');

    expect(component.textToRead).toBe('Bonjour le monde');
    expect(component.screenToModify.values[4]).toBe('Bonjour le monde');
  });

  it('getText — écran transition → ne modifie pas textToRead', async () => {
    createComponent(makeTransition());
    await fixture.whenStable();

    component.getText('Bonjour');

    expect(component.textToRead).toBe('');
  });

  // ─── playText ─────────────────────────────────────────────────────────────────

  it('playText — texte non vide → cancel puis speak appelés', async () => {
    createComponent(makeInstruction('Texte'));
    await fixture.whenStable();
    component.textToRead = 'Bonjour';

    const cancelSpy = spyOn(window.speechSynthesis, 'cancel');
    const speakSpy = spyOn(window.speechSynthesis, 'speak');

    component.playText();

    expect(cancelSpy).toHaveBeenCalled();
    expect(speakSpy).toHaveBeenCalled();
    const utterance = speakSpy.calls.mostRecent().args[0] as SpeechSynthesisUtterance;
    expect(utterance.lang).toBe('fr-FR');
    expect(utterance.text).toBe('Bonjour');
  });

  it('playText — texte vide ou espaces → speak non appelé', async () => {
    createComponent(makeInstruction('Texte'));
    await fixture.whenStable();
    component.textToRead = '   ';

    const speakSpy = spyOn(window.speechSynthesis, 'speak');
    component.playText();

    expect(speakSpy).not.toHaveBeenCalled();
  });

  // ─── totalCells ───────────────────────────────────────────────────────────────

  it('totalCells — 1x1 → retourne tableau de 1 élément', async () => {
    createComponent(makeStimuli());
    await fixture.whenStable();

    expect(component.totalCells.length).toBe(1);
    expect(component.totalCells[0]).toBe(1);
  });

  it('totalCells — 2x3 → retourne tableau de 6 éléments', async () => {
    createComponent(makeStimuli());
    await fixture.whenStable();

    // Modifier les dimensions sans re-déclencher le rendu du template
    component.screenToModify.values[0] = 2;
    component.screenToModify.values[1] = 3;

    expect(component.totalCells.length).toBe(6);
    expect(component.totalCells[0]).toBe(1);
    expect(component.totalCells[5]).toBe(6);
  });

  // ─── checkStimuliCells ────────────────────────────────────────────────────────

  it('checkStimuliCells — 2x2 avec 1 cellule existante → ajoute 3 cellules manquantes', async () => {
    createComponent(makeStimuli());  // 1x1 pour éviter l'erreur de rendu
    await fixture.whenStable();

    // Changer les dimensions sans re-déclencher detectChanges
    component.screenToModify.values[0] = 2;
    component.screenToModify.values[1] = 2;
    component.checkStimuliCells();

    expect(Object.keys(component.screenToModify.values[12]).length).toBe(4);
  });

  it('checkStimuliCells — 1x1 avec 3 cellules existantes → supprime les cellules en trop', async () => {
    const screen = makeStimuli();
    screen.values[0] = 1;
    screen.values[1] = 1;
    screen.values[12] = {
      0: { imageName: '', imageFile: undefined, soundName: '', soundFile: undefined, goodAnswer: false },
      1: { imageName: '', imageFile: undefined, soundName: '', soundFile: undefined, goodAnswer: false },
      2: { imageName: '', imageFile: undefined, soundName: '', soundFile: undefined, goodAnswer: false }
    };
    createComponent(screen);
    await fixture.whenStable();

    component.checkStimuliCells();

    expect(Object.keys(component.screenToModify.values[12]).length).toBe(1);
    expect(component.screenToModify.values[12][0]).toBeDefined();
    expect(component.screenToModify.values[12][1]).toBeUndefined();
  });

  it('checkStimuliCells — 1x1 avec 1 cellule existante → aucun changement', async () => {
    createComponent(makeStimuli());
    await fixture.whenStable();

    component.checkStimuliCells();

    expect(Object.keys(component.screenToModify.values[12]).length).toBe(1);
  });

  // ─── openStimuliData ─────────────────────────────────────────────────────────

  it('openStimuliData — définit dataStimuli, activeCellIndex et stimuliOffcanvasReady', async () => {
    createComponent(makeStimuli());
    await fixture.whenStable();

    spyOn(component, 'openOffcanvasStimuli');
    component.openStimuliData(0);

    expect(component.stimuliOffcanvasReady).toBeTrue();
    expect(component.activeCellIndex).toBe(0);
    expect(component.dataStimuli.cell).toBe(0);
    expect(component.dataStimuli.rows).toBe(1);
    expect(component.dataStimuli.cols).toBe(1);
  });

  // ─── openOffcanvasStimuli ─────────────────────────────────────────────────────

  it('openOffcanvasStimuli — élément trouvé → Offcanvas.show appelé', async () => {
    createComponent(makeStimuli());
    await fixture.whenStable();

    const mockElement = document.createElement('div');
    spyOn(document, 'getElementById').and.returnValue(mockElement);
    const offcanvasSpy = jasmine.createSpyObj('Offcanvas', ['show']);
    spyOn(bootstrap.Offcanvas, 'getOrCreateInstance').and.returnValue(offcanvasSpy as any);

    component.openOffcanvasStimuli();

    expect(offcanvasSpy.show).toHaveBeenCalled();
  });

  it('openOffcanvasStimuli — élément non trouvé → aucune erreur levée', async () => {
    createComponent(makeStimuli());
    await fixture.whenStable();

    spyOn(document, 'getElementById').and.returnValue(null);

    expect(() => component.openOffcanvasStimuli()).not.toThrow();
  });

  // ─── checkFileDurationAndTimeScreen ──────────────────────────────────────────

  it('checkFileDurationAndTimeScreen — durée > temps écran → showWarningMessage passe à true, aucun emit', async () => {
    createComponent(makeInstruction('Video'));
    await fixture.whenStable();
    component.fileDuration = 30;
    component.screenToModify.values[1] = 10;

    spyOn(component.selectedScreenChange, 'emit');
    component.checkFileDurationAndTimeScreen();

    expect(component.showWarningMessage).toBeTrue();
    expect(component.selectedScreenChange.emit).not.toHaveBeenCalled();
  });

  it('checkFileDurationAndTimeScreen — durée > temps écran et warning déjà affiché → émet et masque le warning', async () => {
    createComponent(makeInstruction('Video'));
    await fixture.whenStable();
    component.fileDuration = 30;
    component.screenToModify.values[1] = 10;
    component.showWarningMessage = true;

    spyOn(component.selectedScreenChange, 'emit');
    component.checkFileDurationAndTimeScreen();

    expect(component.showWarningMessage).toBeFalse();
    expect(component.selectedScreenChange.emit).toHaveBeenCalledWith({ screen: component.screenToModify, flag: false });
  });

  it('checkFileDurationAndTimeScreen — durée <= temps écran → émet et showWarningMessage false', async () => {
    createComponent(makeInstruction('Video'));
    await fixture.whenStable();
    component.fileDuration = 5;
    component.screenToModify.values[1] = 10;

    spyOn(component.selectedScreenChange, 'emit');
    component.checkFileDurationAndTimeScreen();

    expect(component.showWarningMessage).toBeFalse();
    expect(component.selectedScreenChange.emit).toHaveBeenCalledWith({ screen: component.screenToModify, flag: false });
  });

  // ─── backToScreenList ─────────────────────────────────────────────────────────

  it('backToScreenList — transition → émet selectedScreenChange et appelle autoSave', async () => {
    createComponent(makeTransition());
    await fixture.whenStable();

    spyOn(component.selectedScreenChange, 'emit');
    component.backToScreenList();

    expect(component.selectedScreenChange.emit).toHaveBeenCalledWith({ screen: component.screenToModify, flag: false });
    expect(autoSaveSpy.autoSave).toHaveBeenCalledWith('backToScreenList');
  });

  it('backToScreenList — instruction + Video → checkFileDurationAndTimeScreen appelé', async () => {
    createComponent(makeInstruction('Video'));
    await fixture.whenStable();
    component.typeFile = 'Video';

    spyOn(component, 'checkFileDurationAndTimeScreen');
    component.backToScreenList();

    expect(component.checkFileDurationAndTimeScreen).toHaveBeenCalled();
    expect(autoSaveSpy.autoSave).toHaveBeenCalledWith('backToScreenList');
  });

  it('backToScreenList — instruction + Son → checkFileDurationAndTimeScreen appelé', async () => {
    createComponent(makeInstruction('Son'));
    await fixture.whenStable();
    component.typeFile = 'Son';

    spyOn(component, 'checkFileDurationAndTimeScreen');
    component.backToScreenList();

    expect(component.checkFileDurationAndTimeScreen).toHaveBeenCalled();
  });

  it('backToScreenList — instruction + Image → émet directement sans check durée', async () => {
    createComponent(makeInstruction('Image'));
    await fixture.whenStable();
    component.typeFile = 'Image';

    spyOn(component, 'checkFileDurationAndTimeScreen');
    spyOn(component.selectedScreenChange, 'emit');
    component.backToScreenList();

    expect(component.checkFileDurationAndTimeScreen).not.toHaveBeenCalled();
    expect(component.selectedScreenChange.emit).toHaveBeenCalled();
  });

  // ─── getFileDuration ──────────────────────────────────────────────────────────

  it('getFileDuration — typeFile Video → crée un élément vidéo et définit src', async () => {
    createComponent(makeInstruction('Video'));
    await fixture.whenStable();
    component.typeFile = 'Video';

    const mockMedia = { src: '', preload: '', onloadedmetadata: null as any, duration: 0 };
    spyOn(document, 'createElement').and.returnValue(mockMedia as any);

    const file = new File(['vid'], 'video.mp4', { type: 'video/mp4' });
    component.getFileDuration(file);

    expect(document.createElement).toHaveBeenCalledWith('video');
    expect(mockMedia.src).toBe('blob:fake-url');
    expect(mockMedia.preload).toBe('metadata');
  });

  it('getFileDuration — typeFile Son → crée un élément audio', async () => {
    createComponent(makeInstruction('Son'));
    await fixture.whenStable();
    component.typeFile = 'Son';

    const mockMedia = { src: '', preload: '', onloadedmetadata: null as any, duration: 0 };
    spyOn(document, 'createElement').and.returnValue(mockMedia as any);

    const file = new File(['snd'], 'son.mp3', { type: 'audio/mpeg' });
    component.getFileDuration(file);

    expect(document.createElement).toHaveBeenCalledWith('audio');
  });

  it('getFileDuration — typeFile Image → aucun élément media créé', async () => {
    createComponent(makeInstruction('Image'));
    await fixture.whenStable();
    component.typeFile = 'Image';

    const createSpy = spyOn(document, 'createElement');
    const file = new File(['img'], 'photo.png', { type: 'image/png' });
    component.getFileDuration(file);

    expect(createSpy).not.toHaveBeenCalled();
  });

  it('getFileDuration — onloadedmetadata → fileDuration mis à jour', async () => {
    createComponent(makeInstruction('Son'));
    await fixture.whenStable();
    component.typeFile = 'Son';

    let metaHandler: any = null;
    const mockMedia = {
      src: '',
      preload: '',
      set onloadedmetadata(fn: any) { metaHandler = fn; },
      get onloadedmetadata() { return metaHandler; },
      duration: 42
    };
    spyOn(document, 'createElement').and.returnValue(mockMedia as any);

    const file = new File(['snd'], 'son.mp3', { type: 'audio/mpeg' });
    component.getFileDuration(file);
    metaHandler();

    expect(component.fileDuration).toBe(42);
  });
});