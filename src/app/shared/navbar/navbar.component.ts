import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  menuOpen = false;
  isScrolled = false;
  isHome = true;
  private sub?: Subscription;

  constructor(
    public auth: AuthService,
    private router: Router
  ) {}

  get isSolid(): boolean {
    return this.isScrolled || !this.isHome || this.menuOpen;
  }

  ngOnInit(): void {
    this.updateRoute(this.router.url);
    this.onScroll();
    this.sub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.updateRoute(e.urlAfterRedirects);
        this.closeMenu();
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled = typeof window !== 'undefined' && window.scrollY > 24;
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  logout(): void {
    this.auth.signOut();
  }

  private updateRoute(url: string): void {
    const path = url.split('?')[0].replace(/^#/, '');
    this.isHome = path === '/' || path === '' || path === '/home';
  }
}
