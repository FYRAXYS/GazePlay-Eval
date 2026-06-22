import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconGuidePopupComponent } from './icon-guide-popup-component';

describe('IconGuidePopupComponent', () => {
  let component: IconGuidePopupComponent;
  let fixture: ComponentFixture<IconGuidePopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconGuidePopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IconGuidePopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
