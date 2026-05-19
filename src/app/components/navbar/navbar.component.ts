import {Component} from '@angular/core';
import {ThemeService} from '../../services/theme/theme.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.component.html',
  standalone: true,
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {

  constructor(private router: Router,
              private themeService: ThemeService) {
  }

  changeTheme(){
    this.themeService.toggleTheme();
  }

  getTheme(){
    return this.themeService.getTheme() === 'dark' ? 'sun' : 'moon';
  }

  goToHome(): void {
    this.router.navigate(['/home']);
  }
}
