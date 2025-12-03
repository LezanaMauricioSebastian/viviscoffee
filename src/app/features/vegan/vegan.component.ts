import { Component } from '@angular/core';
import { SheetsCsvService } from '../../sheet-csv.service';

@Component({
  selector: 'app-vegan',
  template: `
    <app-productos-generico
      [titulo]="'Vegan'"
  
      [productos]="vegan"
    ></app-productos-generico>
  `,
})
export class VeganComponent {
  vegan: any[] = [];
  constructor(private sheetsCsv: SheetsCsvService) {}
  ngOnInit() {
    this.sheetsCsv.getProductos().subscribe(data => {
      const productos = data.slice(27, 28);
      this.vegan = productos.map(item => ({
        id: item[''],
        nombre: item._1,
        precio: item._2,
        descripcion: item._3,
        img: item._4
      }));
    });
  }
}
