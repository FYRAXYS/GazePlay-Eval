import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { GuidePopupComponent } from './guide-popup-component';

describe('GuidePopupComponent', () => {
  let component: GuidePopupComponent;
  let fixture: ComponentFixture<GuidePopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuidePopupComponent],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuidePopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
