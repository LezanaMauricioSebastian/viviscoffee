import { Component } from '@angular/core';

@Component({
  selector: 'app-box',

  template: `
    <app-productos-generico
      [titulo]="'Cajas'"
      [productos]="cajas"
    ></app-productos-generico>
  `,
})
export class BoxComponent {
  cajas = [
    {
      nombre: 'Caja de bombones',
      descripcion: 'Una selección de los mejores bombones.',
      img: '../../../assets/box_1.jpeg',
      precio: 2500
    },
    {
      nombre: 'Caja de chocolates',
      descripcion: 'Una selección de los mejores chocolates.',
      img: '../../../assets/box_2.jpeg',
      precio: 3000
    },
    {
      nombre: 'Caja de bombones',
      descripcion: 'Una selección de los mejores bombones.',
      img: '../../../assets/box_3.jpeg',
      precio: 2500
    },
    
    {
      nombre: 'Caja de Alfajores Block',
      descripcion: 'Una selección de los mejores chocolates.',
      img: '../../../assets/boxblock.jpeg',
      precio: 3000
    },
  ];
  
}
