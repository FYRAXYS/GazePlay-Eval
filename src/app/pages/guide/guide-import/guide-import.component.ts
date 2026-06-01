import {RouterLink} from '@angular/router';
import {Component} from '@angular/core';

@Component({
  selector: 'app-guide-import',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './guide-import.component.html',
  styleUrl: '../guide.component.css'
})
export class GuideImportComponent {}
