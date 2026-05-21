import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateEvalComponent } from './create-eval.component';
import { Router } from '@angular/router';
import { SaveService } from '../../services/save/save.service';
import { UpdateScreensService } from '../../services/updateScreens/update-screens.service';
import { screenTypeModel, transitionScreenModel } from '../../shared/screenModel';

describe('CreateEvalComponent', () => {
  let component: CreateEvalComponent;
  let fixture: ComponentFixture<CreateEvalComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let saveServiceSpy: jasmine.SpyObj<SaveService>;
  let updateScreensServiceSpy: jasmine.SpyObj<UpdateScreensService>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    saveServiceSpy = jasmine.createSpyObj('SaveService', ['saveDataAuto']);
    saveServiceSpy.dataAuto = {
      nomEval: 'TestEval',
      format: 'Csv&Xlsx',
      infoParticipant: [],
      globalParamsTransitionScreen: [false, 0, false, false, 0],
      globalParamsInstructionScreen: [],
      globalParamsStimuliScreen: [],
      listScreens: [],
      step: 0
    };

    // Le spy renvoie l'écran reçu en lui affectant son nom,
    // ce qui reflète le vrai comportement de UpdateScreensService.
    updateScreensServiceSpy = jasmine.createSpyObj('UpdateScreensService', ['updateTransitionScreen']);
    updateScreensServiceSpy.updateTransitionScreen.and.callFake(
      (screen: transitionScreenModel, name: string) => {
        screen.name = name;
        return screen;
      }
    );

    await TestBed.configureTestingModule({
      imports: [CreateEvalComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: SaveService, useValue: saveServiceSpy },
        { provide: UpdateScreensService, useValue: updateScreensServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateEvalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // déclenche ngOnInit → loadData()
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

  // ── Cas 1 ────────────────────────────────────────────────────────────────────
  // addScreen crée un transitionScreenModel via structuredClone, le nomme
  // "Ecran <idScreen>", l'ajoute à listScreens et sélectionne l'écran.
  // idScreen doit être incrémenté après chaque appel.
  it('addScreen → ajoute un écran de transition à listScreens et incrémente idScreen', () => {
    expect(component.listScreens.length).toBe(0);
    expect(component.idScreen).toBe(1);

    component.addScreen();

    expect(component.listScreens.length).toBe(1);
    expect(component.idScreen).toBe(2);
    expect(component.listScreens[0].name).toBe('Ecran 1');
    expect(component.selectedScreen).toBe(component.listScreens[0]);
    expect(component.indexSelectedScreen).toBe(0);
  });

  // ── Cas 2 ────────────────────────────────────────────────────────────────────
  // removeScreen filtre l'écran ciblé hors de listScreens.
  // selectedScreen ne doit PAS être réinitialisé si ce n'est pas l'écran supprimé.
  it('removeScreen → retire l\'écran ciblé de listScreens', () => {
    const screenA: screenTypeModel = { name: 'Ecran 1', type: 'transition', values: [] };
    const screenB: screenTypeModel = { name: 'Ecran 2', type: 'transition', values: [] };
    component.listScreens = [screenA, screenB];
    component.selectedScreen = screenA; // on garde screenA sélectionné

    component.removeScreen(screenB); // on retire screenB, pas le sélectionné

    expect(component.listScreens.length).toBe(1);
    expect(component.listScreens).not.toContain(screenB);
    expect(component.selectedScreen).toBe(screenA); // inchangé
  });

  // ── Cas 3 ────────────────────────────────────────────────────────────────────
  // Si l'écran supprimé est celui actuellement sélectionné,
  // selectedScreen doit être remis à null (aucun écran actif).
  it('removeScreen → réinitialise selectedScreen quand c\'était l\'écran sélectionné', () => {
    const screen: screenTypeModel = { name: 'Ecran 1', type: 'transition', values: [] };
    component.listScreens = [screen];
    component.selectedScreen = screen;

    component.removeScreen(screen);

    expect(component.selectedScreen).toBeNull();
    expect(component.listScreens.length).toBe(0);
  });

  // ── Cas 4 ────────────────────────────────────────────────────────────────────
  // selectScreen met à jour les deux propriétés de sélection du composant.
  it('selectScreen → met à jour selectedScreen et indexSelectedScreen', () => {
    const screen0: screenTypeModel = { name: 'Ecran 1', type: 'transition', values: [] };
    const screen1: screenTypeModel = { name: 'Ecran 2', type: 'transition', values: [] };
    component.listScreens = [screen0, screen1];

    component.selectScreen(screen1, 1);

    expect(component.selectedScreen).toBe(screen1);
    expect(component.indexSelectedScreen).toBe(1);
  });

  // ── Cas 5 ────────────────────────────────────────────────────────────────────
  // getNameCurrentScreen renvoie le nom de selectedScreen
  // ou une chaîne vide si aucun écran n'est sélectionné (null).
  it('getNameCurrentScreen → retourne le nom de selectedScreen ou \'\' si null', () => {
    component.selectedScreen = null;
    expect(component.getNameCurrentScreen()).toBe('');

    component.selectedScreen = { name: 'Mon Ecran', type: 'transition', values: [] };
    expect(component.getNameCurrentScreen()).toBe('Mon Ecran');
  });

  // ── Cas 6 ────────────────────────────────────────────────────────────────────
  // onModifyScreenChange reçoit l'écran modifié et un flag booléen.
  // Il doit : appeler saveData, mettre à jour listScreens[indexSelectedScreen]
  // et mettre à jour isModifyScreen.
  it('onModifyScreenChange → met à jour listScreens[index], isModifyScreen et appelle saveData', () => {
    const original: screenTypeModel = { name: 'Original', type: 'transition', values: [] };
    const updated: screenTypeModel = { name: 'Modifié', type: 'transition', values: [] };
    component.listScreens = [original];
    component.indexSelectedScreen = 0;

    component.onModifyScreenChange({ screen: updated, flag: true });

    expect(component.listScreens[0]).toBe(updated);
    expect(component.isModifyScreen).toBeTrue();
    expect(component.selectedScreen).toBe(updated);
    expect(saveServiceSpy.saveDataAuto).toHaveBeenCalled();
  });

  // ── Cas 7 ────────────────────────────────────────────────────────────────────
  // drop déplace un écran de previousIndex vers currentIndex par splice,
  // puis met à jour indexSelectedScreen avec la nouvelle position.
  //
  // Exemple : [A, B, C] avec previousIndex=0, currentIndex=2
  //   → splice(0,1) retire A → [B, C]
  //   → splice(2,0,A) insère A à l'indice 2 → [B, C, A]
  it('drop → réordonne listScreens et met à jour indexSelectedScreen', () => {
    const screenA: screenTypeModel = { name: 'A', type: 'transition', values: [] };
    const screenB: screenTypeModel = { name: 'B', type: 'transition', values: [] };
    const screenC: screenTypeModel = { name: 'C', type: 'transition', values: [] };
    component.listScreens = [screenA, screenB, screenC];

    component.drop({ previousIndex: 0, currentIndex: 2 });

    expect(component.listScreens[0]).toBe(screenB);
    expect(component.listScreens[1]).toBe(screenC);
    expect(component.listScreens[2]).toBe(screenA);
    expect(component.indexSelectedScreen).toBe(2);
  });

  it('backToSetupEval → appelle saveDataAuto puis navigue vers /setup-eval', () => {
    component.backToSetupEval();
    expect(saveServiceSpy.saveDataAuto).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/setup-eval']);
  });

  it('exitInputScreen → remet editNameScreenDisable à true', () => {
    component.editNameScreenDisable = false;
    component.exitInputScreen();
    expect(component.editNameScreenDisable).toBeTrue();
  });

  it('editNameScreen → selectionne l\'ecran et met editNameScreenDisable a false', () => {
    const screen: screenTypeModel = { name: 'Ecran 1', type: 'transition', values: [] };
    component.listScreens = [screen];
    const mockInput = { nativeElement: { focus: jasmine.createSpy(), select: jasmine.createSpy() } };
    component.inputs = { toArray: () => [mockInput] } as any;

    component.editNameScreen(screen, false, 0);

    expect(component.selectedScreen).toBe(screen);
    expect(component.editNameScreenDisable).toBeFalse();
  });

  // ── Cas 8 ────────────────────────────────────────────────────────────────────
  // goToDownloadEval doit d'abord persister les données (saveData → saveDataAuto)
  // puis naviguer vers /download-eval.
  it('goToDownloadEval → appelle saveDataAuto puis navigue vers /download-eval', () => {
    component.goToDownloadEval();

    expect(saveServiceSpy.saveDataAuto).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/download-eval']);
  });
});