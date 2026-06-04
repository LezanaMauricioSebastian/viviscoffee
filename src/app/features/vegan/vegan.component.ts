import { Component, OnInit } from '@angular/core';
import { ProductosService } from '../../core/services/productos.service';

@Component({
  selector: 'app-vegan',
  template: `
    <app-productos-generico
      [titulo]="'Vegan'"
      [productos]="vegan"
      categoria="vegan"
      (productosChange)="cargar()"
    ></app-productos-generico>
  `,
})
export class VeganComponent implements OnInit {
  vegan: any[] = [];

  constructor(private productos: ProductosService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.productos.getProductos('vegan').subscribe((data) => {
      this.vegan = data;
    });
  }
}
