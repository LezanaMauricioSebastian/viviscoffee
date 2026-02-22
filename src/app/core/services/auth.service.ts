import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { User, Session } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<User | null>(null);
  private currentSession = signal<Session | null>(null);

  user = computed(() => this.currentUser());
  session = computed(() => this.currentSession());
  isLoggedIn = computed(() => !!this.currentSession());

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {
    this.initAuthListener();
    this.loadSession();
  }

  private initAuthListener(): void {
    this.supabase.client.auth.onAuthStateChange((event, session) => {
      this.currentSession.set(session);
      this.currentUser.set(session?.user ?? null);
    });
  }

  private async loadSession(): Promise<void> {
    const { data: { session } } = await this.supabase.client.auth.getSession();
    this.currentSession.set(session);
    this.currentUser.set(session?.user ?? null);
  }

  async signIn(email: string, password: string): Promise<{ error: Error | null }> {
    const { error } = await this.supabase.client.auth.signInWithPassword({ email, password });
    return { error };
  }

  async signOut(): Promise<void> {
    await this.supabase.client.auth.signOut();
    this.currentUser.set(null);
    this.currentSession.set(null);
    this.router.navigate(['/login']);
  }
}
