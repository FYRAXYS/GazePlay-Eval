import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupDeleteSaveComponent } from './popup-delete-save.component';

describe('PopupDeleteSaveComponent', () => {
  let component: PopupDeleteSaveComponent;
  let fixture: ComponentFixture<PopupDeleteSaveComponent>;
  const mockDialogRef = {
    close: jasmine.createSpy('close')
  };
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupDeleteSaveComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopupDeleteSaveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
