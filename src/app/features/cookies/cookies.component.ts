import { Component } from '@angular/core';

@Component({
  selector: 'app-cookies',
  template: `
    <app-productos-generico
      [titulo]="'Cookies'"
      [texto]='"Nuestras Deliciosas Cookies se venden apartir de las 4 unidades y las podes combinar como quieras !"'
      [productos]="cookies"
    ></app-productos-generico>
  `,
})
export class CookiesComponent {
  cookies = [
    {
      nombre: 'Cookie de Chocolate',
      descripcion: 'Deliciosa galleta de chocolate.',
      img: '../../../assets/cookie0.jpeg',
      precio: 1000
    },
    {
      nombre: 'Cookie de Vainilla',
      descripcion: 'Suave galleta de vainilla.',
      img: '../../../assets/cookie1.jpeg',
      precio: 1000
    },
    {
      nombre: 'Cookie de Avena',
      descripcion: 'Saludable galleta de avena.',
      img: '../../../assets/cookie2.jpeg',
      precio: 1000
    },
    {
      nombre: 'Cookie de Avena',
      descripcion: 'Saludable galleta de avena.',
      img: '../../../assets/cookie3.jpeg',
      precio: 1000
    },
    {
      nombre: 'Cookie de Avena',
      descripcion: 'Saludable galleta de avena.',
      img: '../../../assets/cookie4.jpeg',
      precio: 1000
    },

  ];
}
