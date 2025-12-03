import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';
import { LayoutModule } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { SheetsCsvService } from './sheet-csv.service';
import { HttpClientModule } from '@angular/common/http';
import { WhatsappWidgetComponent } from './shared/whatsapp-widget/whatsapp-widget.component';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent,  MatToolbarModule, MatButtonModule, MatIconModule, MatSidenavModule, MatListModule, LayoutModule,HttpClientModule, WhatsappWidgetComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  providers: [{ provide: LocationStrategy, useClass: HashLocationStrategy }]
})
export class AppComponent {
  constructor(private datos_csv: SheetsCsvService) {}
  ngOnInit() {
    this.datos_csv.getProductos().subscribe(data => {
      console.log(data);
    });
  }
  title = 'vivis';
}
