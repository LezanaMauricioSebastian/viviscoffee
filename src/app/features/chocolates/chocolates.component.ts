import { ProductosService } from '../../core/services/productos.service';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
@Component({
    selector: 'app-chocolates',
    template: `
    <app-productos-generico
      [titulo]="'Chocolates'"
      [productos]="chocolates"
      categoria="chocolates"
      (productosChange)="cargar()"
    ></app-productos-generico>
  `,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ChocolatesComponent implements OnInit {
  chocolates: any[] = [];

  constructor(private productos: ProductosService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.productos.getProductos('chocolates').subscribe((data) => {
      this.chocolates = data;
    });
  }
}
