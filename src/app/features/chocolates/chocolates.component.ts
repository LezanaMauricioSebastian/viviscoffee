import { ProductosService } from '../../core/services/productos.service';
import { Component, OnInit } from '@angular/core';
@Component({
  selector: 'app-chocolates',
  template: `
    <app-productos-generico
      [titulo]="'Chocolates'"
      [productos]="chocolates"
    ></app-productos-generico>
  `,
})
export class ChocolatesComponent implements OnInit {
  chocolates: any[] = [];

  constructor(private productos: ProductosService) {}

  ngOnInit() {
    this.productos.getProductos('chocolates').subscribe(data => {
      this.chocolates = data;
    });
  }
}
