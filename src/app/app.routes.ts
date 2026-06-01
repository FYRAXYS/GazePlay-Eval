import { Routes } from '@angular/router';
import {HomeComponent} from './pages/home/home.component';
import {InfoEvalComponent} from './pages/info-eval/info-eval.component';
import {InfoParticipantComponent} from './pages/info-participant/info-participant.component';
import {SetupEvalComponent} from './pages/setup-eval/setup-eval.component';
import {CreateEvalComponent} from './pages/create-eval/create-eval.component';
import {DownloadEvalComponent} from './pages/download-eval/download-eval.component';
import {SauvegardeComponent} from './pages/sauvegarde/sauvegarde.component';
import {LoadSaveComponent} from './pages/load-save/load-save.component';
import {NoPage} from './pages/no-page/no-page';
import {OptionComponent} from './pages/options/option.component';
import {GuideComponent} from './pages/guide/guide.component';
import {GuideHomeComponent} from './pages/guide/guide-home/guide-home.component';
import {GuideCreationComponent} from './pages/guide/guide-creation/guide-creation.component';
import {GuideImportComponent} from './pages/guide/guide-import/guide-import.component';
import {GuideSauvegardeComponent} from './pages/guide/guide-sauvegarde/guide-sauvegarde.component';

export const routes: Routes = [
  {path: 'home', component: HomeComponent},
  {path: 'info-eval', component: InfoEvalComponent},
  {path: 'info-participant', component: InfoParticipantComponent},
  {path: 'setup-eval', component: SetupEvalComponent},
  {path: 'create-eval', component: CreateEvalComponent},
  {path: 'download-eval', component: DownloadEvalComponent},
  {path: 'sauvegarde', component: SauvegardeComponent},
  { path: 'load-save', component: LoadSaveComponent },
  { path: 'option', component: OptionComponent},
  {
    path: 'guide',
    component: GuideComponent,
    children: [
      { path: '', component: GuideHomeComponent },
      { path: 'creation', component: GuideCreationComponent },
      { path: 'sauvegardes', component: GuideSauvegardeComponent },
      { path: 'imports', component: GuideImportComponent },
    ]
  },
  { path: 'no-page', component: NoPage },
  {path: '', redirectTo: 'home', pathMatch: 'full',}
];
