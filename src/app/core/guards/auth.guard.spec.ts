import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { firstValueFrom, isObservable } from 'rxjs';
import { authGuard } from './auth.guard';
import { SupabaseService } from '../services/supabase.service';

describe('authGuard', () => {
  const runGuard = async () => {
    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    return isObservable(result) ? firstValueFrom(result) : result;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        {
          provide: Router,
          useValue: {
            url: '/admin',
            createUrlTree: (commands: string[], extras?: { queryParams?: Record<string, string> }) =>
              ({ commands, extras } as unknown as UrlTree),
          },
        },
      ],
    });
  });

  it('allows access when Supabase session exists', async () => {
    TestBed.overrideProvider(SupabaseService, {
      useValue: {
        client: {
          auth: {
            getSession: () => Promise.resolve({ data: { session: { user: { id: '1' } } } }),
          },
        },
      },
    });

    await expect(runGuard()).resolves.toBe(true);
  });

  it('redirects to login when session is missing', async () => {
    TestBed.overrideProvider(SupabaseService, {
      useValue: {
        client: {
          auth: {
            getSession: () => Promise.resolve({ data: { session: null } }),
          },
        },
      },
    });

    await expect(runGuard()).resolves.toEqual({
      commands: ['/login'],
      extras: { queryParams: { returnUrl: '/admin' } },
    });
  });

  it('redirects to login on SSR without calling Supabase', async () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });

    await expect(runGuard()).resolves.toEqual({ commands: ['/login'], extras: undefined });
  });
});
