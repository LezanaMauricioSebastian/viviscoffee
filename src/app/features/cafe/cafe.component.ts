import { Component } from '@angular/core';

@Component({
  selector: 'app-cafe',
  template: `
    <app-productos-generico
      [titulo]="'Cafés'"
      [productos]="cafes"
    ></app-productos-generico>
  `,  
})
export class CafeComponent {
  cafes = [
    {
      nombre: 'Café en Saquito',
      descripcion: 'Un café fuerte y aromático.',
      img: 'assets/caje_saquito.jpeg',
      precio: 1200
    },
    {
      nombre: 'Café con Leche',
      descripcion: 'Suave y cremoso, con un toque de leche.',
      img: 'assets/Tasa de cafe.jpeg',
      precio: 1500
    },

  ];
}
