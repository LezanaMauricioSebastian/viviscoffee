import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SaladoComponent } from './salado.component';
import { SaladoRoutingModule } from './salado-routing.module';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [SaladoComponent],
  imports: [
    CommonModule,
    SaladoRoutingModule,
    SharedModule
  ]
})
export class SaladoModule {}