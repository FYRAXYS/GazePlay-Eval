import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { OptionComponent } from './option.component';
import { OptionService } from '../../services/options/option-service';
import { FlashService } from '../../services/flash-message/flash.service';
import { IndexedDBService } from '../../services/indexedDB/indexed-db.service';
import { optionsModel, optionsModelDefault } from '../../shared/optionsModel';

describe('OptionComponent', () => {
  let component: OptionComponent;
  let fixture: ComponentFixture<OptionComponent>;
  let optionServiceSpy: jasmine.SpyObj<OptionService>;
  let flashServiceSpy: jasmine.SpyObj<FlashService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let idbServiceSpy: jasmine.SpyObj<IndexedDBService>;

  beforeEach(async () => {
    optionServiceSpy = jasmine.createSpyObj('OptionService', ['getOptions', 'setOptions']);
    flashServiceSpy = jasmine.createSpyObj('FlashService', ['show', 'setDefaultDuration']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    idbServiceSpy = jasmine.createSpyObj('IndexedDBService', ['deleteAll']);
    idbServiceSpy.deleteAll.and.returnValue(Promise.resolve());

    await TestBed.configureTestingModule({
      imports: [OptionComponent],
      providers: [
        { provide: OptionService, useValue: optionServiceSpy },
        { provide: FlashService, useValue: flashServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: IndexedDBService, useValue: idbServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OptionComponent);
    component = fixture.componentInstance;
  });



  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('devrait charger les options par défaut depuis optionService au démarrage si null', () => {

    optionServiceSpy.getOptions.and.returnValue(null);

    fixture.detectChanges();

    expect(component.options).toEqual(optionsModelDefault);
  });

  it('devrait charger les options personnalisées depuis optionService au démarrage', () => {

    const customOptions: optionsModel = {
      theme: 'light',
      flashDuration: 3,
      fontSize: 14,
    };

    optionServiceSpy.getOptions.and.returnValue(customOptions);

    fixture.detectChanges();

    expect(component.options).toEqual(customOptions);
    expect(optionServiceSpy.getOptions).toHaveBeenCalled();
  });

  it("devrait enregistrer la nouvelle durée des flash-messages", () => {

    const customOptions: optionsModel = {
      theme: 'dark',
      flashDuration: 5,
      fontSize: 12,
    };

    optionServiceSpy.getOptions.and.returnValue(customOptions);

    fixture.detectChanges();

    component.options.flashDuration = 3;

    component.saveDuration();

    expect(optionServiceSpy.setOptions).toHaveBeenCalledWith(component.options);
    expect(flashServiceSpy.setDefaultDuration).toHaveBeenCalledWith(3 * 1000);
    expect(component.options.flashDuration).toEqual(3);
    expect(flashServiceSpy.show).toHaveBeenCalledWith('success', 'Options sauvegardées !', 1000);
  });

  it('saveDuration — setOptions lance une erreur → flash error affiché', () => {
    optionServiceSpy.getOptions.and.returnValue(optionsModelDefault);
    fixture.detectChanges();
    optionServiceSpy.setOptions.and.throwError('QuotaExceeded');

    component.saveDuration();

    expect(flashServiceSpy.show).toHaveBeenCalledWith(
      'error', 'Une erreur est survenue lors de l\'enregistrement des options', 1000
    );
  });

  it('emptyDB — succès → deleteAll appelé et flash success', async () => {
    fixture.detectChanges();

    await component.emptyDB();

    expect(idbServiceSpy.deleteAll).toHaveBeenCalled();
    expect(flashServiceSpy.show).toHaveBeenCalledWith('success', 'Les fichiers ont été supprimés avec succès.');
  });

  it('emptyDB — deleteAll échoue → flash error', async () => {
    fixture.detectChanges();
    idbServiceSpy.deleteAll.and.returnValue(Promise.reject(new Error('fail')));

    await component.emptyDB();

    expect(flashServiceSpy.show).toHaveBeenCalledWith('error', 'Une erreur est survenue lors de la suppression des fichiers.');
  });

  it('devrait naviguer vers /home avec goBack()', () => {

    fixture.detectChanges();

    component.goBack();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
  });
});
