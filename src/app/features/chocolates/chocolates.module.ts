import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

//import { ChocolatesRoutingModule } from '../../components/features/chocolates/chocolates-routing.module';
import { ProductosGenericoComponent } from '../../components/productos-generico/productos-generico.component';
import { ChocolatesComponent } from './chocolates.component';
import { SharedModule } from '../../shared/shared.module';
import { ChocolatesRoutingModule } from './chocolates-routing.module';


@NgModule({
  declarations: [ChocolatesComponent],
  imports: [
    CommonModule,
    SharedModule,
    ChocolatesRoutingModule
  ]
})
export class ChocolatesModule { }
