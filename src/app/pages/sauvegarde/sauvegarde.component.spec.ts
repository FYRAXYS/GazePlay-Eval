import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { LoadService } from '../../services/load/load.service';
import { SaveService } from '../../services/save/save.service';
import { AutoSaveService } from '../../services/auto-save/auto-save.service';
import { saveModel } from '../../shared/saveModel';
import { FormatTypeConfig } from '../../shared/dataBaseConfig';
import { Router } from '@angular/router';
import {DownloadService} from '../../services/download/download.service';
import {OverwriteGuardService} from '../../services/overwrite-guard/overwrite-guard.service';
import {FlashService} from '../../services/flash-message/flash.service';
import {IndexedDBService} from '../../services/indexedDB/indexed-db.service';
import { SauvegardeComponent } from './sauvegarde.component';
import {of} from 'rxjs';

describe('SauvegardeComponent', () => {
  let component: SauvegardeComponent;
  let fixture: ComponentFixture<SauvegardeComponent>;
  let saveServiceSpy: jasmine.SpyObj<SaveService>
  let loadServiceSpy: jasmine.SpyObj<LoadService>
  let autoSaveServiceSpy: jasmine.SpyObj<AutoSaveService>
  let flashMessageServiceSpy: jasmine.SpyObj<FlashService>
  let routerSpy: jasmine.SpyObj<Router>
  let downloadServiceSpy: jasmine.SpyObj<DownloadService>
  let overwriteGuardSpy: jasmine.SpyObj<OverwriteGuardService>
  let indexedDBServiceSpy: jasmine.SpyObj<IndexedDBService>
  let dialogSpy: jasmine.SpyObj<MatDialog>


  beforeEach(async () => {
    saveServiceSpy = jasmine.createSpyObj('SaveService', ['saveDataAuto', 'saveToSlot', 'clearSlot', 'newSaveDataAuto', 'getEvalName']);
    saveServiceSpy.dataAuto = {
      format: 'Csv',
      globalParamsInstructionScreen: [],
      globalParamsStimuliScreen: [],
      globalParamsTransitionScreen: [],
      infoParticipant: [],
      listScreens: [],
      step: 0,
      nomEval: '' };
    saveServiceSpy.activeSlotIndex = null;

    loadServiceSpy = jasmine.createSpyObj('LoadService', ['getSlot']);
    loadServiceSpy.getSlot.and.returnValue(null);

    autoSaveServiceSpy = jasmine.createSpyObj('AutoSaveService', ['tryResume']);
    flashMessageServiceSpy = jasmine.createSpyObj('FlashService', ['show']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    downloadServiceSpy = jasmine.createSpyObj('DownloadService', ['generateSlotZip']);
    overwriteGuardSpy = jasmine.createSpyObj('OverwriteGuardService', ['check', 'getUniqueEvalName']);
    indexedDBServiceSpy = jasmine.createSpyObj('IndexedDBService', ['deleteFileByProject']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open'])

    await TestBed.configureTestingModule({
      imports: [SauvegardeComponent],
      providers : [
        { provide: SaveService, useValue: saveServiceSpy },
        { provide: LoadService, useValue: loadServiceSpy },
        { provide: AutoSaveService, useValue: autoSaveServiceSpy },
        { provide: FlashService, useValue: flashMessageServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: DownloadService, useValue: downloadServiceSpy },
        { provide: OverwriteGuardService, useValue: overwriteGuardSpy},
        { provide: IndexedDBService, useValue: indexedDBServiceSpy},
        { provide: MatDialog, useValue: dialogSpy}
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SauvegardeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('Les slots 1, 2 et 3 devraient être chargés à l\'arrivée sur la page', () => {
    const slot1: saveModel = {
      nomEval: 'Eval1',
      format: 'Csv',
      infoParticipant: ['Nom', 'Âge'],
      globalParamsTransitionScreen: [],
      globalParamsInstructionScreen: [],
      globalParamsStimuliScreen: [],
      listScreens: [],
      step: 0,
      createdAt: '',
      version: 1
    };
    const slot2: saveModel = {
      nomEval: 'Eval2',
      format: 'Csv',
      infoParticipant: ['Nom', 'Âge'],
      globalParamsTransitionScreen: [],
      globalParamsInstructionScreen: [],
      globalParamsStimuliScreen: [],
      listScreens: [],
      step: 0,
      createdAt: '',
      version: 1
    };
    const slot3: saveModel = {
      nomEval: 'Eval3',
      format: 'Csv',
      infoParticipant: ['Nom', 'Âge'],
      globalParamsTransitionScreen: [],
      globalParamsInstructionScreen: [],
      globalParamsStimuliScreen: [],
      listScreens: [],
      step: 0,
      createdAt: '',
      version: 1
    };

    // V1

    // loadServiceSpy.getSlot.withArgs(1).and.returnValue(slot1)
    // loadServiceSpy.getSlot.withArgs(2).and.returnValue(slot2)
    // loadServiceSpy.getSlot.withArgs(3).and.returnValue(slot3)

    // V2
    loadServiceSpy.getSlot.and.callFake((index: number) => {
      if (index === 0) return null; // le slot auto est vide
      if (index === 1) return slot1;
      if (index === 2) return slot2;
      if (index === 3) return slot3;
      return null;
    });

    fixture.detectChanges();

    const expectedSlots: { index: FormatTypeConfig; data: saveModel | null }[] = [
      { index: 1, data: slot1 },
      { index: 2, data: slot2 },
      { index: 3, data: slot3 }
    ]

    expect(component.slots).toEqual(expectedSlots);
    expect(loadServiceSpy.getSlot).toHaveBeenCalled();
  });

  it('Renvoie un message si le slot courant n\'est pas enregistré ', () => {
    const slot1: saveModel = {
      nomEval: 'Eval1',
      format: 'Csv',
      infoParticipant: ['Nom', 'Âge'],
      globalParamsTransitionScreen: [],
      globalParamsInstructionScreen: [],
      globalParamsStimuliScreen: [],
      listScreens: [],
      step: 0,
      createdAt: '',
      version: 1
    };
    const currentEval: saveModel = {
      nomEval: 'EvalCurrent',
      format: 'Csv',
      infoParticipant: ['Nom', 'Âge'],
      globalParamsTransitionScreen: [],
      globalParamsInstructionScreen: [],
      globalParamsStimuliScreen: [],
      listScreens: [],
      step: 0,
      createdAt: '',
      version: 1
    };

    loadServiceSpy.getSlot.and.callFake((index: number) => {
      if (index === 0) return currentEval;
      if (index === 1) return slot1;
      if (index === 2) return null;
      if (index === 3) return null;
      return null;
    });

    fixture.detectChanges();

    expect(component.hasUnsavedEval).toBeTrue();
  });

  it('Sélectionne une sauvegarde cliquée et déselectionne si recliqué', () => {
    const slot1: saveModel = {
      nomEval: 'Eval1',
      format: 'Csv',
      infoParticipant: ['Nom', 'Âge'],
      globalParamsTransitionScreen: [],
      globalParamsInstructionScreen: [],
      globalParamsStimuliScreen: [],
      listScreens: [],
      step: 0,
      createdAt: '',
      version: 1
    };

    loadServiceSpy.getSlot.and.callFake((index: number) => {
      if (index === 0) return null;
      if (index === 1) return slot1;
      if (index === 2) return null;
      if (index === 3) return null;
      return null;
    });

    fixture.detectChanges();

    component.selectSlot(1);
    expect(component.selectedSlot).toBe(1);

    component.selectSlot(1);
    expect(component.selectedSlot).toBeNull();
  });

  it('Pas de sélection si le slot est vide', () => {

    loadServiceSpy.getSlot.and.callFake((index: number) => {
      if (index === 0) return null;
      if (index === 1) return null;
      if (index === 2) return null;
      if (index === 3) return null;
      return null;
    });

    fixture.detectChanges();

    component.selectSlot(1);
    expect(component.selectedSlot).toBeNull();
  });

  it('La sauvegarde dans un slot insère des données, rafraîchit la page et affiche un message de succès', async () => {
    const dataToSave: saveModel = {
      nomEval: 'EvalToSave',
      format: 'Csv',
      infoParticipant: ['Nom', 'Âge'],
      globalParamsTransitionScreen: [],
      globalParamsInstructionScreen: [],
      globalParamsStimuliScreen: [],
      listScreens: [],
      step: 0,
      createdAt: '',
      version: 1
    };

    overwriteGuardSpy.check.and.returnValue(Promise.resolve(true));
    overwriteGuardSpy.getUniqueEvalName.and.returnValue('EvalToSave');

    loadServiceSpy.getSlot.and.callFake((index: number) => {
      if (index === 0) return null;
      if (index === 1) return dataToSave;
      if (index === 2) return null;
      if (index === 3) return null;
      return null;
    });

    await component.saveToSlot({ index: 1, data: null }, dataToSave);

    fixture.detectChanges();

    expect(saveServiceSpy.saveToSlot).toHaveBeenCalledWith(1, dataToSave);
    expect(component.slots[0].data).toEqual(dataToSave); // l'index commence à 0 pour la liste des slots
    expect(flashMessageServiceSpy.show).toHaveBeenCalledWith('success', 'Votre évaluation a été sauvegardée avec succès.');
  });

  it('en cas de suppression (sans download), supprime le slot, rafraîchit et affiche un message de succès', () => {
    const slotToDelete: saveModel = {
      nomEval: 'EvalToDelete',
      format: 'Csv',
      infoParticipant: ['Nom', 'Âge'],
      globalParamsTransitionScreen: [],
      globalParamsInstructionScreen: [],
      globalParamsStimuliScreen: [],
      listScreens: [],
      step: 0,
      createdAt: '',
      version: 1
    };

    loadServiceSpy.getSlot.and.callFake((index: number) => {
      if (index === 1) return slotToDelete;
      return null;
    });
    indexedDBServiceSpy.deleteFileByProject.and.returnValue(Promise.resolve());

    dialogSpy.open.and.returnValue({
      afterClosed: () => of('delete')
    } as any);

    component.openDeletePopup({ index: 1, data: slotToDelete });

    expect(saveServiceSpy.clearSlot).toHaveBeenCalledWith(1);
    expect(flashMessageServiceSpy.show).toHaveBeenCalledWith('success', 'L\'évaluation a été supprimée avec succès.');
  });

  it('en cas de suppression (avec download), supprime le slot, rafraîchit et affiche un message de succès', () => {
    const slotToDelete: saveModel = {
      nomEval: 'EvalToDelete',
      format: 'Csv',
      infoParticipant: ['Nom', 'Âge'],
      globalParamsTransitionScreen: [],
      globalParamsInstructionScreen: [],
      globalParamsStimuliScreen: [],
      listScreens: [],
      step: 0,
      createdAt: '',
      version: 1
    };

    dialogSpy.open.and.returnValue({
      afterClosed: () => of('download')
    } as any);

    component.openDeletePopup({ index: 1, data: slotToDelete });

    expect(downloadServiceSpy.generateSlotZip).toHaveBeenCalledWith(slotToDelete);
    expect(flashMessageServiceSpy.show).toHaveBeenCalledWith('info', 'L\'évaluation a été téléchargée.');
  });
});
