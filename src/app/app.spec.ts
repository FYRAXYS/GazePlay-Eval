import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { Router, NavigationEnd, provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ProgressBarComponent } from './components/progress-bar/progress-bar.component';
import { CommonModule } from '@angular/common';

describe('App Component (Angular 20)', () => {
  let component: App;
  let fixture: any;
  let routerEvents$: Subject<any>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    routerEvents$ = new Subject();

    router = jasmine.createSpyObj<Router>('Router', ['navigate'], {
      events: routerEvents$.asObservable()
    });

    await TestBed.configureTestingModule({
      imports: [CommonModule, NavbarComponent, ProgressBarComponent, App],
      providers: [
        provideRouter([]),
        { provide: Router, useValue: router }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

  it('devrait avoir le titre "GazePlay-Eval"', () => {
    expect(component['title']).toBe('GazePlay-Eval');
  });

  it('devrait mettre à jour currentStepIndex selon l’URL', () => {
    const event = new NavigationEnd(1, '/setup-eval', '/setup-eval');
    routerEvents$.next(event);
    expect(component.currentStepIndex).toBe(2);
  });

/*  it('devrait retourner à /home en cas de rechargement hors /home', () => {
    spyOn(performance, 'getEntriesByType').and.returnValue([
      { type: 'reload' } as PerformanceNavigationTiming
    ]);
    spyOnProperty(router, 'url', 'get').and.returnValue('/create-eval'); // il faut verifier si une éval est en cours p
    component.ngOnInit();
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });*/

  it('ne devrait pas afficher la barre de progression si currentStepIndex = -1', () => {
    component.currentStepIndex = -1;
    fixture.detectChanges();

    const progressBar = fixture.nativeElement.querySelector('app-progress-bar');
    expect(progressBar).toBeNull();
  });

  it('devrait afficher la barre de progression si currentStepIndex >= 0', () => {
    component.currentStepIndex = 3;
    fixture.detectChanges();

    const progressBar = fixture.nativeElement.querySelector('app-progress-bar');
    expect(progressBar).not.toBeNull();
  });

  it('URL /info-eval → currentStepIndex = 0', () => {
    routerEvents$.next(new NavigationEnd(1, '/info-eval', '/info-eval'));
    expect(component.currentStepIndex).toBe(0);
  });

  it('URL /info-participant → currentStepIndex = 1', () => {
    routerEvents$.next(new NavigationEnd(1, '/info-participant', '/info-participant'));
    expect(component.currentStepIndex).toBe(1);
  });

  it('URL /create-eval → currentStepIndex = 3', () => {
    routerEvents$.next(new NavigationEnd(1, '/create-eval', '/create-eval'));
    expect(component.currentStepIndex).toBe(3);
  });

  it('URL /download-eval → currentStepIndex = 4', () => {
    routerEvents$.next(new NavigationEnd(1, '/download-eval', '/download-eval'));
    expect(component.currentStepIndex).toBe(4);
  });

  it('URL inconnue → currentStepIndex = -1', () => {
    component.currentStepIndex = 2;
    routerEvents$.next(new NavigationEnd(1, '/home', '/home'));
    expect(component.currentStepIndex).toBe(-1);
  });

  it('NavigationEnd → supprime les propriétés overflow et classes backdrop', () => {
    document.body.style.setProperty('overflow', 'hidden');
    document.body.style.setProperty('padding-right', '17px');
    document.body.classList.add('modal-open');

    routerEvents$.next(new NavigationEnd(1, '/home', '/home'));

    expect(document.body.style.getPropertyValue('overflow')).toBe('');
    expect(document.body.style.getPropertyValue('padding-right')).toBe('');
    expect(document.body.classList.contains('modal-open')).toBeFalse();
  });

  it('isReload → navigue vers /home', async () => {
    spyOn(performance, 'getEntriesByType').and.returnValue([{ type: 'reload' }] as any);
    router.navigate.and.returnValue(Promise.resolve(true));

    component.ngOnInit();
    await Promise.resolve();

    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });
});
