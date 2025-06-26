import { SheetsCsvService } from '../../sheet-csv.service';
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

  constructor(private sheetsCsv: SheetsCsvService) {}

  ngOnInit() {
    this.sheetsCsv.getProductos().subscribe(data => {
      // Toma los productos de los índices 5 y 6 (recuerda que el 0 es cabecera)
      const productos = data.slice(4, 6); // 6 y 7 (ambos incluidos)
      this.cafes = productos.map(item => ({
        id: item[''],
        nombre: item._1,
        precio: item._2,
        descripcion: item._3,
        img: item._4 // si tienes imagen en el CSV, si no, puedes omitirlo
      }));
    });
  }
}