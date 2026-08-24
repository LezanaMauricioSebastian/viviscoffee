import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { AdminShellComponent } from './admin-shell.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'resumen', pathMatch: 'full' },
      {
        path: 'resumen',
        loadComponent: () =>
          import('./resumen/admin-resumen.component').then((m) => m.AdminResumenComponent),
      },
      {
        path: 'productos',
        loadComponent: () =>
          import('./productos/admin-productos.component').then((m) => m.AdminProductosComponent),
      },
      {
        path: 'compras',
        loadComponent: () =>
          import('./compras/admin-compras.component').then((m) => m.AdminComprasComponent),
      },
      {
        path: 'ventas',
        loadComponent: () =>
          import('./ventas/admin-ventas.component').then((m) => m.AdminVentasComponent),
      },
    ],
  },
];
