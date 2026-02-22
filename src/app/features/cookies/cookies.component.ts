import { Component, OnInit } from '@angular/core';
import { ProductosService } from '../../core/services/productos.service';

@Component({
  selector: 'app-cookies',
  template: `
    <app-productos-generico
      [titulo]="'Cookies'"
      [texto]='"Nuestras Deliciosas Cookies se venden apartir de las 4 unidades y las podes combinar como quieras !"'
      [productos]="cookies"
    ></app-productos-generico>
  `,
})
export class CookiesComponent implements OnInit {
  cookies: any[] = [];

  constructor(private productos: ProductosService) {}

  ngOnInit() {
    this.productos.getProductos('cookies').subscribe(data => {
      this.cookies = data;
    });
  }
}
