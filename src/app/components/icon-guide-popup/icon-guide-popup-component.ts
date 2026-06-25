import { Component } from '@angular/core';
import { GuidePopupComponent } from '../guide-popup/guide-popup-component';

@Component({
  selector: 'app-icon-guide-popup',
  standalone: true,
  imports: [GuidePopupComponent],
  templateUrl: './icon-guide-popup-component.html',
  styleUrl: './icon-guide-popup-component.css',
})
export class IconGuidePopupComponent {
  isGuideOpen = false;

  openGuide(): void {
    this.isGuideOpen = true;
  }

  closeGuide(): void {
    this.isGuideOpen = false;
  }
}