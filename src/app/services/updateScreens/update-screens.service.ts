import { Injectable } from '@angular/core';
import {instructionScreenModel, stimuliScreenModel, transitionScreenModel} from '../../shared/screenModel';

@Injectable({
  providedIn: 'root'
})
export class UpdateScreensService {

  // Pour chaque valeur globale absente (`undefined`/`null`, typiquement lorsque les
  // paramètres globaux ont été perdus à l'import), on conserve la valeur par défaut de
  // l'écran (issue du clone de `default…ScreenModel`) plutôt que d'écrire `undefined` —
  // ce qui ferait disparaître la clé à l'export et casserait l'évaluation dans Learning.
  // `??` préserve les valeurs globales légitimes `false` / `0`.
  updateTransitionScreen(screenT: transitionScreenModel, name: string, value: any){
    screenT.name = name;
    screenT.values[0] = value?.[0] ?? screenT.values[0];
    screenT.values[1] = value?.[1] ?? screenT.values[1];
    screenT.values[2] = value?.[2] ?? screenT.values[2];
    screenT.values[3] = value?.[3] ?? screenT.values[3];
    screenT.values[4] = value?.[4] ?? screenT.values[4];

    return screenT;
  }

  updateInstructionScreen(screenI: instructionScreenModel, name: string, value: any){
    screenI.name = name;
    screenI.values[0] = value?.[0] ?? screenI.values[0];
    screenI.values[1] = value?.[1] ?? screenI.values[1];
    screenI.values[2] = value?.[2] ?? screenI.values[2];
    screenI.values[3] = value?.[3] ?? screenI.values[3];
    screenI.values[6] = value?.[4] ?? screenI.values[6];
    screenI.values[7] = value?.[5] ?? screenI.values[7];

    return screenI;
  }

  updateStimuliScreen(screenS: stimuliScreenModel, name: string, value: any){
    screenS.name = name;
    screenS.values[0] = value?.[0] ?? screenS.values[0];
    screenS.values[1] = value?.[1] ?? screenS.values[1];
    screenS.values[2] = value?.[2] ?? screenS.values[2];
    screenS.values[3] = value?.[3] ?? screenS.values[3];
    screenS.values[4] = value?.[4] ?? screenS.values[4];
    screenS.values[6] = value?.[5] ?? screenS.values[6];
    screenS.values[7] = value?.[6] ?? screenS.values[7];
    screenS.values[8] = value?.[7] ?? screenS.values[8];

    return screenS;
  }
}
