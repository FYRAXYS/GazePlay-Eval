import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModifyScreenComponent } from './modify-screen.component';

describe('ModifyScreenComponent', () => {
  let component: ModifyScreenComponent;
  let fixture: ComponentFixture<ModifyScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModifyScreenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModifyScreenComponent);
    component = fixture.componentInstance;
    component.screenToModify = { name: 'Screen1', type: 'transition', values: [false, 0, false, false, 0] };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
