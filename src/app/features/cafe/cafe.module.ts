import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CafeRoutingModule } from './cafe-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { CafeComponent } from './cafe.component';


@NgModule({
  declarations: [CafeComponent],
  imports: [
    CommonModule,
    CafeRoutingModule,
    SharedModule
  ]
})
export class CafeModule { }
