import { ProductosService } from '../../core/services/productos.service';
import { Component, OnInit } from '@angular/core';
@Component({
  selector: 'app-cafe',
  template: `
    <app-productos-generico
      [titulo]="'Cafés'"
      [productos]="cafes"
    ></app-productos-generico>
  `,
})
export class CafeComponent implements OnInit {
  cafes: any[] = [];

  constructor(private productos: ProductosService) {}

  ngOnInit() {
    this.productos.getProductos('cafe').subscribe(data => {
      this.cafes = data;
    });
  }
}