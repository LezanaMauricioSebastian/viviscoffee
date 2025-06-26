import { Component, OnInit } from '@angular/core';
import { SheetsCsvService } from '../../sheet-csv.service';

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
export class CookiesComponent implements OnInit{
  constructor(private sheetsCsv: SheetsCsvService) {}
    cookies:any[]=[]
    ngOnInit() {
        this.sheetsCsv.getProductos().subscribe(data => {
          const productos = data.slice(11, 16);
          this.cookies= productos.map(item => ({
            id: item[''],
            nombre: item._1,
            precio: item._2,
            descripcion: item._3,
            img: item._4 // si tienes imagen en el CSV, si no, puedes omitirlo
          }));
        });
      }
}
