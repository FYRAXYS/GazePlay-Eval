import { ComponentFixture, TestBed } from '@angular/core/testing';
import {ThemeService} from '../../services/theme/theme.service';
import {Router} from '@angular/router';

import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let themeServiceSpy: jasmine.SpyObj<ThemeService>;
  let routerSpy: jasmine.SpyObj<Router>;


  beforeEach(async () => {

    themeServiceSpy = jasmine.createSpyObj('ThemeService', ['toggleTheme','getTheme']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate'])

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        { provide: ThemeService, useValue: themeServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('getTheme → \'dark\' retourne \'sun\', sinon \'moon\'', () => {
    let currentTheme: 'light' | 'dark' = 'light';

    themeServiceSpy.toggleTheme.and.callFake(() => {
      currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    });

    themeServiceSpy.getTheme.and.callFake((): 'light' | 'dark' => {
      return currentTheme;
    });

    expect(component.getTheme()).toEqual('moon');

    component.changeTheme();

    expect(component.getTheme()).toEqual('sun');
  });

  it('changeTheme → appelle toggleTheme()', () => {
    component.changeTheme();
    expect(themeServiceSpy.toggleTheme).toHaveBeenCalled();
  });

  it('goToHome → navigate([\'/home\'])', () => {
    component.goToHome();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
  });

});
