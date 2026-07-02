import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GuideCreationComponent } from './guide-creation.component';
import { provideRouter } from '@angular/router';

describe('GuideCreationComponent', () => {
  let component: GuideCreationComponent;
  let fixture: ComponentFixture<GuideCreationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuideCreationComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(GuideCreationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ne devrait pas scroller si sectionId est vide', () => {
    const scrollSpy = spyOn(document, 'getElementById').and.returnValue(null);
    component.sectionId = '';
    component.ngOnChanges();

    expect(scrollSpy).not.toHaveBeenCalled();
  });

  // done() est utilisé pour marquer la fin des tests asynchrones
  it('ne devrait pas scroller si l\'élément cible n\'existe pas', (done) => {
    spyOn(document, 'getElementById').and.returnValue(null);
    component.sectionId = 'section-inexistante';
    component.ngOnChanges();

    setTimeout(() => {
      expect(document.getElementById).toHaveBeenCalledWith('section-inexistante');
      done();
    }, 400);
  });

  it('devrait scroller dans le conteneur guide-popup-body si présent', (done) => {
    const mockContainer = document.createElement('div');
    mockContainer.classList.add('guide-popup-body');
    mockContainer.scrollTo = jasmine.createSpy('scrollTo');

    const mockTarget = document.createElement('div');
    mockTarget.id = 'info-eval';
    spyOn(mockTarget, 'closest').and.returnValue(mockContainer);
    document.body.appendChild(mockTarget);

    spyOn(document, 'getElementById').and.returnValue(mockTarget);

    component.sectionId = 'info-eval';
    component.ngOnChanges();

    setTimeout(() => {
      expect(mockContainer.scrollTo).toHaveBeenCalled();
      document.body.removeChild(mockTarget);
      done();
    }, 400);
  });

  it('devrait utiliser scrollIntoView si pas de conteneur guide-popup-body', (done) => {
    const mockTarget = document.createElement('div');
    mockTarget.id = 'download-eval';
    mockTarget.scrollIntoView = jasmine.createSpy('scrollIntoView');
    spyOn(mockTarget, 'closest').and.returnValue(null);

    spyOn(document, 'getElementById').and.returnValue(mockTarget);

    component.sectionId = 'download-eval';
    component.ngOnChanges();

    setTimeout(() => {
      expect(mockTarget.scrollIntoView).toHaveBeenCalledWith(
        jasmine.objectContaining({ behavior: 'smooth' })
      );
      done();
    }, 400);
  });
});
