import { NgModule } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductosGenericoComponent } from '../components/productos-generico/productos-generico.component';

@NgModule({
  declarations: [ProductosGenericoComponent],
  imports: [CommonModule, NgOptimizedImage, FormsModule, RouterModule],
  exports: [ProductosGenericoComponent],
})
export class SharedModule {}
