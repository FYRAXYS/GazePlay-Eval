import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupImportSaveComponent } from './popup-import-save.component';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

describe('PopupImportSaveComponent', () => {
  let component: PopupImportSaveComponent;
  let fixture: ComponentFixture<PopupImportSaveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupImportSaveComponent],
      providers: [
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: MAT_DIALOG_DATA, useValue: "" }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopupImportSaveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
