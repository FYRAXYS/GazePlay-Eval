import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlashComponent} from './flash.component';

describe('FlashComponent', () => {
  let component: FlashComponent;
  let fixture: ComponentFixture<FlashComponent>;


  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlashComponent],
      providers: []
    })
      .compileComponents();

    fixture = TestBed.createComponent(FlashComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('mapType(\'success\') → \'success\'', () => {
    expect(component.mapType('success')).toEqual('success');
  });

  it('mapType(\'error\') → \'danger\'', () => {
    expect(component.mapType('error')).toEqual('danger');
  });

  it('mapType(\'unknown\') → \'info\'', () => {
    expect(component.mapType('unknown')).toEqual('info');
  });

  it('mapIcon(\'success\') → \'bi-check-circle\'', () => {
    expect(component.mapIcon('success')).toEqual('bi-check-circle');
  });

  it('mapIcon(\'error\') → \'bi-x-circle\'', () => {
    expect(component.mapIcon('error')).toEqual('bi-x-circle');
  });

  it('mapIcon(\'unknown\') → \'bi-info-circle\'', () => {
    expect(component.mapIcon('unknown')).toEqual('bi-info-circle');
  });

});
