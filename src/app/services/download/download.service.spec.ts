import { TestBed } from '@angular/core/testing';
import { DownloadService } from './download.service';
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { SaveService } from '../save/save.service';
import { IndexedDBService } from '../indexedDB/indexed-db.service';
import { saveModelDefault } from '../../shared/saveModel';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeTransitionScreen(): any {
  return { name: 'T', type: 'transition', values: [true, 5, false, false, 0] };
}

function makeInstructionScreen(typeFile = 'Texte', fileName = '', fileBlob?: Blob, fileId = ''): any {
  return {
    name: 'I', type: 'instruction',
    values: [false, 1, true, typeFile, fileName, fileBlob, false, 1, fileId]
  };
}

function makeStimuliScreen(opts: {
  soundName?: string;
  soundBlob?: Blob;
  soundId?: string;
  stimuliList?: any;
} = {}): any {
  return {
    name: 'S', type: 'stimuli',
    values: [
      1, 1, false, 10, 1, 'Tout', 1, false, false, false,
      opts.soundName ?? '',
      opts.soundBlob  ?? undefined,
      opts.stimuliList ?? {
        0: { imageName: '', imageFile: undefined, soundName: '', soundFile: undefined,
             goodAnswer: false, imageId: '', soundId: '' }
      },
      opts.soundId ?? ''
    ]
  };
}

function makeSaveService(screens: any[] = []): any {
  return {
    dataAuto: { nomEval: 'TestEval', format: 'Csv&Xlsx', infoParticipant: ['Age'], listScreens: screens },
    getEvalName: () => 'TestEval'
  };
}

function makeIdbEntry(id: string, blob: Blob, type: 'image' | 'sound' | 'video'): any {
  return { id, file: blob, type, lastEdit: new Date() };
}

// ─── Suite ──────────────────────────────────────────────────────────────────

