import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CafeComponent } from './cafe.component';

const routes: Routes = [ {path:'', component: CafeComponent}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CafeRoutingModule { }
