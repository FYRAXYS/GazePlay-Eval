import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfigStimuliComponent } from './config-stimuli.component';
import { MatDialog } from '@angular/material/dialog';
import { IndexedDBService } from '../../services/indexedDB/indexed-db.service';
import { SaveService } from '../../services/save/save.service';
import { AutoSaveService } from '../../services/auto-save/auto-save.service';
import { DomSanitizer } from '@angular/platform-browser';
import { of } from 'rxjs';
import { stimuliScreenValues } from '../../shared/screenModel';

function makeCell(overrides: Partial<stimuliScreenValues> = {}): stimuliScreenValues {
  return {
    imageName: '', imageFile: undefined, imageId: '',
    soundName: '', soundFile: undefined, soundId: '',
    goodAnswer: false,
    ...overrides
  };
}

describe('ConfigStimuliComponent', () => {
  let component: ConfigStimuliComponent;
  let fixture: ComponentFixture<ConfigStimuliComponent>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let idbServiceSpy: jasmine.SpyObj<IndexedDBService>;
  let saveServiceSpy: jasmine.SpyObj<SaveService>;
  let autoSaveSpy: jasmine.SpyObj<AutoSaveService>;
  let sanitizer: DomSanitizer;

  beforeEach(async () => {
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    idbServiceSpy = jasmine.createSpyObj('IndexedDBService', ['getFile', 'addFile', 'updateFile', 'deleteFile', 'getAllFiles']);
    saveServiceSpy = jasmine.createSpyObj('SaveService', ['getEvalName']);
    autoSaveSpy = jasmine.createSpyObj('AutoSaveService', ['autoSave']);

    idbServiceSpy.getFile.and.returnValue(Promise.reject(new Error('not found')));
    idbServiceSpy.addFile.and.returnValue(Promise.resolve());
    idbServiceSpy.updateFile.and.returnValue(Promise.resolve());
    idbServiceSpy.deleteFile.and.returnValue(Promise.resolve());
    idbServiceSpy.getAllFiles.and.returnValue(Promise.resolve([]));
    saveServiceSpy.getEvalName.and.returnValue('TestProject');
    dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as any);

    await TestBed.configureTestingModule({
      imports: [ConfigStimuliComponent],
      providers: [
        { provide: MatDialog, useValue: dialogSpy },
        { provide: IndexedDBService, useValue: idbServiceSpy },
        { provide: SaveService, useValue: saveServiceSpy },
        { provide: AutoSaveService, useValue: autoSaveSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigStimuliComponent);
    component = fixture.componentInstance;
    sanitizer = TestBed.inject(DomSanitizer);

    component.data = { cell: 0, screen: { 0: makeCell() } };
    spyOn(URL, 'createObjectURL').and.returnValue('blob:fake-url');
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

  // ─── checkCell ────────────────────────────────────────────────────────────

  it('checkCell — imageFile déjà un Blob → previewImage défini sans appel IDB', async () => {
    const blob = new Blob(['img'], { type: 'image/png' });
    component.data.screen[0].imageFile = blob as File;
    idbServiceSpy.getFile.calls.reset();
    const sanitizerSpy = spyOn(sanitizer, 'bypassSecurityTrustUrl').and.returnValue('safe-url' as any);

    await component.checkCell();

    expect(idbServiceSpy.getFile).not.toHaveBeenCalled();
    expect(sanitizerSpy).toHaveBeenCalled();
    expect(component.previewImage as string).toBe('safe-url');
  });

  it('checkCell — imageId présent sans imageFile → getFile appelé et imageFile mis à jour', async () => {
    component.data.screen[0].imageId = 'TestProject/img.png';
    component.data.screen[0].imageFile = undefined;
    const mockFile = new File(['img'], 'img.png', { type: 'image/png' });
    idbServiceSpy.getFile.and.returnValue(Promise.resolve({
      id: 'TestProject/img.png', file: mockFile, type: 'image', lastEdit: new Date()
    } as any));

    await component.checkCell();

    expect(idbServiceSpy.getFile).toHaveBeenCalled();
    expect(component.data.screen[0].imageFile).toBeTruthy();
  });

  it('checkCell — soundFile déjà un Blob → previewSound défini sans appel IDB', async () => {
    const blob = new Blob(['snd'], { type: 'audio/mp3' });
    component.data.screen[0].soundFile = blob as File;
    idbServiceSpy.getFile.calls.reset();

    await component.checkCell();

    expect(idbServiceSpy.getFile).not.toHaveBeenCalled();
    expect(component.previewSound).toBe('blob:fake-url');
  });

  it('checkCell — soundId présent sans soundFile → getFile appelé et soundFile mis à jour', async () => {
    component.data.screen[0].soundId = 'TestProject/snd.mp3';
    component.data.screen[0].soundFile = undefined;
    const mockFile = new File(['snd'], 'snd.mp3', { type: 'audio/mp3' });
    idbServiceSpy.getFile.and.returnValue(Promise.resolve({
      id: 'TestProject/snd.mp3', file: mockFile, type: 'sound', lastEdit: new Date()
    } as any));

    await component.checkCell();

    expect(idbServiceSpy.getFile).toHaveBeenCalled();
    expect(component.data.screen[0].soundFile).toBeTruthy();
  });

  // ─── deleteImage ──────────────────────────────────────────────────────────

  it('deleteImage → réinitialise imageId/imageName/imageFile et appelle autoSave', async () => {
    component.data.screen[0].imageId = 'TestProject/img.png';
    component.data.screen[0].imageName = 'img.png';
    component.data.screen[0].imageFile = new File([''], 'img.png') as any;

    await component.deleteImage();

    expect(component.data.screen[0].imageId).toBe('');
    expect(component.data.screen[0].imageName).toBe('');
    expect(component.data.screen[0].imageFile).toBeUndefined();
    expect(autoSaveSpy.autoSave).toHaveBeenCalledWith('stimuli');
  });

  // ─── deleteSound ──────────────────────────────────────────────────────────

  it('deleteSound → réinitialise soundId/soundName/soundFile et appelle autoSave', async () => {
    component.data.screen[0].soundId = 'TestProject/snd.mp3';
    component.data.screen[0].soundName = 'snd.mp3';

    await component.deleteSound();

    expect(component.data.screen[0].soundId).toBe('');
    expect(component.data.screen[0].soundName).toBe('');
    expect(component.data.screen[0].soundFile).toBeUndefined();
    expect(autoSaveSpy.autoSave).toHaveBeenCalledWith('stimuli');
  });

  // ─── deleteCell ───────────────────────────────────────────────────────────

  it('deleteCell → réinitialise toute la cellule et appelle autoSave', async () => {
    component.data.screen[0] = makeCell({ imageId: 'TestProject/img.png', soundId: 'TestProject/snd.mp3' });

    await component.deleteCell();

    const cell = component.data.screen[0];
    expect(cell.imageId).toBe('');
    expect(cell.soundId).toBe('');
    expect(cell.imageFile).toBeUndefined();
    expect(cell.soundFile).toBeUndefined();
    expect(cell.goodAnswer).toBeFalse();
    expect(autoSaveSpy.autoSave).toHaveBeenCalledWith('stimuli');
  });

  // ─── saveProgress ─────────────────────────────────────────────────────────

  it('saveProgress → appelle autoSave(\'stimuli\')', () => {
    component.saveProgress();
    expect(autoSaveSpy.autoSave).toHaveBeenCalledWith('stimuli');
  });

  // ─── getImageFile ─────────────────────────────────────────────────────────

  it('getImageFile — fichier sélectionné → addFile + cellule mise à jour + previewImage', async () => {
    const file = new File(['img'], 'photo.png', { type: 'image/png' });
    const event = { target: { files: [file] } } as unknown as Event;
    spyOn(sanitizer, 'bypassSecurityTrustUrl').and.returnValue('safe-img' as any);

    await component.getImageFile(event);

    expect(idbServiceSpy.addFile).toHaveBeenCalledWith('TestProject/photo.png', file, 'image');
    expect(component.data.screen[0].imageName).toBe('photo.png');
    expect(component.data.screen[0].imageId).toBe('TestProject/photo.png');
    expect(component.data.screen[0].imageFile).toBe(file);
  });

  it('getImageFile — addFile échoue → updateFile appelé en fallback', async () => {
    idbServiceSpy.addFile.and.returnValue(Promise.reject(new Error('exists')));
    const file = new File(['img'], 'photo.png', { type: 'image/png' });
    const event = { target: { files: [file] } } as unknown as Event;
    spyOn(sanitizer, 'bypassSecurityTrustUrl').and.returnValue('safe' as any);

    await component.getImageFile(event);

    expect(idbServiceSpy.updateFile).toHaveBeenCalledWith('TestProject/photo.png', file, 'image');
  });

  it('getImageFile — aucun fichier sélectionné → rien ne se passe', async () => {
    const event = { target: { files: [] } } as unknown as Event;

    await component.getImageFile(event);

    expect(idbServiceSpy.addFile).not.toHaveBeenCalled();
  });

  // ─── getSoundFile ─────────────────────────────────────────────────────────

  it('getSoundFile — fichier sélectionné → addFile + cellule mise à jour + previewSound', async () => {
    const file = new File(['snd'], 'son.mp3', { type: 'audio/mp3' });
    const event = { target: { files: [file] } } as unknown as Event;

    await component.getSoundFile(event);

    expect(idbServiceSpy.addFile).toHaveBeenCalledWith('TestProject/son.mp3', file, 'sound');
    expect(component.data.screen[0].soundName).toBe('son.mp3');
    expect(component.data.screen[0].soundId).toBe('TestProject/son.mp3');
    expect(component.previewSound).toBe('blob:fake-url');
  });

  it('getSoundFile — aucun fichier sélectionné → rien ne se passe', async () => {
    const event = { target: { files: [] } } as unknown as Event;

    await component.getSoundFile(event);

    expect(idbServiceSpy.addFile).not.toHaveBeenCalled();
  });

  // ─── cropImage ────────────────────────────────────────────────────────────

  it('cropImage — dialog ferme avec un fichier → imageFile mis à jour', () => {
    const croppedFile = new File(['cropped'], 'cropped.png', { type: 'image/png' });
    dialogSpy.open.and.returnValue({ afterClosed: () => of(croppedFile) } as any);

    component.cropImage();

    expect(component.data.screen[0].imageFile).toBe(croppedFile);
    expect(component.previewImage as string).toBe('blob:fake-url');
  });

  it('cropImage — dialog ferme avec null → imageFile inchangé', () => {
    const original = new File(['original'], 'orig.png') as any;
    component.data.screen[0].imageFile = original;
    dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as any);

    component.cropImage();

    expect(component.data.screen[0].imageFile).toBe(original);
  });

  // ─── startResize / stopResize ─────────────────────────────────────────────

  it('startResize → isResizing passe à true et listeners ajoutés', () => {
    spyOn(document, 'addEventListener');

    component.startResize(new MouseEvent('mousedown'));

    expect(component.isResizing).toBeTrue();
    expect(document.addEventListener).toHaveBeenCalledWith('mousemove', component.resize);
    expect(document.addEventListener).toHaveBeenCalledWith('mouseup', component.stopResize);
  });

  it('stopResize → isResizing passe à false et listeners retirés', () => {
    component.isResizing = true;
    spyOn(document, 'removeEventListener');

    component.stopResize();

    expect(component.isResizing).toBeFalse();
    expect(document.removeEventListener).toHaveBeenCalledWith('mousemove', component.resize);
    expect(document.removeEventListener).toHaveBeenCalledWith('mouseup', component.stopResize);
  });
});