describe('DownloadService', () => {
  let service: DownloadService;
  let idbSpy: jasmine.SpyObj<IndexedDBService>;
  let zipFileSpy: jasmine.Spy;

  beforeEach(() => {
    idbSpy = jasmine.createSpyObj('IndexedDBService', ['getFile', 'getAllFiles']);
    idbSpy.getFile.and.returnValue(Promise.reject(new Error('not found')));
    idbSpy.getAllFiles.and.returnValue(Promise.resolve([]));

    TestBed.configureTestingModule({
      providers: [
        DownloadService,
        { provide: IndexedDBService, useValue: idbSpy }
      ]
    });

    service = TestBed.inject(DownloadService);

    zipFileSpy = spyOn(JSZip.prototype, 'file').and.callThrough();
    spyOn(JSZip.prototype, 'generateAsync').and.returnValue(Promise.resolve(new Blob(['zip'])));
    spyOn(FileSaver, 'saveAs' as any).and.callFake(() => {});
  });

  // ─── Création ─────────────────────────────────────────────────────────────

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });

  // ─── isValidFile (méthode privée) ─────────────────────────────────────────

  it('isValidFile — File → true', () => {
    expect((service as any).isValidFile(new File([''], 'f.txt'))).toBeTrue();
  });

  it('isValidFile — Blob → true', () => {
    expect((service as any).isValidFile(new Blob(['data']))).toBeTrue();
  });

  it('isValidFile — string → false', () => {
    expect((service as any).isValidFile('string')).toBeFalse();
  });

  it('isValidFile — null → false', () => {
    expect((service as any).isValidFile(null)).toBeFalse();
  });

  it('isValidFile — undefined → false', () => {
    expect((service as any).isValidFile(undefined)).toBeFalse();
  });

  it('isValidFile — nombre → false', () => {
    expect((service as any).isValidFile(42)).toBeFalse();
  });

  // ─── getInfoEval ──────────────────────────────────────────────────────────

  it('getInfoEval → retourne nom, format et infos participant', () => {
    const result = service.getInfoEval(makeSaveService() as any);
    expect(result["Nom de l'évaluation"]).toBe('TestEval');
    expect(result["Format choisi"]).toBe('Csv&Xlsx');
    expect(result["Informations participant"]).toEqual(['Age']);
  });

  // ─── getInfoEvalFromSlot ──────────────────────────────────────────────────

  it('getInfoEvalFromSlot → retourne nom, format et infos participant depuis saveData', () => {
    const saveData = { ...saveModelDefault, nomEval: 'SlotEval', format: 'Csv' as any, infoParticipant: ['Nom'] };
    const result = service.getInfoEvalFromSlot(saveData);
    expect(result["Nom de l'évaluation"]).toBe('SlotEval');
    expect(result["Format choisi"]).toBe('Csv');
    expect(result["Informations participant"]).toEqual(['Nom']);
  });

  // ─── generateTransitionScreenZip ─────────────────────────────────────────

  it('generateTransitionScreenZip → pousse une entrée JSON avec Type=transition et les bonnes clés', () => {
    const jsonData: any[] = [];
    service.generateTransitionScreenZip(makeTransitionScreen(), jsonData);

    expect(jsonData.length).toBe(1);
    expect(jsonData[0].Type).toBe('transition');
    expect(jsonData[0]["Mettre un temps avant passage à l'écran suivant"]).toBeTrue();
    expect(jsonData[0]["Combien de temps"]).toBe(5);
  });

  it('generateTransitionScreenZip → ne modifie pas le tableau original', () => {
    const screen = makeTransitionScreen();
    const originalValues = [...screen.values];
    service.generateTransitionScreenZip(screen, []);
    expect(screen.values).toEqual(originalValues);
  });

  // ─── generateInstructionScreenZipText ────────────────────────────────────

  it('generateInstructionScreenZipText → pousse JSON avec Type=instruction sans fichier zip', () => {
    const jsonData: any[] = [];
    service.generateInstructionScreenZipText(makeInstructionScreen('Texte'), jsonData);

    expect(jsonData.length).toBe(1);
    expect(jsonData[0].Type).toBe('instruction');
    expect(zipFileSpy).not.toHaveBeenCalled();
  });

  // ─── generateInstructionScreenZipImg ─────────────────────────────────────

  it('generateInstructionScreenZipImg — blob en mémoire → zip.file pour images/ et JSON poussé', async () => {
    const blob = new Blob(['img'], { type: 'image/png' });
    const jsonData: any[] = [];
    const zip = new JSZip();
    const values = [false, 1, true, 'Image', 'photo.png', blob, false, 1, ''];

    await service.generateInstructionScreenZipImg('TestEval', values, jsonData, zip);

    expect(zipFileSpy).toHaveBeenCalledWith('TestEval/images/photo.png', jasmine.anything());
    expect(jsonData[0].Type).toBe('instruction');
    expect(idbSpy.getFile).not.toHaveBeenCalled();
  });

  it('generateInstructionScreenZipImg — pas de blob mais IDB → getFile + zip.file', async () => {
    const idbBlob = new Blob(['img'], { type: 'image/png' });
    idbSpy.getFile.and.returnValue(Promise.resolve(makeIdbEntry('TestEval/photo.png', idbBlob, 'image')));
    const jsonData: any[] = [];
    const zip = new JSZip();
    const values = [false, 1, true, 'Image', 'photo.png', undefined, false, 1, 'TestEval/photo.png'];

    await service.generateInstructionScreenZipImg('TestEval', values, jsonData, zip);

    expect(idbSpy.getFile).toHaveBeenCalledWith('TestEval/photo.png');
    expect(zipFileSpy).toHaveBeenCalledWith('TestEval/images/photo.png', jasmine.anything());
  });

  it('generateInstructionScreenZipImg — aucun fichier → zip.file non appelé pour images/, JSON toujours poussé', async () => {
    const jsonData: any[] = [];
    const zip = new JSZip();
    const values = [false, 1, true, 'Image', '', undefined, false, 1, ''];

    await service.generateInstructionScreenZipImg('TestEval', values, jsonData, zip);

    expect(zipFileSpy).not.toHaveBeenCalledWith(jasmine.stringMatching(/images/), jasmine.anything());
    expect(jsonData.length).toBe(1);
  });

  // ─── generateInstructionScreenZipVideo ───────────────────────────────────

  it('generateInstructionScreenZipVideo — blob en mémoire → zip.file pour videos/ et JSON poussé', async () => {
    const blob = new Blob(['vid'], { type: 'video/mp4' });
    const jsonData: any[] = [];
    const zip = new JSZip();
    const values = [false, 1, true, 'Video', 'video.mp4', blob, false, 1, ''];

    await service.generateInstructionScreenZipVideo('TestEval', values, jsonData, zip);

    expect(zipFileSpy).toHaveBeenCalledWith('TestEval/videos/video.mp4', jasmine.anything());
    expect(jsonData[0].Type).toBe('instruction');
    expect(idbSpy.getFile).not.toHaveBeenCalled();
  });

  it('generateInstructionScreenZipVideo — pas de blob mais IDB → getFile + zip.file pour videos/', async () => {
    const idbBlob = new Blob(['vid'], { type: 'video/mp4' });
    idbSpy.getFile.and.returnValue(Promise.resolve(makeIdbEntry('TestEval/video.mp4', idbBlob, 'video')));
    const jsonData: any[] = [];
    const zip = new JSZip();
    const values = [false, 1, true, 'Video', 'video.mp4', undefined, false, 1, 'TestEval/video.mp4'];

    await service.generateInstructionScreenZipVideo('TestEval', values, jsonData, zip);

    expect(idbSpy.getFile).toHaveBeenCalled();
    expect(zipFileSpy).toHaveBeenCalledWith('TestEval/videos/video.mp4', jasmine.anything());
  });

  it('generateInstructionScreenZipVideo — aucun fichier → pas de zip.file pour videos/', async () => {
    const jsonData: any[] = [];
    const zip = new JSZip();
    const values = [false, 1, true, 'Video', '', undefined, false, 1, ''];

    await service.generateInstructionScreenZipVideo('TestEval', values, jsonData, zip);

    expect(zipFileSpy).not.toHaveBeenCalledWith(jasmine.stringMatching(/videos/), jasmine.anything());
    expect(jsonData.length).toBe(1);
  });

  // ─── generateInstructionScreenZipSound ───────────────────────────────────

  it('generateInstructionScreenZipSound — blob en mémoire → zip.file pour audio/ et JSON poussé', async () => {
    const blob = new Blob(['snd'], { type: 'audio/mp3' });
    const jsonData: any[] = [];
    const zip = new JSZip();
    const values = [false, 1, true, 'Son', 'son.mp3', blob, false, 1, ''];

    await service.generateInstructionScreenZipSound('TestEval', values, jsonData, zip);

    expect(zipFileSpy).toHaveBeenCalledWith('TestEval/audio/son.mp3', jasmine.anything());
    expect(jsonData[0].Type).toBe('instruction');
    expect(idbSpy.getFile).not.toHaveBeenCalled();
  });

  it('generateInstructionScreenZipSound — pas de blob mais IDB → getFile + zip.file pour audio/', async () => {
    const idbBlob = new Blob(['snd'], { type: 'audio/mp3' });
    idbSpy.getFile.and.returnValue(Promise.resolve(makeIdbEntry('TestEval/son.mp3', idbBlob, 'sound')));
    const jsonData: any[] = [];
    const zip = new JSZip();
    const values = [false, 1, true, 'Son', 'son.mp3', undefined, false, 1, 'TestEval/son.mp3'];

    await service.generateInstructionScreenZipSound('TestEval', values, jsonData, zip);

    expect(idbSpy.getFile).toHaveBeenCalled();
    expect(zipFileSpy).toHaveBeenCalledWith('TestEval/audio/son.mp3', jasmine.anything());
  });

  it('generateInstructionScreenZipSound — aucun fichier → pas de zip.file pour audio/, JSON poussé', async () => {
    const jsonData: any[] = [];
    const zip = new JSZip();
    const values = [false, 1, true, 'Son', '', undefined, false, 1, ''];

    await service.generateInstructionScreenZipSound('TestEval', values, jsonData, zip);

    expect(zipFileSpy).not.toHaveBeenCalledWith(jasmine.stringMatching(/audio/), jasmine.anything());
    expect(jsonData.length).toBe(1);
  });

  // ─── generateStimuliScreenZip ─────────────────────────────────────────────

  it('generateStimuliScreenZip — image en mémoire → zip.file pour images/ et JSON poussé', async () => {
    const imgBlob = new Blob(['img'], { type: 'image/png' });
    const screen = makeStimuliScreen({
      stimuliList: { 0: { imageName: 'photo.png', imageFile: imgBlob, soundName: '', soundFile: undefined,
                          goodAnswer: true, imageId: '', soundId: '' } }
    });
    const jsonData: any[] = [];

    await service.generateStimuliScreenZip('TestEval', screen, jsonData, new JSZip());

    expect(zipFileSpy).toHaveBeenCalledWith('TestEval/images/photo.png', jasmine.anything());
    expect(jsonData[0].Type).toBe('stimuli');
  });

  it('generateStimuliScreenZip — son de cellule en mémoire → zip.file pour audio/', async () => {
    const sndBlob = new Blob(['snd'], { type: 'audio/mp3' });
    const screen = makeStimuliScreen({
      stimuliList: { 0: { imageName: '', imageFile: undefined, soundName: 'son.mp3', soundFile: sndBlob,
                          goodAnswer: false, imageId: '', soundId: '' } }
    });
    const jsonData: any[] = [];

    await service.generateStimuliScreenZip('TestEval', screen, jsonData, new JSZip());

    expect(zipFileSpy).toHaveBeenCalledWith('TestEval/audio/son.mp3', jasmine.anything());
  });

  it('generateStimuliScreenZip — son global en mémoire → zip.file pour audio/', async () => {
    const sndBlob = new Blob(['snd'], { type: 'audio/mp3' });
    const screen = makeStimuliScreen({ soundName: 'global.mp3', soundBlob: sndBlob });
    const jsonData: any[] = [];

    await service.generateStimuliScreenZip('TestEval', screen, jsonData, new JSZip());

    expect(zipFileSpy).toHaveBeenCalledWith('TestEval/audio/global.mp3', jasmine.anything());
  });

  it('generateStimuliScreenZip — image depuis IDB → getFile + zip.file pour images/', async () => {
    const idbBlob = new Blob(['img'], { type: 'image/png' });
    idbSpy.getFile.and.returnValue(Promise.resolve(makeIdbEntry('TestEval/photo.png', idbBlob, 'image')));
    const screen = makeStimuliScreen({
      stimuliList: { 0: { imageName: 'photo.png', imageFile: undefined, soundName: '', soundFile: undefined,
                          goodAnswer: false, imageId: 'TestEval/photo.png', soundId: '' } }
    });
    const jsonData: any[] = [];

    await service.generateStimuliScreenZip('TestEval', screen, jsonData, new JSZip());

    expect(idbSpy.getFile).toHaveBeenCalled();
    expect(zipFileSpy).toHaveBeenCalledWith('TestEval/images/photo.png', jasmine.anything());
  });

  it('generateStimuliScreenZip — son global depuis IDB → getFile + zip.file pour audio/', async () => {
    const idbBlob = new Blob(['snd'], { type: 'audio/mp3' });
    idbSpy.getFile.and.returnValue(Promise.resolve(makeIdbEntry('TestEval/global.mp3', idbBlob, 'sound')));
    const screen = makeStimuliScreen({ soundName: 'global.mp3', soundId: 'TestEval/global.mp3' });
    const jsonData: any[] = [];

    await service.generateStimuliScreenZip('TestEval', screen, jsonData, new JSZip());

    expect(zipFileSpy).toHaveBeenCalledWith('TestEval/audio/global.mp3', jasmine.anything());
  });

  it('generateStimuliScreenZip — cellule vide → aucun zip.file pour images/ ou audio/ de cellule', async () => {
    const screen = makeStimuliScreen();  // imageName et soundName vides
    const jsonData: any[] = [];

    await service.generateStimuliScreenZip('TestEval', screen, jsonData, new JSZip());

    const calls = zipFileSpy.calls.allArgs().map(a => a[0] as string);
    expect(calls.some(p => p.includes('images/'))).toBeFalse();
    expect(jsonData.length).toBe(1);
  });

  // ─── generateInstructionScreenZipSlot ─────────────────────────────────────

  it('generateInstructionScreenZipSlot — type Image depuis IDB → zip.file pour images/', async () => {
    const blob = new Blob(['img'], { type: 'image/png' });
    idbSpy.getFile.and.returnValue(Promise.resolve(makeIdbEntry('TestEval/photo.png', blob, 'image')));
    const screen = makeInstructionScreen('Image', 'photo.png', undefined, 'TestEval/photo.png');
    const jsonData: any[] = [];

    await service.generateInstructionScreenZipSlot(screen, jsonData, 'TestEval', new JSZip());

    expect(zipFileSpy).toHaveBeenCalledWith('TestEval/images/photo.png', jasmine.anything());
    expect(jsonData[0].Type).toBe('instruction');
  });

  it('generateInstructionScreenZipSlot — type Video depuis IDB → zip.file pour videos/', async () => {
    const blob = new Blob(['vid'], { type: 'video/mp4' });
    idbSpy.getFile.and.returnValue(Promise.resolve(makeIdbEntry('TestEval/video.mp4', blob, 'video')));
    const screen = makeInstructionScreen('Video', 'video.mp4', undefined, 'TestEval/video.mp4');
    const jsonData: any[] = [];

    await service.generateInstructionScreenZipSlot(screen, jsonData, 'TestEval', new JSZip());

    expect(zipFileSpy).toHaveBeenCalledWith('TestEval/videos/video.mp4', jasmine.anything());
  });

  it('generateInstructionScreenZipSlot — type Son depuis IDB → zip.file pour audio/', async () => {
    const blob = new Blob(['snd'], { type: 'audio/mp3' });
    idbSpy.getFile.and.returnValue(Promise.resolve(makeIdbEntry('TestEval/son.mp3', blob, 'sound')));
    const screen = makeInstructionScreen('Son', 'son.mp3', undefined, 'TestEval/son.mp3');
    const jsonData: any[] = [];

    await service.generateInstructionScreenZipSlot(screen, jsonData, 'TestEval', new JSZip());

    expect(zipFileSpy).toHaveBeenCalledWith('TestEval/audio/son.mp3', jasmine.anything());
  });

  it('generateInstructionScreenZipSlot — type Texte → getFile non appelé, JSON poussé', async () => {
    const screen = makeInstructionScreen('Texte', 'Bonjour');
    const jsonData: any[] = [];

    await service.generateInstructionScreenZipSlot(screen, jsonData, 'TestEval', new JSZip());

    expect(idbSpy.getFile).not.toHaveBeenCalled();
    expect(jsonData[0].Type).toBe('instruction');
  });

  it('generateInstructionScreenZipSlot — nom de fichier vide → getFile non appelé', async () => {
    const screen = makeInstructionScreen('Image', '');
    const jsonData: any[] = [];

    await service.generateInstructionScreenZipSlot(screen, jsonData, 'TestEval', new JSZip());

    expect(idbSpy.getFile).not.toHaveBeenCalled();
  });

  // ─── generateStimuliScreenZipSlot ─────────────────────────────────────────

  it('generateStimuliScreenZipSlot — image depuis IDB → zip.file pour images/ et JSON poussé', async () => {
    const blob = new Blob(['img'], { type: 'image/png' });
    idbSpy.getFile.and.returnValue(Promise.resolve(makeIdbEntry('TestEval/photo.png', blob, 'image')));
    const screen = makeStimuliScreen({
      stimuliList: { 0: { imageName: 'photo.png', imageFile: undefined, soundName: '', soundFile: undefined,
                          goodAnswer: false, imageId: 'TestEval/photo.png', soundId: '' } }
    });
    const jsonData: any[] = [];

    await service.generateStimuliScreenZipSlot(screen, jsonData, 'TestEval', new JSZip());

    expect(zipFileSpy).toHaveBeenCalledWith('TestEval/images/photo.png', jasmine.anything());
    expect(jsonData[0].Type).toBe('stimuli');
  });

  it('generateStimuliScreenZipSlot — son de cellule en mémoire → zip.file pour audio/', async () => {
    const sndBlob = new Blob(['snd'], { type: 'audio/mp3' });
    const screen = makeStimuliScreen({
      stimuliList: { 0: { imageName: '', imageFile: undefined, soundName: 'son.mp3', soundFile: sndBlob,
                          goodAnswer: false, imageId: '', soundId: '' } }
    });
    const jsonData: any[] = [];

    await service.generateStimuliScreenZipSlot(screen, jsonData, 'TestEval', new JSZip());

    expect(zipFileSpy).toHaveBeenCalledWith('TestEval/audio/son.mp3', jasmine.anything());
  });

  it('generateStimuliScreenZipSlot — son global depuis IDB → zip.file pour audio/', async () => {
    const sndBlob = new Blob(['snd'], { type: 'audio/mp3' });
    idbSpy.getFile.and.returnValue(Promise.resolve(makeIdbEntry('TestEval/global.mp3', sndBlob, 'sound')));
    const screen = makeStimuliScreen({ soundName: 'global.mp3', soundId: 'TestEval/global.mp3' });
    const jsonData: any[] = [];

    await service.generateStimuliScreenZipSlot(screen, jsonData, 'TestEval', new JSZip());

    expect(zipFileSpy).toHaveBeenCalledWith('TestEval/audio/global.mp3', jasmine.anything());
  });

  it('generateStimuliScreenZipSlot — cellule vide → JSON poussé sans fichier media', async () => {
    const screen = makeStimuliScreen();
    const jsonData: any[] = [];

    await service.generateStimuliScreenZipSlot(screen, jsonData, 'TestEval', new JSZip());

    expect(jsonData[0].Type).toBe('stimuli');
    const calls = zipFileSpy.calls.allArgs().map(a => a[0] as string);
    expect(calls.some(p => p.includes('images/') || p.includes('audio/'))).toBeFalse();
  });

  // ─── generateEvalZip ──────────────────────────────────────────────────────

  it('generateEvalZip — liste vide → evalData.json + evalInfo.json + saveAs .zip', async () => {
    await service.generateEvalZip(makeSaveService([]) as any);
    await Promise.resolve();

    expect(zipFileSpy).toHaveBeenCalledWith('TestEval/evalData.json', jasmine.any(String));
    expect(zipFileSpy).toHaveBeenCalledWith('TestEval/evalInfo.json', jasmine.any(String));
    expect(JSZip.prototype.generateAsync).toHaveBeenCalled();
    expect(FileSaver.saveAs).toHaveBeenCalledWith(jasmine.any(Blob), 'TestEval-gazeplayEval.zip');
  });

  it('generateEvalZip — écran transition → generateTransitionScreenZip appelé', async () => {
    spyOn(service, 'generateTransitionScreenZip').and.callThrough();
    await service.generateEvalZip(makeSaveService([makeTransitionScreen()]) as any);
    await Promise.resolve();
    expect(service.generateTransitionScreenZip).toHaveBeenCalled();
  });

  it('generateEvalZip — instruction Texte → generateInstructionScreenZipText appelé', async () => {
    spyOn(service, 'generateInstructionScreenZipText').and.callThrough();
    await service.generateEvalZip(makeSaveService([makeInstructionScreen('Texte', 'Hello')]) as any);
    await Promise.resolve();
    expect(service.generateInstructionScreenZipText).toHaveBeenCalled();
  });

  it('generateEvalZip — instruction Image avec blob → zip.file pour images/', async () => {
    const blob = new Blob(['img'], { type: 'image/png' });
    const ss = makeSaveService([makeInstructionScreen('Image', 'photo.png', blob)]);
    await service.generateEvalZip(ss as any);
    await Promise.resolve();
    expect(zipFileSpy).toHaveBeenCalledWith('TestEval/images/photo.png', jasmine.anything());
  });

  it('generateEvalZip — instruction Video avec blob → zip.file pour videos/', async () => {
    const blob = new Blob(['vid'], { type: 'video/mp4' });
    const ss = makeSaveService([makeInstructionScreen('Video', 'video.mp4', blob)]);
    await service.generateEvalZip(ss as any);
    await Promise.resolve();
    expect(zipFileSpy).toHaveBeenCalledWith('TestEval/videos/video.mp4', jasmine.anything());
  });

  it('generateEvalZip — instruction Son avec blob → zip.file pour audio/', async () => {
    const blob = new Blob(['snd'], { type: 'audio/mp3' });
    const ss = makeSaveService([makeInstructionScreen('Son', 'son.mp3', blob)]);
    await service.generateEvalZip(ss as any);
    await Promise.resolve();
    expect(zipFileSpy).toHaveBeenCalledWith('TestEval/audio/son.mp3', jasmine.anything());
  });

  it('generateEvalZip — écran stimuli → generateStimuliScreenZip appelé', async () => {
    spyOn(service, 'generateStimuliScreenZip').and.callThrough();
    await service.generateEvalZip(makeSaveService([makeStimuliScreen()]) as any);
    await Promise.resolve();
    expect(service.generateStimuliScreenZip).toHaveBeenCalled();
  });

  it('generateEvalZip — plusieurs types d\'écrans → tous traités et zip généré', async () => {
    const imgBlob = new Blob(['img'], { type: 'image/png' });
    const ss = makeSaveService([
      makeTransitionScreen(),
      makeInstructionScreen('Texte', 'Bonjour'),
      makeInstructionScreen('Image', 'img.png', imgBlob),
      makeStimuliScreen()
    ]);
    await service.generateEvalZip(ss as any);
    await Promise.resolve();

    expect(zipFileSpy).toHaveBeenCalledWith('TestEval/evalData.json', jasmine.any(String));
    expect(FileSaver.saveAs).toHaveBeenCalledWith(jasmine.any(Blob), 'TestEval-gazeplayEval.zip');
  });

  // ─── generateSlotZip ──────────────────────────────────────────────────────

  it('generateSlotZip — liste vide → saveAs avec .gpSave', async () => {
    const saveData = { ...saveModelDefault, nomEval: 'SlotEval', listScreens: [] };
    await service.generateSlotZip(saveData);
    expect(FileSaver.saveAs).toHaveBeenCalledWith(jasmine.any(Blob), 'SlotEval-gazeplayEval.gpSave');
  });

  it('generateSlotZip — nomEval vide → utilise GazePlayEvalDefaultName', async () => {
    const saveData = { ...saveModelDefault, nomEval: '', listScreens: [] };
    await service.generateSlotZip(saveData);
    expect(FileSaver.saveAs).toHaveBeenCalledWith(jasmine.any(Blob), 'GazePlayEvalDefaultName-gazeplayEval.gpSave');
  });

  it('generateSlotZip — transition + instruction + stimuli → evalData.json et evalInfo.json générés', async () => {
    const saveData = {
      ...saveModelDefault,
      nomEval: 'Full',
      listScreens: [
        makeTransitionScreen(),
        makeInstructionScreen('Texte', 'Hello'),
        makeStimuliScreen()
      ]
    };
    await service.generateSlotZip(saveData);
    expect(zipFileSpy).toHaveBeenCalledWith('Full/evalData.json', jasmine.any(String));
    expect(zipFileSpy).toHaveBeenCalledWith('Full/evalInfo.json', jasmine.any(String));
  });

  it('generateSlotZip — instruction Image depuis IDB → zip.file pour images/', async () => {
    const blob = new Blob(['img'], { type: 'image/png' });
    idbSpy.getFile.and.returnValue(Promise.resolve(makeIdbEntry('Full/img.png', blob, 'image')));
    const saveData = {
      ...saveModelDefault,
      nomEval: 'Full',
      listScreens: [makeInstructionScreen('Image', 'img.png', undefined, 'Full/img.png')]
    };
    await service.generateSlotZip(saveData);
    expect(zipFileSpy).toHaveBeenCalledWith('Full/images/img.png', jasmine.anything());
  });
});
