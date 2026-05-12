import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PopupDeleteSaveComponent } from './popup-delete-save.component';

describe('PopupDeleteSaveComponent', () => {
  let component: PopupDeleteSaveComponent;
  let fixture: ComponentFixture<PopupDeleteSaveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupDeleteSaveComponent],
      providers: [
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: MAT_DIALOG_DATA, useValue: { slotName: 'TestSlot' } }
      ]
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
