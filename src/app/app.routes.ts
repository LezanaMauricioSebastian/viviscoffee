import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadChildren: () => import('./pages/home/home.module').then(m => m.HomeModule) },
  { path: 'menu', loadChildren: () => import('./pages/menu/menu.module').then(m => m.MenuModule) },
  { path: 'chocolates', loadChildren: () => import('./features/chocolates/chocolates.module').then(m => m.ChocolatesModule) },
  { path: 'box', loadChildren: () => import('./features/box/box.module').then(m => m.BoxModule) },
  { path: 'cafe', loadChildren: () => import('./features/cafe/cafe.module').then(m => m.CafeModule) },
  { path: 'cookies', loadChildren: () => import('./features/cookies/cookies.module').then(m => m.CookiesModule) },
  { path: 'about', loadChildren: () => import('./pages/about/about.module').then(m => m.AboutModule) },
  { path: 'contact', loadChildren: () => import('./pages/contact/contact.module').then(m => m.ContactModule) },
  { path: '**', redirectTo: '' }
];