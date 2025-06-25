import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BoxRoutingModule } from './box-routing.module';
import { share } from 'rxjs';
import { SharedModule } from '../../shared/shared.module';
import { BoxComponent } from './box.component';


@NgModule({
  declarations: [BoxComponent],
  imports: [
    CommonModule,
    BoxRoutingModule,
    SharedModule
  ]
})
export class BoxModule { }
