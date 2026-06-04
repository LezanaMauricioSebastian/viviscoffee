import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductosGenericoComponent } from '../components/productos-generico/productos-generico.component';

@NgModule({
  declarations: [ProductosGenericoComponent],
  imports: [CommonModule, FormsModule, RouterModule],
  exports: [ProductosGenericoComponent],
})
export class SharedModule {}
