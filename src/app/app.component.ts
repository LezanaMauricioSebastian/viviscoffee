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
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent,  MatToolbarModule, MatButtonModule, MatIconModule, MatSidenavModule, MatListModule, LayoutModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  providers: [{ provide: LocationStrategy, useClass: HashLocationStrategy }]
})
export class AppComponent {
  title = 'vivis';
}
