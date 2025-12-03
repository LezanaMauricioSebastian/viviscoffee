import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VeganComponent } from './vegan.component';

const routes: Routes = [
  { path: '', component: VeganComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VeganRoutingModule {}