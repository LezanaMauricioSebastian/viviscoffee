import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SaladoComponent } from './salado.component';

const routes: Routes = [
  { path: '', component: SaladoComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SaladoRoutingModule {}