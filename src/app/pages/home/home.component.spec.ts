import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { Router } from '@angular/router';
import { SaveService } from '../../services/save/save.service';
import { OverwriteGuardService } from '../../services/overwrite-guard/overwrite-guard.service';
import { By } from '@angular/platform-browser';
import {AutoSaveService} from '../../services/auto-save/auto-save.service';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let saveServiceSpy: jasmine.SpyObj<SaveService>;
  let overwriteGuardSpy: jasmine.SpyObj<OverwriteGuardService>;
  let autoSaveSpy: jasmine.SpyObj<AutoSaveService>;
  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    saveServiceSpy = jasmine.createSpyObj('SaveService', ['newSaveDataAuvto']);
    overwriteGuardSpy = jasmine.createSpyObj('OverwriteGuardService', ['check']);
    overwriteGuardSpy.check.and.returnValue(Promise.resolve(true));
    autoSaveSpy = jasmine.createSpyObj('AutoSaveService', ['tryResume']);
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: SaveService, useValue: saveServiceSpy },
        { provide: OverwriteGuardService, useValue: overwriteGuardSpy },
        { provide: AutoSaveService, useValue: autoSaveSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

  it('devrait appeler SaveService.newSaveDataAuto et naviguer vers /info-eval', async () => {
    await component.goToInfoEval();

    expect(saveServiceSpy.newSaveDataAuto).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/info-eval']);
  });

  it('goToInfoEval → guard retourne false → aucune navigation', async () => {
    saveServiceSpy.newSaveDataAuto.calls.reset();
    routerSpy.navigate.calls.reset();
    overwriteGuardSpy.check.and.returnValue(Promise.resolve(false));

    await component.goToInfoEval();

    expect(saveServiceSpy.newSaveDataAuto).not.toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('goToLastStep → appelle tryResume()', async () => {
    const autoSaveSpy = TestBed.inject(AutoSaveService) as jasmine.SpyObj<AutoSaveService>;

    await component.goToLastStep();

    expect(autoSaveSpy.tryResume).toHaveBeenCalled(); });

  it('devrait déclencher goToInfoEval quand on clique sur le bouton', () => {
    spyOn(component, 'goToInfoEval');
    const button = fixture.debugElement.query(By.css('button'));
    button.triggerEventHandler('click', null);

    expect(component.goToInfoEval).toHaveBeenCalled();
  });
});
