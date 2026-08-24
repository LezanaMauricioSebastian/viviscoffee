import {
  ApplicationConfig,
  importProvidersFrom,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { PRECONNECT_CHECK_BLOCKLIST } from '@angular/common';
import { routes } from './app.routes';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { environment } from '../environments/environment';

// NgOptimizedImage has no provideNgOptimizedImage() in Angular 22 — import the
// directive in components/modules. Blocklist avoids noisy preconnect warnings
// for Supabase Storage (absolute URLs use the default passthrough loader).
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    importProvidersFrom(BrowserAnimationsModule),
    { provide: PRECONNECT_CHECK_BLOCKLIST, useValue: [environment.supabase.url] },
  ]
};
