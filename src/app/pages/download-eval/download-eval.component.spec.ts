import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DownloadEvalComponent } from './download-eval.component';
import { SaveService } from '../../services/save/save.service';
import { DownloadService } from '../../services/download/download.service';
import { Router } from '@angular/router';

describe('DownloadEvalComponent', () => {
  let component: DownloadEvalComponent;
  let fixture: ComponentFixture<DownloadEvalComponent>;
  let downloadSpy: jasmine.SpyObj<DownloadService>;
  let saveSpy: jasmine.SpyObj<SaveService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    downloadSpy = jasmine.createSpyObj('DownloadService', ['generateEvalZip', 'generateSlotZip']);
    saveSpy    = jasmine.createSpyObj('SaveService',  ['getEvalName']);
    routerSpy  = jasmine.createSpyObj('Router', ['navigate']);

    downloadSpy.generateEvalZip.and.returnValue(Promise.resolve());
    downloadSpy.generateSlotZip.and.returnValue(Promise.resolve());
    routerSpy.navigate.and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [DownloadEvalComponent],
      providers: [
        { provide: DownloadService, useValue: downloadSpy },
        { provide: SaveService,     useValue: saveSpy },
        { provide: Router,          useValue: routerSpy }
      ]
    }).compileComponents();

    fixture   = TestBed.createComponent(DownloadEvalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

  it('goDownload → appelle generateSlotZip avec les données de sauvegarde', () => {
    component.goDownload();
    expect(downloadSpy.generateSlotZip).toHaveBeenCalledOnceWith(
      jasmine.objectContaining({ version: 1, createdAt: jasmine.any(String) }) as any
    );
  });

  it('goExport → appelle generateEvalZip avec le saveService', () => {
    component.goExport();
    expect(downloadSpy.generateEvalZip).toHaveBeenCalledOnceWith(saveSpy as any);
  });

  it('backToCreateEval → navigue vers /create-eval', () => {
    component.backToCreateEval();
    expect(routerSpy.navigate).toHaveBeenCalledOnceWith(['/create-eval']);
  });
});
