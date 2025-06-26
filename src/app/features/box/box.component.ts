import { Component, OnInit } from '@angular/core';
import { SheetsCsvService } from '../../sheet-csv.service';

@Component({
  selector: 'app-box',

  template: `
    <app-productos-generico
      [titulo]="'Cajas'"
      [productos]="cajas"
    ></app-productos-generico>
  `,
})
export class BoxComponent implements OnInit{

    constructor(private sheetsCsv: SheetsCsvService) {}
    cajas:any[]=[]
    ngOnInit() {
      this.sheetsCsv.getProductos().subscribe(data => {
        const productos = data.slice(7, 11);
        this.cajas= productos.map(item => ({
          id: item[''],
          nombre: item._1,
          precio: item._2,
          descripcion: item._3,
          img: item._4 // si tienes imagen en el CSV, si no, puedes omitirlo
        }));
      });
    }
  
}
