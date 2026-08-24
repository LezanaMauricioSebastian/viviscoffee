import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AdminStateService } from './shared/admin-state.service';

@Component({
  selector: 'app-admin-shell',
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shared.css',
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [AdminStateService],
})
export class AdminShellComponent implements OnInit {
  constructor(
    readonly state: AdminStateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.state.initialize();
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.state.clearAlerts());
  }
}
