import { TestBed } from '@angular/core/testing';
import { OptionService } from './option-service';
import { optionsModel, optionsModelDefault } from '../../shared/optionsModel';

describe('OptionService', () => {
  let service: OptionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OptionService]
    })
    .compileComponents();

    service = TestBed.inject(OptionService);
    localStorage.clear();
  });

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });

  it('getOptions → retourne les options si elles existent', () => {
    localStorage.setItem('options', JSON.stringify(optionsModelDefault));

    const returnOptions: optionsModel | null = service.getOptions();

    expect(returnOptions).toEqual(optionsModelDefault);
  });

  it('getOptions → retourne null si aucune option sauvegardée', () => {
    const returnOptions = service.getOptions();

    expect(returnOptions).toBeNull();
  });

  it('setOptions → sauvegarde les options dans le localStorage', () => {
    service.setOptions(optionsModelDefault);

    const raw = localStorage.getItem('options');
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toEqual(optionsModelDefault);
  });
});
