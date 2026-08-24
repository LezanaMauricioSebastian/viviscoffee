import { ProductosService } from '../../core/services/productos.service';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
@Component({
    selector: 'app-cafe',
    template: `
    <app-productos-generico
      [titulo]="'Cafés'"
      [productos]="cafes"
      categoria="cafe"
      (productosChange)="cargar()"
    ></app-productos-generico>
  `,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CafeComponent implements OnInit {
  cafes: any[] = [];

  constructor(private productos: ProductosService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.productos.getProductos('cafe').subscribe((data) => {
      this.cafes = data;
    });
  }
}