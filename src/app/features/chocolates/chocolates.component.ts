import { SheetsCsvService } from '../../sheet-csv.service';
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
export class ChocolatesComponent implements OnInit{
    constructor(private sheetsCsv: SheetsCsvService) {}
    chocolates:any[]=[]
    ngOnInit() {
    this.sheetsCsv.getProductos().subscribe(data => {
      // Toma los productos de los índices 5 y 6 (recuerda que el 0 es cabecera)
      const productos = data.slice(6, 7); // 6 y 7 (ambos incluidos)
      this.chocolates = productos.map(item => ({
        id: item[''],
        nombre: item._1,
        precio: item._2,
        descripcion: item._3,
        img: item._4 // si tienes imagen en el CSV, si no, puedes omitirlo
      }));
    });
  }
}
