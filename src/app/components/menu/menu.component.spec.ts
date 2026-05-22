import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Offcanvas } from 'bootstrap';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { LoadZipService } from '../../services/load-zip/load-zip.service';
import { SaveService } from '../../services/save/save.service';
import { PopupImportSaveComponent } from '../popup-import-save/popup-import-save.component';
import { AutoSaveService } from '../../services/auto-save/auto-save.service';
import {OverwriteGuardService} from '../../services/overwrite-guard/overwrite-guard.service';
import {ThemeService} from '../../services/theme/theme.service';
import { of } from 'rxjs';

import { MenuComponent } from './menu.component';

describe('MenuComponent', () => {
  let component: MenuComponent;
  let fixture: ComponentFixture<MenuComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let loadServiceZipSpy: jasmine.SpyObj<LoadZipService>;
  let autoSaveServiceSpy: jasmine.SpyObj<AutoSaveService>;
  let saveServiceSpy: jasmine.SpyObj<SaveService>;
  let overwriteGuardSpy: jasmine.SpyObj<OverwriteGuardService>;
  let themeServiceSpy: jasmine.SpyObj<ThemeService>;

  let mockZipFile: File;

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
      nomEval: 'TestEval'
    };
    saveServiceSpy.activeSlotIndex = null;

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    loadServiceZipSpy = jasmine.createSpyObj('LoadZipService', ['loadZipToSlot', 'loadZip']);
    themeServiceSpy = jasmine.createSpyObj('ThemeService', ['getTheme']);

    autoSaveServiceSpy = jasmine.createSpyObj('AutoSaveService', ['tryResume']);
    overwriteGuardSpy = jasmine.createSpyObj('OverwriteGuardService', ['check', 'getUniqueEvalName']);

    await TestBed.configureTestingModule({
      imports: [MenuComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: LoadZipService, useValue: loadServiceZipSpy },
        { provide: AutoSaveService, useValue: autoSaveServiceSpy },
        { provide: SaveService, useValue: saveServiceSpy },
        { provide: OverwriteGuardService, useValue: overwriteGuardSpy},
        { provide: ThemeService, useValue: themeServiceSpy}
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuComponent);
    component = fixture.componentInstance;

    // Faux fichier utilisé pour les imports
    mockZipFile = new File(['dummy'], 'test.zip', { type: 'application/zip' });

    // Faux élément de menu qui se rajoute à la page
    const menuEl = document.createElement('div');
    menuEl.id = 'menu';
    document.body.appendChild(menuEl);
  });

  afterEach(() => {
    // on enlève l'élément de menu et on clear l'effet assombri
    document.getElementById('menu')?.remove();
    document.querySelectorAll('.offcanvas-backdrop').forEach(el => el.remove());
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getTheme', () => {
      it('devrait retourner true pour isDark() si le thème est \'dark\'', () => {
        themeServiceSpy.getTheme.and.returnValue('dark');
        expect(component.isDark()).toBeTrue();
      });

      it('devrait retourner false pour isDark() si le thème est \'light\'', () => {
        themeServiceSpy.getTheme.and.returnValue('light');
        expect(component.isDark()).toBeFalse();
      });
  });

  it('ngOnInit : devrait initialiser l\'instance Offcanvas et attacher l\'écouteur d\'événement', () => {
    const spy = spyOn(Offcanvas, 'getOrCreateInstance').and.callThrough();
    component.ngOnInit();
    expect(spy).toHaveBeenCalled();
  });

  it('ngOnDestroy : devrait appeler dispose() sur l\'instance Offcanvas', () => {
    component.ngOnInit();
    const disposeSpy = spyOn((component as any).offcanvasInstance, 'dispose');
    component.ngOnDestroy();
    expect(disposeSpy).toHaveBeenCalled();
  });

  describe('Navigation', () => {
    it('goToSauvegarde : devrait fermer le menu et naviguer vers \'/sauvegarde\'', () => {
      component.ngOnInit();
      component.goToSauvegarde();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/sauvegarde']);
    });

    it('goToLoadSave : devrait fermer le menu et naviguer vers \'/load-save\'', () => {
      component.ngOnInit();
      component.goToLoadSave();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/load-save']);
    });

    it('goToGuide : devrait fermer le menu et naviguer vers \'/no-page\'', () => {
      component.ngOnInit();
      component.goToGuide();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/no-page']);
    });

    it('goToOptions : devrait fermer le menu et naviguer vers \'/option\'', () => {
      component.ngOnInit();
      component.goToOptions();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/option']);
    });
  });

  it('Fermeture du menu : devrait nettoyer le DOM lors de la navigation', () => {
    // On ajoute un backdrop au DOM
    const backdrop = document.createElement('div');
    backdrop.className = 'offcanvas-backdrop';
    document.body.appendChild(backdrop);
    document.body.classList.add('offcanvas-open');

    component.goToSauvegarde();

    // Une fois qu'on a changé de page, le backdrop devrait être supprimé et le menu fermé
    expect(document.querySelectorAll('.offcanvas-backdrop').length).toBe(0);
    expect(document.body.classList.contains('offcanvas-open')).toBeFalse();
  });

  describe('Popup d\'import', () => {

    it('devrait ouvrir le dialog avec la bonne configuration et les données des slots', () => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as any);

      component.openImportPopup();

      expect(dialogSpy.open).toHaveBeenCalledWith(PopupImportSaveComponent, jasmine.objectContaining({
        data: jasmine.objectContaining({
          slots: jasmine.any(Array)
        }),
        disableClose: true
      }));
    });

    it('Annulation : ne devrait rien faire si la popup est fermée sans résultat', fakeAsync(() => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as any);

      component.openImportPopup();

      expect(overwriteGuardSpy.check).not.toHaveBeenCalled();
    }));

    it('ne devrait pas continuer si overwriteGuard.check(0) retourne false', fakeAsync(() => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of({ mode: 'load', zipFile: {} }) } as any);
      overwriteGuardSpy.check.and.returnValue(Promise.resolve(false));

      component.openImportPopup();

      expect(loadServiceZipSpy.loadZip).not.toHaveBeenCalled();
    }));

    it('devrait appeler loadZip et tryResume() si le résultat de la popup a mode: \'load\' et que le guard est passé', fakeAsync(() => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of({ mode: 'load', zipFile: mockZipFile }) } as any);
      overwriteGuardSpy.check.and.returnValue(Promise.resolve(true));

      component.openImportPopup();
      tick();

      expect(loadServiceZipSpy.loadZip).toHaveBeenCalledWith(mockZipFile);
      expect(autoSaveServiceSpy.tryResume).toHaveBeenCalled();
    }));

    it('ne devrait pas charger le zip si overwriteGuard.check(slotIndex) retourne false pour le slot ciblé', fakeAsync(() => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of({ mode: 'save', slotIndex: 1, zipFile: 'file.zip' }) } as any);
      overwriteGuardSpy.check.and.callFake((index) => Promise.resolve(index !== 1));

      component.openImportPopup();

      expect(loadServiceZipSpy.loadZipToSlot).not.toHaveBeenCalled();
    }));

    it('devrait charger le zip dans le slot et appeler tryResume() sans renommer ni sauvegarder manuellement, si getUniqueEvalName retourne le même nom.', fakeAsync(() => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of({ mode: 'save', slotIndex: 1, zipFile: mockZipFile }) } as any);
      overwriteGuardSpy.check.and.returnValue(Promise.resolve(true));
      overwriteGuardSpy.getUniqueEvalName.and.returnValue('TestEval');

      component.openImportPopup();
      tick();

      expect(loadServiceZipSpy.loadZipToSlot).toHaveBeenCalledWith(mockZipFile, 1);
      expect(saveServiceSpy.saveToSlot).not.toHaveBeenCalled();
      expect(autoSaveServiceSpy.tryResume).toHaveBeenCalled();
    }));

    it('devrait changer le nom, sauvegarder dans le slot ciblé et le slot 0, puis tryResume() si getUniqueEvalName retourne un nouveau nom', fakeAsync(() => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of({ mode: 'save', slotIndex: 1, zipFile: 'file.zip' }) } as any);
      overwriteGuardSpy.check.and.returnValue(Promise.resolve(true));
      overwriteGuardSpy.getUniqueEvalName.and.returnValue('New Name');

      component.openImportPopup();
      tick();

      expect(saveServiceSpy.dataAuto.nomEval).toBe('New Name');
      expect(saveServiceSpy.saveToSlot).toHaveBeenCalledWith(1, jasmine.any(Object));
      expect(saveServiceSpy.saveToSlot).toHaveBeenCalledWith(0, jasmine.any(Object));
      expect(autoSaveServiceSpy.tryResume).toHaveBeenCalled();
    }));

  });

});
