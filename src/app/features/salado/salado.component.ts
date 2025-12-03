import { Component ,OnInit} from '@angular/core';
import { SheetsCsvService } from '../../sheet-csv.service';

@Component({
  selector: 'app-salado',
  template: `
    <app-productos-generico
      [titulo]="'Salado'"
      [productos]="salado"
    ></app-productos-generico>
  `,
})
export class SaladoComponent {
  salado: any[] = [];
  constructor(private sheetsCsv: SheetsCsvService) {}
  ngOnInit() {
    this.sheetsCsv.getProductos().subscribe(data => {
      const productos = data.slice(26, 27);
      this.salado = productos.map(item => ({
        id: item[''],
        nombre: item._1,
        precio: item._2,
        descripcion: item._3,
        img: item._4
      }));
    });
  }
}
