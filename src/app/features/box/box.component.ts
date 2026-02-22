import { Component, OnInit } from '@angular/core';
import { ProductosService } from '../../core/services/productos.service';

@Component({
  selector: 'app-box',
  template: `
    <app-productos-generico
      [titulo]="'Cajas'"
      [productos]="cajas"
    ></app-productos-generico>
  `,
})
export class BoxComponent implements OnInit {
  cajas: any[] = [];

  constructor(private productos: ProductosService) {}

  ngOnInit() {
    this.productos.getProductos('box').subscribe(data => {
      this.cajas = data;
    });
  }
}
