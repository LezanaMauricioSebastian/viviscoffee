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
      const productos1 = data.slice(6, 7);    // índice 6 (solo el 6, porque slice no incluye el final)
      const productos2 = data.slice(18, 19);  // índices 17 y 18 (el 19 no se incluye)
      const productos = [...productos1, ...productos2];
      this.chocolates = productos.map(item => ({
        id: item[''],
        nombre: item._1,
        precio: item._2,
        descripcion: item._3,
        img: item._4
      }));
    });
  }
}
