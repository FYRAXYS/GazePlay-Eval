import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PopupDeleteSaveComponent } from './popup-delete-save.component';

describe('PopupDeleteSaveComponent', () => {
  let component: PopupDeleteSaveComponent;
  let fixture: ComponentFixture<PopupDeleteSaveComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<PopupDeleteSaveComponent>>;

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [PopupDeleteSaveComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { slotName: 'TestSlot' } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PopupDeleteSaveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé avec MatDialogRef et MAT_DIALOG_DATA correctement injectés', () => {
    expect(component).toBeTruthy();
    expect(component.dialogRef).toBe(dialogRefSpy);
    expect(component.data.slotName).toBe('TestSlot');
  });

  // download() correspond au choix "télécharger avant de supprimer" :
  // la dialog doit se fermer avec la valeur 'download'.
  it('download() → appelle dialogRef.close(\'download\')', () => {
    component.download();

    expect(dialogRefSpy.close).toHaveBeenCalledOnceWith('download');
  });

  // delete() correspond au choix "supprimer sans télécharger" :
  // la dialog doit se fermer avec la valeur 'delete'.
  it('delete() → appelle dialogRef.close(\'delete\')', () => {
    component.delete();

    expect(dialogRefSpy.close).toHaveBeenCalledOnceWith('delete');
  });

  // cancel() correspond à l'annulation : aucune action n'est effectuée.
  // La dialog doit se fermer avec null pour signaler l'absence d'action.
  it('cancel() → appelle dialogRef.close(null)', () => {
    component.cancel();

    expect(dialogRefSpy.close).toHaveBeenCalledOnceWith(null);
  });
});
