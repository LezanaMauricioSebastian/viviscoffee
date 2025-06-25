import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
ofertas = [
  {
    nombre: 'Caja de alfajores Block (10)',
    descripcion: 'Suave y espumoso, perfecto para arrancar el día.',
    img: 'assets/boxblock.jpeg',
    precio: 8000
  },
  {
    nombre: 'Gomitas',
    descripcion: 'comelas que se yo jaja',
    img: 'assets/Raspberries.jpeg',
    precio: 2000
  },
  {
    nombre: 'Galletitas Caseras (4)',
    descripcion: 'La dulzura del día.',
    img: 'assets/Cookie_info.jpeg',
    precio: 5000
  }
];

}
