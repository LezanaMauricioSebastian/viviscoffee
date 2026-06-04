import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { SupabaseService } from '../services/supabase.service';
import { from, map, timeout, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // En SSR (servidor) no hay sesión; redirigir a login sin llamar a Supabase
  if (!isPlatformBrowser(platformId)) {
    return router.createUrlTree(['/login']);
  }

  const supabase = inject(SupabaseService);

  return from(supabase.client.auth.getSession()).pipe(
    timeout(5000),
    map(({ data: { session } }) => {
      if (session) return true;
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: router.url },
      });
    }),
    catchError(() =>
      of(
        router.createUrlTree(['/login'], {
          queryParams: { returnUrl: router.url },
        })
      )
    )
  );
};
