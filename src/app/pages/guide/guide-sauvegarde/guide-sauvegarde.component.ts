import {RouterLink} from '@angular/router';
import {Component, OnInit} from '@angular/core';
import {FlashService} from '../../../services/flash-message/flash.service';
import {OptionService} from '../../../services/options/option-service';
import {optionsModel, optionsModelDefault} from '../../../shared/optionsModel';

@Component({
  selector: 'app-guide-sauvegarde',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './guide-sauvegarde.component.html',
  styleUrl: '../guide.component.css'
})
export class GuideSauvegardeComponent implements OnInit{

  public options!: optionsModel;

  constructor(
    private flashService: FlashService,
    private optionService: OptionService
  ) {}

  ngOnInit(): void {
    // S'il n'y a pas d'option, on prend les valeurs par défaut
    this.options = this.optionService.getOptions() ?? { ...optionsModelDefault };
  }


  resetDuration(): void {
    try {
      this.optionService.setOptions(this.options);
      this.flashService.setDefaultDuration(3000);

      // La durée des flash-message est hardcoded, car si l'utilisateur met un temps de 0ms il n'aura pas de confirmation.
      this.flashService.show('success', 'La durée d\'affichage des notifications a été définie à 3 secondes.', 3000);
    } catch (e) {
      this.flashService.show('error', 'Une erreur est survenue lors de la rénitialisation de la durée d\'affichage des notifications', 3000);
    }
  }
}
