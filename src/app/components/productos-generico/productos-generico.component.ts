import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-productos-generico',
  templateUrl: './productos-generico.component.html',
  styleUrls: ['./productos-generico.component.css']
})
export class ProductosGenericoComponent {
  @Input() titulo: string = '';
  @Input() texto: string = '';
  @Input() productos: any[] = [];

}
