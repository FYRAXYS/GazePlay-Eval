import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import { FlashService } from './flash.service';
import { OptionService } from '../options/option-service';

describe('FlashService', () => {
  let service: FlashService;
  let optionsServiceSpy: jasmine.SpyObj<OptionService>;

  beforeEach(() => {
    optionsServiceSpy = jasmine.createSpyObj('OptionService', ['getOptions', 'setOptions']);

    TestBed.configureTestingModule({
      providers: [
        FlashService,
        { provide: OptionService, useValue: optionsServiceSpy }
      ]
    });

    service = TestBed.inject(FlashService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('show → flash ajouté au signal, id incrémenté', () => {
    service.show('info', 'Message 1');
    service.show('success', 'Message 2');

    expect(service.flashs().length).toBe(2);
    expect(service.flashs()[0].message).toBe('Message 1');
    expect(service.flashs()[0].id).toBe(0);
    expect(service.flashs()[1].message).toBe('Message 2');
    expect(service.flashs()[1].id).toBe(1);

    // expect(service.counter).toBe(2)
  });

  it('Un flash message avec une durée inférieure ou égale à 0 n\'est pas affiché', () => {
    service.show('info', 'Message jamais affiché', 0);
    service.show('info', 'Autre message jamais affiché', -5);

    expect(service.flashs().length).toBe(0);
  });

  it('Un flash message sans durée renseignée s\'affiche avec la durée par défaut', (done) => {
    service.setDefaultDuration(100);
    service.show('info', 'Message sans durée');

    expect(service.flashs().length).toBe(1);

    setTimeout(() => {
      expect(service.flashs().length).toBe(0);
      done();
    }, 500);
  });

  it('remove → passe fadingOut à true puis supprime après 300ms', fakeAsync(() => {
    service.show('info', 'Test');
    const id = service.flashs()[0].id;

    service.remove(id);

    expect(service.flashs()[0].fadingOut).toBeTrue();

    tick(300);

    expect(service.flashs().length).toBe(0);
  }));

  it('remove — plusieurs flashs → seul le flash ciblé passe fadingOut, l\'autre reste intact', fakeAsync(() => {
    service.show('info', 'Flash A');
    service.show('info', 'Flash B');
    const idA = service.flashs()[0].id;
    const idB = service.flashs()[1].id;

    service.remove(idA);

    expect(service.flashs().find(f => f.id === idA)?.fadingOut).toBeTrue();
    expect(service.flashs().find(f => f.id === idB)?.fadingOut).toBeFalsy();

    tick(300);
    expect(service.flashs().some(f => f.id === idB)).toBeTrue();
    expect(service.flashs().some(f => f.id === idA)).toBeFalse();
  }));

  it('setDefaultDuration / getDefaultDuration → stocke en ms, retourne en secondes', () => {
    service.setDefaultDuration(8000);

    expect(service.getDefaultDuration()).toBe(8);
  });

  it('constructeur → charge la durée depuis les options', () => {
    optionsServiceSpy.getOptions.and.returnValue({ flashDuration: 10, fontSize: 12, theme: 'dark' });

    service = new FlashService(optionsServiceSpy);

    expect(service.getDefaultDuration()).toBe(10);
  });

  it('constructeur → ne bloque pas si les options sont corrompues', () => {
    optionsServiceSpy.getOptions.and.throwError('JSON corrompu');
    expect(() => new FlashService(optionsServiceSpy)).not.toThrow();
  });

  it('constructeur — getOptions retourne null → setDefaultDuration non appelé', () => {
    optionsServiceSpy.getOptions.and.returnValue(null);
    const s = new FlashService(optionsServiceSpy);
    expect(s.getDefaultDuration()).toBe(5);
  });

  it('getTimeout (private) — options non null → retourne flashDuration', () => {
    optionsServiceSpy.getOptions.and.returnValue({ flashDuration: 7, fontSize: 12, theme: 'dark' });
    const result = (service as any).getTimeout();
    expect(result).toBe(7);
  });

  it('getTimeout (private) — options null → retourne 5000', () => {
    optionsServiceSpy.getOptions.and.returnValue(null);
    const result = (service as any).getTimeout();
    expect(result).toBe(5000);
  });
});
