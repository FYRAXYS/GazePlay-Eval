import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PopupOverwriteSaveComponent } from './popup-overwrite-save.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { saveModelDefault } from '../../shared/saveModel';

const DIALOG_DATA = {
  save: { ...saveModelDefault, nomEval: 'MonEval', createdAt: '2026-05-21T10:00:00.000Z' },
  slotLabel: 'Emplacement 1'
};

describe('PopupOverwriteSaveComponent', () => {
  let component: PopupOverwriteSaveComponent;
  let fixture: ComponentFixture<PopupOverwriteSaveComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<PopupOverwriteSaveComponent>>;

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [PopupOverwriteSaveComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: DIALOG_DATA }
      ]
    }).compileComponents();

    fixture   = TestBed.createComponent(PopupOverwriteSaveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

  it('data injectée — save et slotLabel disponibles', () => {
    expect(component.data.save.nomEval).toBe('MonEval');
    expect(component.data.slotLabel).toBe('Emplacement 1');
  });

  describe('différentes actions', () => {

    it('download → dialogRef.close(\'download\')', () => {
      component.download();
      expect(dialogRefSpy.close).toHaveBeenCalledOnceWith('download');
    });



    it('overwrite → dialogRef.close(\'overwrite\')', () => {
      component.overwrite();
      expect(dialogRefSpy.close).toHaveBeenCalledOnceWith('overwrite');
    });



    it('cancel → dialogRef.close(null)', () => {
      component.cancel();
      expect(dialogRefSpy.close).toHaveBeenCalledOnceWith(null);
    });
  });

  // exclusivité des actions

  it('chaque action ferme le dialog une seule fois', () => {
    component.download();
    component.overwrite();
    component.cancel();
    expect(dialogRefSpy.close).toHaveBeenCalledTimes(3);
  });
});
