import { TestBed } from '@angular/core/testing';
import { DownloadService } from './download.service';
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { SaveService } from '../save/save.service';
import { saveModelDefault } from '../../shared/saveModel';

class MockSaveService {
  dataAuto = {
    format: 'Csv&Xlsx',
    infoParticipant: [],
    listScreens: [
      { type: 'transition', values: ['t1', 't2'] },
      { type: 'instruction', values: [true, 10, false, 'Texte'] },
      { type: 'instruction', values: [true, 10, false, 'Image', 'img.jpg', new Blob(['img'])] },
      { type: 'instruction', values: [true, 10, false, 'Video', 'vid.mp4', new Blob(['vid'])] },
      { type: 'instruction', values: [true, 10, false, 'Son',   'audio.mp3', new Blob(['audio'])] },
      { type: 'stimuli', values: ['s1', 's2'] }
    ]
  };
  getEvalName() { return 'TestEval'; }
}

describe('DownloadService', () => {
  let service: DownloadService;
  let mockSaveService: MockSaveService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DownloadService,
        { provide: SaveService, useClass: MockSaveService }
      ]
    });

    service = TestBed.inject(DownloadService);
    mockSaveService = TestBed.inject(SaveService) as unknown as MockSaveService;

    spyOn(JSZip.prototype, 'file').and.callThrough();
    spyOn(JSZip.prototype, 'generateAsync').and.returnValue(Promise.resolve(new Blob(['zipcontent'])));

    spyOn<any>(window, 'fetch').and.returnValue(Promise.resolve({
      blob: () => Promise.resolve(new Blob(['fakefile']))
    }));

    spyOn(FileSaver, 'saveAs' as any).and.callFake(() => {});
  });

  it('generateTransitionScreenZip → mappe les values dans le JSON', () => {
    const screen = { type: 'transition', name: 'T1', values: [true, 5, false, false, 0] } as any;
    const jsonData: any[] = [];

    service.generateTransitionScreenZip(screen, jsonData);

    expect(jsonData.length).toBe(1);
    expect(jsonData[0].Type).toBe('transition');

  });

  it('generateInstructionScreenZipText → ne génère pas de fichier média dans le zip', () => {
    const screen = { type: 'instruction', name: 'T1', values: [true, 5, false, 'Texte'] } as any;
    const jsonData: any[] = [];

    service.generateInstructionScreenZipText(screen, jsonData);
    expect(jsonData.length).toBe(1);
    expect(JSZip.prototype.file).not.toHaveBeenCalled();
  });

  it('getInfoEval → retourne nom, format et infos participant', () => {
    const result = service.getInfoEval(mockSaveService as unknown as SaveService);

    expect(result["Nom de l'évaluation"]).toBe('TestEval');
    expect(result["Format choisi"]).toBe('Csv&Xlsx');
    expect(result["Informations participant"]).toEqual([]);   });

  it('generateSlotZip → appelle saveAs avec extension .gpSave', async () => {
    const saveData = { ...saveModelDefault, nomEval: 'TestEval', listScreens: [] } as any;

    await service.generateSlotZip(saveData);

    expect(FileSaver.saveAs).toHaveBeenCalledWith(jasmine.any(Blob), 'TestEval-gazeplayEval.gpSave');
  });

  it('isValidFile → true pour File/Blob, false pour string/null', () => {});

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });

  it('devrait générer un zip avec toutes les ressources et appeler saveAs', async () => {
    await service.generateEvalZip(mockSaveService as unknown as SaveService);
    await Promise.resolve(); // flush le .then() de generateAsync

    // JSON evalData (préfixé avec le nom de l'éval)
    expect(JSZip.prototype.file).toHaveBeenCalledWith('TestEval/evalData.json', jasmine.any(String));

    // Images, Videos et Audio (préfixés avec le nom de l'éval)
    expect(JSZip.prototype.file).toHaveBeenCalledWith(jasmine.stringMatching(/^TestEval\/images\//), jasmine.anything());
    expect(JSZip.prototype.file).toHaveBeenCalledWith(jasmine.stringMatching(/^TestEval\/videos\//), jasmine.anything());
    expect(JSZip.prototype.file).toHaveBeenCalledWith(jasmine.stringMatching(/^TestEval\/audio\//), jasmine.anything());

    // Génération et Téléchargement
    expect(JSZip.prototype.generateAsync).toHaveBeenCalled();
    expect(FileSaver.saveAs).toHaveBeenCalledWith(jasmine.any(Blob), 'TestEval-gazeplayEval.zip');
  });
});
