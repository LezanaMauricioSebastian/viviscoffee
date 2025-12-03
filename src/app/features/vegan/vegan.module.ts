import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VeganComponent } from './vegan.component';
import { VeganRoutingModule } from './vegan-routing.module';
import { SharedModule } from '../../shared/shared.module';


@NgModule({
  declarations: [VeganComponent],
  imports: [
    CommonModule,
    VeganRoutingModule,
    SharedModule
  ]
})
export class VeganModule { }
