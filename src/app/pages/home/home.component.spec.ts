import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { HomeComponent } from './home.component';
import { HomeModule } from './home.module';
import { ProductosService } from '../../core/services/productos.service';
import { AuthService } from '../../core/services/auth.service';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeModule, RouterTestingModule],
      providers: [
        {
          provide: ProductosService,
          useValue: {
            getProductos: () => of([]),
            getCategorias: () => [],
          },
        },
        {
          provide: AuthService,
          useValue: {
            isAdmin: () => false,
            isLoggedIn: () => false,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
