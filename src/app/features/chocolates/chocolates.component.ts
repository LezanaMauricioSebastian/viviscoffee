import { Component } from '@angular/core';

@Component({
  selector: 'app-chocolates',
  template: `
    <app-productos-generico
      [titulo]="'Chocolates'"
      [productos]="chocolates"
    ></app-productos-generico>
  `,
  
})
export class ChocolatesComponent {
  chocolates = [
    {
      nombre: 'Chocolate',
      descripcion: 'Crujiente, intenso, inolvidable.',
      img: '../../../assets/Chocolate_grande.jpeg',
      precio: 1500
    },
  ];
}
