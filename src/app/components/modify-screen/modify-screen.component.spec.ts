import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModifyScreenComponent } from './modify-screen.component';
import { UpdateScreensService } from '../../services/updateScreens/update-screens.service';
import { SaveService } from '../../services/save/save.service';
import { AutoSaveService } from '../../services/auto-save/auto-save.service';
import { IndexedDBService } from '../../services/indexedDB/indexed-db.service';
import { FlashService } from '../../services/flash-message/flash.service';
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
  let flashSpy: jasmine.SpyObj<FlashService>;

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
      'getFile', 'addFile', 'updateFile', 'deleteFile', 'getAllFiles', 'incrementRef', 'releaseFile'
    ]);
    flashSpy = jasmine.createSpyObj('FlashService', ['show']);

    saveSpy.getEvalName.and.returnValue('TestProject');
    idbSpy.getFile.and.returnValue(Promise.reject(new Error('not found')));
    idbSpy.addFile.and.returnValue(Promise.resolve());
    idbSpy.updateFile.and.returnValue(Promise.resolve());
    idbSpy.deleteFile.and.returnValue(Promise.resolve());
    idbSpy.getAllFiles.and.returnValue(Promise.resolve([]));
    idbSpy.incrementRef.and.returnValue(Promise.resolve());
    idbSpy.releaseFile.and.returnValue(Promise.resolve());

    updateScreenSpy.updateTransitionScreen.and.callFake((s: any, name: string) => { s.name = name; return s; });
    updateScreenSpy.updateInstructionScreen.and.callFake((s: any, name: string) => { s.name = name; return s; });
    updateScreenSpy.updateStimuliScreen.and.callFake((s: any, name: string) => { s.name = name; return s; });

    await TestBed.configureTestingModule({
      imports: [ModifyScreenComponent],
      providers: [
        { provide: UpdateScreensService, useValue: updateScreenSpy },
        { provide: SaveService, useValue: saveSpy },
        { provide: AutoSaveService, useValue: autoSaveSpy },
        { provide: IndexedDBService, useValue: idbSpy },
        { provide: FlashService, useValue: flashSpy }
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

  it('ngOnInit — IDB retourne mauvais type pour image → haveInstructionFile false', async () => {
    idbSpy.getFile.and.returnValue(Promise.resolve({
      id: 'TestProject/photo.png', file: new File([''], 'photo.png'), type: 'sound', lastEdit: new Date()
    } as any));
    idbSpy.getAllFiles.and.returnValue(Promise.resolve([]));

    createComponent(makeInstruction('Image', 'photo.png', 'TestProject/photo.png'));
    await fixture.whenStable();

    expect(component.haveInstructionFile).toBeFalse();
  });

  it('ngOnInit — IDB retourne Blob (pas File) pour image → crée File → haveInstructionFile true', async () => {
    const blob = new Blob(['img'], { type: 'image/png' });
    idbSpy.getFile.and.returnValue(Promise.resolve({
      id: 'TestProject/photo.png', file: blob, type: 'image', lastEdit: new Date()
    } as any));

    createComponent(makeInstruction('Image', 'photo.png', 'TestProject/photo.png'));
    await fixture.whenStable();

    expect(component.haveInstructionFile).toBeTrue();
  });

  it('ngOnInit — image fallback getAllFiles avec File → haveInstructionFile true', async () => {
    const mockFile = new File(['img'], 'photo.png', { type: 'image/png' });
    idbSpy.getFile.and.returnValue(Promise.reject(new Error('not found')));
    idbSpy.getAllFiles.and.returnValue(Promise.resolve([
      { id: 'TestProject/photo.png', file: mockFile, type: 'image', lastEdit: new Date() }
    ] as any));

    createComponent(makeInstruction('Image', 'photo.png', 'TestProject/photo.png'));
    await fixture.whenStable();

    expect(component.haveInstructionFile).toBeTrue();
  });

  it('ngOnInit — image fallback getAllFiles avec Blob (pas File) → crée File → true', async () => {
    const blob = new Blob(['img'], { type: 'image/png' });
    idbSpy.getFile.and.returnValue(Promise.reject(new Error('not found')));
    idbSpy.getAllFiles.and.returnValue(Promise.resolve([
      { id: 'TestProject/photo.png', file: blob, type: 'image', lastEdit: new Date() }
    ] as any));

    createComponent(makeInstruction('Image', 'photo.png', 'TestProject/photo.png'));
    await fixture.whenStable();

    expect(component.haveInstructionFile).toBeTrue();
  });

  it('ngOnInit — son stimuli fallback getAllFiles avec File → haveStimuliSoundFile true', async () => {
    const mockFile = new File(['snd'], 'son.mp3', { type: 'audio/mp3' });
    idbSpy.getFile.and.returnValue(Promise.reject(new Error('not found')));
    idbSpy.getAllFiles.and.returnValue(Promise.resolve([
      { id: 'TestProject/son.mp3', file: mockFile, type: 'sound', lastEdit: new Date() }
    ] as any));

    createComponent(makeStimuli('son.mp3', 'TestProject/son.mp3'));
    await fixture.whenStable();

    expect(component.haveStimuliSoundFile).toBeTrue();
  });

  it('ngOnInit — son stimuli fallback getAllFiles avec Blob (pas File) → true', async () => {
    const blob = new Blob(['snd'], { type: 'audio/mp3' });
    idbSpy.getFile.and.returnValue(Promise.reject(new Error('not found')));
    idbSpy.getAllFiles.and.returnValue(Promise.resolve([
      { id: 'TestProject/son.mp3', file: blob, type: 'sound', lastEdit: new Date() }
    ] as any));

    createComponent(makeStimuli('son.mp3', 'TestProject/son.mp3'));
    await fixture.whenStable();

    expect(component.haveStimuliSoundFile).toBeTrue();
  });

  it('ngOnInit — son stimuli IDB mauvais type → fallback vide → false', async () => {
    idbSpy.getFile.and.returnValue(Promise.resolve({
      id: 'TestProject/son.mp3', file: new File([''], 'son.mp3'), type: 'image', lastEdit: new Date()
    } as any));
    idbSpy.getAllFiles.and.returnValue(Promise.resolve([]));

    createComponent(makeStimuli('son.mp3', 'TestProject/son.mp3'));
    await fixture.whenStable();

    expect(component.haveStimuliSoundFile).toBeFalse();
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

  it('getInstructionFile — addFile échoue (déjà présent) → incrementRef appelé en fallback', async () => {
    createComponent(makeInstruction('Image'));
    await fixture.whenStable();
    idbSpy.addFile.and.returnValue(Promise.reject(new Error('exists')));

    const file = new File(['img'], 'photo.png', { type: 'image/png' });
    const event = { target: { files: [file], value: '' } } as unknown as Event;

    await component.getInstructionFile(event);

    expect(idbSpy.incrementRef).toHaveBeenCalledWith('TestProject/photo.png');
    expect(idbSpy.updateFile).not.toHaveBeenCalled();
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

  it('getStimuliSoundFile — addFile échoue (déjà présent) → incrementRef appelé en fallback', async () => {
    createComponent(makeStimuli());
    await fixture.whenStable();
    idbSpy.addFile.and.returnValue(Promise.reject(new Error('exists')));

    const file = new File(['snd'], 'son.mp3', { type: 'audio/mp3' });
    const event = { target: { files: [file], value: '' } } as unknown as Event;

    await component.getStimuliSoundFile(event);

    expect(idbSpy.incrementRef).toHaveBeenCalledWith('TestProject/son.mp3');
    expect(idbSpy.updateFile).not.toHaveBeenCalled();
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

  it('deleteImageInstruction → releaseFile appelé si imageId présent', async () => {
    createComponent(makeInstruction('Image', 'photo.png', 'TestProject/photo.png'));
    await fixture.whenStable();
    idbSpy.getFile.and.returnValue(Promise.resolve({
      id: 'TestProject/photo.png', file: new File([''], 'photo.png'), type: 'image', lastEdit: new Date(), refCount: 1
    } as any));

    await component.deleteImageInstruction();

    expect(idbSpy.releaseFile).toHaveBeenCalled();
    expect(idbSpy.deleteFile).not.toHaveBeenCalled();
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

  it('deleteSoundStimuli → releaseFile appelé si soundId présent', async () => {
    createComponent(makeStimuli('son.mp3', 'TestProject/son.mp3'));
    await fixture.whenStable();
    idbSpy.getFile.and.returnValue(Promise.resolve({
      id: 'TestProject/son.mp3', file: new File([''], 'son.mp3'), type: 'sound', lastEdit: new Date(), refCount: 1
    } as any));

    await component.deleteSoundStimuli();

    expect(idbSpy.releaseFile).toHaveBeenCalled();
    expect(idbSpy.deleteFile).not.toHaveBeenCalled();
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

  // ─── Barre d'outils ───────────────────────────────────────────────────────────

  /** Construit un écran stimuli avec une grille rows×cols et des cellules personnalisables. */
  function makeStimuliGrid(rows: number, cols: number, cells: { [key: number]: any }): any {
    const screen = makeStimuli();
    screen.values[0] = rows;
    screen.values[1] = cols;
    screen.values[12] = cells;
    return screen;
  }

  function cell(overrides: any = {}): any {
    return { imageName: '', imageId: '', imageFile: undefined, soundName: '', soundId: '', soundFile: undefined, goodAnswer: false, hidden: false, ...overrides };
  }

  // ─── toggleDuplicateMode ────────────────────────────────────────────────────

  it('toggleDuplicateMode — active le mode et désactive les autres modes', async () => {
    createComponent(makeStimuli());
    await fixture.whenStable();
    component.deleteMode = true;
    component.swapMode = true;
    component.multiSelectMode = true;
    component.selectedCells.add(0);

    component.toggleDuplicateMode();

    expect(component.duplicateMode).toBeTrue();
    expect(component.deleteMode).toBeFalse();
    expect(component.swapMode).toBeFalse();
    expect(component.multiSelectMode).toBeFalse();
    expect(component.selectedCells.size).toBe(0);
  });

  it('toggleDuplicateMode — second appel désactive le mode', async () => {
    createComponent(makeStimuli());
    await fixture.whenStable();

    component.toggleDuplicateMode();
    component.toggleDuplicateMode();

    expect(component.duplicateMode).toBeFalse();
  });

  // ─── toggleDeleteMode ───────────────────────────────────────────────────────

  it('toggleDeleteMode — active le mode et désactive les autres', async () => {
    createComponent(makeStimuli());
    await fixture.whenStable();
    component.duplicateMode = true;
    component.swapMode = true;
    component.multiSelectMode = true;

    component.toggleDeleteMode();

    expect(component.deleteMode).toBeTrue();
    expect(component.duplicateMode).toBeFalse();
    expect(component.swapMode).toBeFalse();
    expect(component.multiSelectMode).toBeFalse();
  });

  // ─── toggleSwapMode ─────────────────────────────────────────────────────────

  it('toggleSwapMode — active le mode et réinitialise la source', async () => {
    createComponent(makeStimuli());
    await fixture.whenStable();
    component.duplicateMode = true;
    component.deleteMode = true;

    component.toggleSwapMode();

    expect(component.swapMode).toBeTrue();
    expect(component.swapSourceIndex).toBeNull();
    expect(component.duplicateMode).toBeFalse();
    expect(component.deleteMode).toBeFalse();
  });

  // ─── toggleMultiSelectMode ──────────────────────────────────────────────────

  it('toggleMultiSelectMode — active le mode et vide la sélection', async () => {
    createComponent(makeStimuli());
    await fixture.whenStable();
    component.duplicateMode = true;
    component.deleteMode = true;

    component.toggleMultiSelectMode();

    expect(component.multiSelectMode).toBeTrue();
    expect(component.selectedCells.size).toBe(0);
    expect(component.duplicateMode).toBeFalse();
    expect(component.deleteMode).toBeFalse();
  });

  // ─── onDeleteClick ──────────────────────────────────────────────────────────

  it('onDeleteClick — hors multi-sélection → bascule le mode suppression', async () => {
    createComponent(makeStimuli());
    await fixture.whenStable();
    spyOn(component, 'toggleDeleteMode');

    component.onDeleteClick();

    expect(component.toggleDeleteMode).toHaveBeenCalled();
  });

  it('onDeleteClick — multi-sélection avec cases sélectionnées → supprime la sélection', async () => {
    createComponent(makeStimuliGrid(1, 2, { 0: cell({ imageName: 'a.png' }), 1: cell() }));
    await fixture.whenStable();
    component.multiSelectMode = true;
    component.selectedCells.add(0);

    component.onDeleteClick();

    // une case avec données → confirmation en attente
    expect(component.pendingDeleteCells).toEqual([0]);
  });

  it('onDeleteClick — multi-sélection sans sélection → ne fait rien', async () => {
    createComponent(makeStimuli());
    await fixture.whenStable();
    component.multiSelectMode = true;
    spyOn(component, 'toggleDeleteMode');

    component.onDeleteClick();

    expect(component.toggleDeleteMode).not.toHaveBeenCalled();
    expect(component.pendingDeleteCells).toBeNull();
  });

  // ─── duplicateCell ──────────────────────────────────────────────────────────

  it('duplicateCell — copie image/son et incrémente le refCount des fichiers', async () => {
    const cells = {
      0: cell({ imageName: 'img.png', imageId: 'TestProject/img.png', soundName: 'snd.mp3', soundId: 'TestProject/snd.mp3' }),
      1: cell({ hidden: true })
    };
    createComponent(makeStimuliGrid(1, 2, cells));
    await fixture.whenStable();

    component.duplicateCell(0, 1);

    expect(component.screenToModify.values[12][1].imageId).toBe('TestProject/img.png');
    expect(component.screenToModify.values[12][1].soundId).toBe('TestProject/snd.mp3');
    expect(component.screenToModify.values[12][1].hidden).toBeFalse();
    expect(idbSpy.incrementRef).toHaveBeenCalledWith('TestProject/img.png');
    expect(idbSpy.incrementRef).toHaveBeenCalledWith('TestProject/snd.mp3');
  });

  it('duplicateCell — source sans fichier → aucun incrementRef', async () => {
    const cells = { 0: cell({ imageName: 'libre' }), 1: cell({ hidden: true }) };
    createComponent(makeStimuliGrid(1, 2, cells));
    await fixture.whenStable();

    component.duplicateCell(0, 1);

    expect(idbSpy.incrementRef).not.toHaveBeenCalled();
  });

  it('duplicateCell — source identique à la cible → ne fait rien', async () => {
    const cells = { 0: cell({ imageId: 'TestProject/img.png' }) };
    createComponent(makeStimuliGrid(1, 1, cells));
    await fixture.whenStable();

    component.duplicateCell(0, 0);

    expect(idbSpy.incrementRef).not.toHaveBeenCalled();
  });

  // ─── confirmOverwrite / cancelOverwrite ─────────────────────────────────────

  it('confirmOverwrite — duplique vers la cible en attente puis ferme le mode', async () => {
    const cells = {
      0: cell({ imageId: 'TestProject/img.png' }),
      1: cell({ imageName: 'occupe.png', imageId: 'TestProject/occupe.png' })
    };
    createComponent(makeStimuliGrid(1, 2, cells));
    await fixture.whenStable();
    component.duplicateSourceIndex = 0;
    component.pendingDuplicateTarget = 1;

    component.confirmOverwrite();

    expect(component.screenToModify.values[12][1].imageId).toBe('TestProject/img.png');
    expect(component.pendingDuplicateTarget).toBeNull();
    expect(component.duplicateSourceIndex).toBeNull();
    expect(component.duplicateMode).toBeFalse();
  });

  it('cancelOverwrite — réinitialise la cible en attente', async () => {
    createComponent(makeStimuli());
    await fixture.whenStable();
    component.pendingDuplicateTarget = 1;

    component.cancelOverwrite();

    expect(component.pendingDuplicateTarget).toBeNull();
  });

  // ─── confirmDelete / cancelDelete ───────────────────────────────────────────

  it('confirmDelete — supprime les cases en attente et libère les fichiers', async () => {
    const cells = {
      0: cell({ imageName: 'img.png', imageId: 'TestProject/img.png' }),
      1: cell()
    };
    createComponent(makeStimuliGrid(1, 2, cells));
    await fixture.whenStable();
    idbSpy.getFile.and.returnValue(Promise.resolve({
      id: 'TestProject/img.png', file: new File([''], 'img.png'), type: 'image', lastEdit: new Date(), refCount: 1
    } as any));
    component.pendingDeleteCells = [0];

    component.confirmDelete();
    await fixture.whenStable();

    expect(component.screenToModify.values[12][0].hidden).toBeTrue();
    expect(idbSpy.releaseFile).toHaveBeenCalled();
    expect(component.pendingDeleteCells).toBeNull();
  });

  it('cancelDelete — réinitialise les cases en attente', async () => {
    createComponent(makeStimuli());
    await fixture.whenStable();
    component.pendingDeleteCells = [0, 1];

    component.cancelDelete();

    expect(component.pendingDeleteCells).toBeNull();
  });

  // ─── requestDelete (garde-fou dernière case) ────────────────────────────────

  it('onDeleteClick (multi) — supprimer toutes les cases visibles → warning, aucune suppression', async () => {
    const cells = { 0: cell({ imageName: 'a.png' }), 1: cell({ imageName: 'b.png' }) };
    createComponent(makeStimuliGrid(1, 2, cells));
    await fixture.whenStable();
    component.multiSelectMode = true;
    component.selectedCells.add(0);
    component.selectedCells.add(1);

    component.onDeleteClick();

    expect(flashSpy.show).toHaveBeenCalledWith('warning', jasmine.any(String));
    expect(component.pendingDeleteCells).toBeNull();
  });

  // ─── swapCells ──────────────────────────────────────────────────────────────

  it('swapCells — échange le contenu de deux cases', async () => {
    const cells = { 0: cell({ imageName: 'a.png' }), 1: cell({ imageName: 'b.png' }) };
    createComponent(makeStimuliGrid(1, 2, cells));
    await fixture.whenStable();

    component.swapCells(0, 1);

    expect(component.screenToModify.values[12][0].imageName).toBe('b.png');
    expect(component.screenToModify.values[12][1].imageName).toBe('a.png');
  });

  // ─── openStimuliData — sélection multiple ───────────────────────────────────

  it('openStimuliData — multi-sélection : ajoute puis retire une case de la sélection', async () => {
    createComponent(makeStimuliGrid(1, 2, { 0: cell(), 1: cell() }));
    await fixture.whenStable();
    component.multiSelectMode = true;

    component.openStimuliData(0);
    expect(component.selectedCells.has(0)).toBeTrue();

    component.openStimuliData(0);
    expect(component.selectedCells.has(0)).toBeFalse();
  });

  it('openStimuliData — mode suppression : déclenche requestDelete sur la case', async () => {
    const cells = { 0: cell({ imageName: 'a.png' }), 1: cell() };
    createComponent(makeStimuliGrid(1, 2, cells));
    await fixture.whenStable();
    component.deleteMode = true;

    component.openStimuliData(0);

    expect(component.pendingDeleteCells).toEqual([0]);
  });

  // ─── undo ───────────────────────────────────────────────────────────────────

  it('undo — restaure le dernier snapshot et réinitialise les modes', async () => {
    const cells = { 0: cell({ imageName: 'img.png', imageId: 'TestProject/img.png' }), 1: cell() };
    createComponent(makeStimuliGrid(1, 2, cells));
    await fixture.whenStable();
    idbSpy.getFile.and.returnValue(Promise.resolve({
      id: 'TestProject/img.png', file: new File([''], 'img.png'), type: 'image', lastEdit: new Date(), refCount: 1
    } as any));

    // Suppression (sauvegarde un snapshot), puis undo
    component.pendingDeleteCells = [0];
    component.confirmDelete();
    await fixture.whenStable();
    expect(component.canUndo).toBeTrue();

    component.undo();

    expect(component.screenToModify.values[12][0].imageName).toBe('img.png');
    expect(component.deleteMode).toBeFalse();
    expect(component.duplicateMode).toBeFalse();
  });

  it('undo — sans historique → ne lève pas d\'erreur', async () => {
    createComponent(makeStimuli());
    await fixture.whenStable();

    expect(component.canUndo).toBeFalse();
    expect(() => component.undo()).not.toThrow();
  });

  // ─── zoomIn / zoomOut ───────────────────────────────────────────────────────

  it('zoomIn — augmente cellSize sans dépasser le maximum (160)', async () => {
    createComponent(makeStimuli());
    await fixture.whenStable();
    component.cellSize = 150;

    component.zoomIn();

    expect(component.cellSize).toBe(160); // 150 + 20 plafonné à 160
  });

  it('zoomOut — diminue cellSize sans descendre sous le minimum (40)', async () => {
    createComponent(makeStimuli());
    await fixture.whenStable();
    component.cellSize = 40;

    component.zoomOut();

    expect(component.cellSize).toBe(40); // plancher à 40
  });

  // ─── openStimuliData — mode échange ─────────────────────────────────────────

  it('openStimuliData — mode échange : 1er clic définit la source, 2e clic échange', async () => {
    const cells = { 0: cell({ imageName: 'a.png' }), 1: cell({ imageName: 'b.png' }) };
    createComponent(makeStimuliGrid(1, 2, cells));
    await fixture.whenStable();
    component.swapMode = true;

    component.openStimuliData(0);
    expect(component.swapSourceIndex).toBe(0);

    component.openStimuliData(1);

    expect(component.screenToModify.values[12][0].imageName).toBe('b.png');
    expect(component.screenToModify.values[12][1].imageName).toBe('a.png');
    expect(component.swapMode).toBeFalse();
    expect(component.swapSourceIndex).toBeNull();
  });

  it('openStimuliData — mode échange : re-cliquer la source l\'annule', async () => {
    createComponent(makeStimuliGrid(1, 2, { 0: cell(), 1: cell() }));
    await fixture.whenStable();
    component.swapMode = true;

    component.openStimuliData(0);
    component.openStimuliData(0);

    expect(component.swapSourceIndex).toBeNull();
  });

  // ─── openStimuliData — mode duplication ─────────────────────────────────────

  it('openStimuliData — duplication vers une case vide : duplique directement', async () => {
    const cells = { 0: cell({ imageName: 'a.png', imageId: 'TestProject/a.png' }), 1: cell({ hidden: true }) };
    createComponent(makeStimuliGrid(1, 2, cells));
    await fixture.whenStable();
    component.duplicateMode = true;

    component.openStimuliData(0);
    expect(component.duplicateSourceIndex).toBe(0);

    component.openStimuliData(1);

    expect(component.screenToModify.values[12][1].imageName).toBe('a.png');
    expect(component.duplicateMode).toBeFalse();
  });

  it('openStimuliData — duplication vers une case occupée : demande confirmation', async () => {
    const cells = {
      0: cell({ imageName: 'a.png' }),
      1: cell({ imageName: 'occupe.png' })
    };
    createComponent(makeStimuliGrid(1, 2, cells));
    await fixture.whenStable();
    component.duplicateMode = true;
    component.duplicateSourceIndex = 0;

    component.openStimuliData(1);

    expect(component.pendingDuplicateTarget).toBe(1);
  });

  it('openStimuliData — mode normal : ouvre le panneau de configuration', async () => {
    createComponent(makeStimuliGrid(1, 1, { 0: cell() }));
    await fixture.whenStable();
    spyOn(component, 'openOffcanvasStimuli');

    component.openStimuliData(0);

    expect(component.activeCellIndex).toBe(0);
    expect(component.stimuliOffcanvasReady).toBeTrue();
  });

  // ─── canAddAdjacent ─────────────────────────────────────────────────────────

  it('canAddAdjacent — voisin masqué → true (ajout possible)', async () => {
    const cells = { 0: cell(), 1: cell({ hidden: true }) };
    createComponent(makeStimuliGrid(1, 2, cells));
    await fixture.whenStable();

    expect(component.canAddAdjacent(0, 'right')).toBeTrue();
  });

  it('canAddAdjacent — voisin visible → false (ajout impossible)', async () => {
    const cells = { 0: cell(), 1: cell() };
    createComponent(makeStimuliGrid(1, 2, cells));
    await fixture.whenStable();

    expect(component.canAddAdjacent(0, 'right')).toBeFalse();
  });

  it('canAddAdjacent — voisin hors grille → true', async () => {
    createComponent(makeStimuliGrid(1, 1, { 0: cell() }));
    await fixture.whenStable();

    expect(component.canAddAdjacent(0, 'left')).toBeTrue();
  });

  // ─── addAdjacent ────────────────────────────────────────────────────────────

  function clickEvent(): Event {
    const e = new Event('click');
    spyOn(e, 'stopPropagation');
    return e;
  }

  it('addAdjacent — voisin masqué dans la grille → matérialise la case sans agrandir', async () => {
    const cells = { 0: cell(), 1: cell({ hidden: true }) };
    createComponent(makeStimuliGrid(1, 2, cells));
    await fixture.whenStable();

    component.addAdjacent(clickEvent(), 0, 'right');

    expect(component.screenToModify.values[12][1].hidden).toBeFalse();
    expect(Number(component.screenToModify.values[1])).toBe(2); // pas d'agrandissement
  });

  it('addAdjacent — bas hors grille → ajoute une ligne', async () => {
    createComponent(makeStimuliGrid(1, 1, { 0: cell() }));
    await fixture.whenStable();

    component.addAdjacent(clickEvent(), 0, 'bottom');

    expect(Number(component.screenToModify.values[0])).toBe(2); // +1 ligne
  });

  it('addAdjacent — haut hors grille → ajoute une ligne au-dessus et décale', async () => {
    createComponent(makeStimuliGrid(1, 1, { 0: cell({ imageName: 'base.png' }) }));
    await fixture.whenStable();

    component.addAdjacent(clickEvent(), 0, 'top');

    expect(Number(component.screenToModify.values[0])).toBe(2);
    // l'ancienne case 0 est décalée en bas (index = cols)
    expect(component.screenToModify.values[12][1].imageName).toBe('base.png');
  });

  it('addAdjacent — droite hors grille → ajoute une colonne', async () => {
    createComponent(makeStimuliGrid(1, 1, { 0: cell({ imageName: 'base.png' }) }));
    await fixture.whenStable();

    component.addAdjacent(clickEvent(), 0, 'right');

    expect(Number(component.screenToModify.values[1])).toBe(2);
    expect(component.screenToModify.values[12][0].imageName).toBe('base.png');
  });

  it('addAdjacent — gauche hors grille → ajoute une colonne et décale', async () => {
    createComponent(makeStimuliGrid(1, 1, { 0: cell({ imageName: 'base.png' }) }));
    await fixture.whenStable();

    component.addAdjacent(clickEvent(), 0, 'left');

    expect(Number(component.screenToModify.values[1])).toBe(2);
    // l'ancienne case est décalée à droite (index 1)
    expect(component.screenToModify.values[12][1].imageName).toBe('base.png');
  });

  // ─── getCandidateIds / extractFileNameFromId (entrées atypiques) ────────────

  it('getCandidateIds — entrée null → tableau vide', async () => {
    createComponent(makeStimuli());
    await fixture.whenStable();
    expect((component as any).getCandidateIds(null)).toEqual([]);
  });

  it('getCandidateIds — entrée File → utilise le nom du fichier', async () => {
    createComponent(makeStimuli());
    await fixture.whenStable();
    const file = new File([''], 'photo.png');

    const ids = (component as any).getCandidateIds(file);

    expect(ids).toContain('photo.png');
    expect(ids).toContain('TestProject/photo.png');
  });

  it('getCandidateIds — objet avec id → utilise l\'id', async () => {
    createComponent(makeStimuli());
    await fixture.whenStable();

    const ids = (component as any).getCandidateIds({ id: 'TestProject/x.png' });

    expect(ids).toContain('TestProject/x.png');
  });

  it('extractFileNameFromId — null → chaîne vide', async () => {
    createComponent(makeStimuli());
    await fixture.whenStable();
    expect((component as any).extractFileNameFromId(null)).toBe('');
  });

  it('extractFileNameFromId — File → nom du fichier', async () => {
    createComponent(makeStimuli());
    await fixture.whenStable();
    expect((component as any).extractFileNameFromId(new File([''], 'a.png'))).toBe('a.png');
  });

  it('extractFileNameFromId — chemin avec dossiers → dernier segment', async () => {
    createComponent(makeStimuli());
    await fixture.whenStable();
    expect((component as any).extractFileNameFromId('Projet/sous/fichier.png')).toBe('fichier.png');
  });

  // ─── setInstructionPreview / setStimuliPreview (révocation d'URL) ───────────

  it('setInstructionPreview — remplace une URL existante → révoque l\'ancienne', async () => {
    createComponent(makeInstruction('Image'));
    await fixture.whenStable();

    (component as any).setInstructionPreview('blob:url-1');
    (component as any).setInstructionPreview('blob:url-2');

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:url-1');
    expect(component.instructionFile).toBe('blob:url-2');
  });

  it('setStimuliPreview — URL vide → réinitialise sans conserver d\'objectUrl', async () => {
    createComponent(makeStimuli());
    await fixture.whenStable();

    (component as any).setStimuliPreview('blob:url-1');
    (component as any).setStimuliPreview('');

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:url-1');
    expect(component.stimuliFile).toBe('');
  });

  // ─── resolveStimuliSoundFile (branches Blob et fallback) ────────────────────

  it('checkStimuliSoundFileExist — IDB renvoie un Blob (pas File) → crée un File', async () => {
    createComponent(makeStimuli('son.mp3', 'TestProject/son.mp3'));
    await fixture.whenStable();
    const blob = new Blob(['snd'], { type: 'audio/mp3' });
    idbSpy.getFile.and.returnValue(Promise.resolve({
      id: 'TestProject/son.mp3', file: blob, type: 'sound', lastEdit: new Date(), refCount: 1
    } as any));

    const result = await component.checkStimuliSoundFileExist();

    expect(result).toBeTrue();
    expect(component.screenToModify.values[11] instanceof File).toBeTrue();
  });

  it('checkStimuliSoundFileExist — getFile mauvais type → fallback getAllFiles', async () => {
    createComponent(makeStimuli('son.mp3', 'TestProject/son.mp3'));
    await fixture.whenStable();
    idbSpy.getFile.and.returnValue(Promise.resolve({
      id: 'TestProject/son.mp3', file: new File([''], 'son.mp3'), type: 'image', lastEdit: new Date(), refCount: 1
    } as any));
    idbSpy.getAllFiles.and.returnValue(Promise.resolve([
      { id: 'TestProject/son.mp3', file: new File(['snd'], 'son.mp3'), type: 'sound', lastEdit: new Date(), refCount: 1 }
    ] as any));

    const result = await component.checkStimuliSoundFileExist();

    expect(result).toBeTrue();
  });

  it('checkStimuliSoundFileExist — valeur vide → réinitialise la preview et retourne false', async () => {
    createComponent(makeStimuli('', ''));
    await fixture.whenStable();

    const result = await component.checkStimuliSoundFileExist();

    expect(result).toBeFalse();
    expect(component.stimuliFile).toBe('');
  });
});