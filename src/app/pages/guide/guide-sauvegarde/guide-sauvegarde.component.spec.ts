import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GuideSauvegardeComponent} from './guide-sauvegarde.component';
import { OptionService } from '../../../services/options/option-service';
import { FlashService } from '../../../services/flash-message/flash.service';
import { optionsModel, optionsModelDefault } from '../../../shared/optionsModel';
import {provideRouter} from '@angular/router';

describe('GuideSauvegardeComponent', () => {
  let component: GuideSauvegardeComponent;
  let fixture: ComponentFixture<GuideSauvegardeComponent>;
  let optionServiceSpy: jasmine.SpyObj<OptionService>;
  let flashServiceSpy: jasmine.SpyObj<FlashService>;

  beforeEach(async () => {
    optionServiceSpy = jasmine.createSpyObj('OptionService', ['getOptions', 'setOptions']);
    flashServiceSpy = jasmine.createSpyObj('FlashService', ['show', 'setDefaultDuration']);

    await TestBed.configureTestingModule({
      imports: [GuideSauvegardeComponent],
      providers: [
        { provide: OptionService, useValue: optionServiceSpy },
        { provide: FlashService, useValue: flashServiceSpy },
        provideRouter([])
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(GuideSauvegardeComponent);
    component = fixture.componentInstance;
  });


  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });


  it("devrait rénitialiser la durée des flash-messages", () => {

    const customOptions: optionsModel = {
      theme: 'dark',
      flashDuration: 5,
      fontSize: 12,
    };

    optionServiceSpy.getOptions.and.returnValue(customOptions);
    fixture.detectChanges();

    component.resetDuration();

    expect(optionServiceSpy.setOptions).toHaveBeenCalledWith(component.options);
    expect(flashServiceSpy.setDefaultDuration).toHaveBeenCalledWith(3 * 1000);
    expect(flashServiceSpy.show).toHaveBeenCalledWith(
      'success',
      'La durée d\'affichage des notifications a été définie à 3 secondes.',
      3000
    );
  });

});
