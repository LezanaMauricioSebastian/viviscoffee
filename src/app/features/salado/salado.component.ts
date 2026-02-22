import { Component, OnInit } from '@angular/core';
import { ProductosService } from '../../core/services/productos.service';

@Component({
  selector: 'app-salado',
  template: `
    <app-productos-generico
      [titulo]="'Salado'"
      [productos]="salado"
    ></app-productos-generico>
  `,
})
export class SaladoComponent implements OnInit {
  salado: any[] = [];

  constructor(private productos: ProductosService) {}

  ngOnInit() {
    this.productos.getProductos('salado').subscribe(data => {
      this.salado = data;
    });
  }
}
