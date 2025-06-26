import { Component, OnInit } from '@angular/core';
import { SheetsCsvService } from '../../sheet-csv.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  ofertas: any[] = [];

  constructor(private sheetsCsv: SheetsCsvService) {}

  ngOnInit() {
    this.sheetsCsv.getProductos().subscribe(data => {
      const productos = data.slice(1, 4); // del índice 1 al 3 incluidos

    // Si quieres mapear los campos a nombres más claros:
      this.ofertas = productos.map(item => ({
        id: item[''],
        nombre: item._1,
        precio: item._2,
        descripcion: item._3,
        img: item._4
      }));
    });
  }
}
