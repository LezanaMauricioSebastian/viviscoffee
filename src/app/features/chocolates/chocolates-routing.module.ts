import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChocolatesComponent } from './chocolates.component';

const routes: Routes = [
  { path: '', component: ChocolatesComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChocolatesRoutingModule { }