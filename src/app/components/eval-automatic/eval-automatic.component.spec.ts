import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EvalAutomaticComponent } from './eval-automatic.component';
import { Router } from '@angular/router';

describe('EvalAutomaticComponent', () => {
  let component: EvalAutomaticComponent;
  let fixture: ComponentFixture<EvalAutomaticComponent>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    routerSpy.navigate.and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [EvalAutomaticComponent],
      providers: [{ provide: Router, useValue: routerSpy }]
    }).compileComponents();

    fixture   = TestBed.createComponent(EvalAutomaticComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

  it('startCreateEvalAuto → navigue vers /create-eval', () => {
    component.startCreateEvalAuto();
    expect(routerSpy.navigate).toHaveBeenCalledOnceWith(['/create-eval']);
  });

  it('backToEvalChoice → émet selectedModeChange avec null', () => {
    spyOn(component.selectedModeChange, 'emit');
    component.backToEvalChoice();
    expect(component.selectedModeChange.emit).toHaveBeenCalledOnceWith(null);
  });

  it('selectedMode est null par défaut', () => {
    expect(component.selectedMode).toBeNull();
  });
});
