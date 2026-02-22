import { Component, OnInit } from '@angular/core';
import { ProductosService } from '../../core/services/productos.service';

@Component({
  selector: 'app-vegan',
  template: `
    <app-productos-generico
      [titulo]="'Vegan'"
      [productos]="vegan"
    ></app-productos-generico>
  `,
})
export class VeganComponent implements OnInit {
  vegan: any[] = [];

  constructor(private productos: ProductosService) {}

  ngOnInit() {
    this.productos.getProductos('vegan').subscribe(data => {
      this.vegan = data;
    });
  }
}
