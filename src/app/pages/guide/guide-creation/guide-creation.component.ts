import {RouterLink} from '@angular/router';
import {Component, Input, OnChanges} from '@angular/core';

@Component({
  selector: 'app-guide-creation',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './guide-creation.component.html',
  styleUrl: '../guide.component.css'
})
export class GuideCreationComponent implements OnChanges {

  @Input() sectionId: string = '';

  ngOnChanges(): void {
    if (this.sectionId) {
      setTimeout(() => {
        const target = document.getElementById(this.sectionId);
        if (!target) return;

        const scrollContainer = target.closest('.guide-popup-body') as HTMLElement;
        if (scrollContainer) {
          const offset = target.offsetTop - scrollContainer.offsetTop;
          // Scroll jusqu'à la bonne partie du guide
          scrollContainer.scrollTo({ top: offset, behavior: 'smooth' });
        } else {
          // on affiche tout en haut
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    }
  }
}

