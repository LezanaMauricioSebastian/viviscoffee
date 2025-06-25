import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductosGenericoComponent } from '../components/productos-generico/productos-generico.component';

@NgModule({
  declarations: [ProductosGenericoComponent],
  imports: [
    CommonModule
  ],
  exports: [ProductosGenericoComponent]
})
export class SharedModule { }
