import { Component } from '@angular/core';

@Component({
  selector: 'app-whatsapp-widget',
  standalone: true,
  imports: [],
  templateUrl: './whatsapp-widget.component.html',
  styleUrl: './whatsapp-widget.component.css'
})

export class WhatsappWidgetComponent {
    numero: string = '5493795134827';
    mensaje = 'Hola, quiero hacer una consulta';

    getWhatsappUrl(): string {
        const encodedMessage = encodeURIComponent(this.mensaje);
        return `https://wa.me/${this.numero}?text=${encodedMessage}`;
    }
}
