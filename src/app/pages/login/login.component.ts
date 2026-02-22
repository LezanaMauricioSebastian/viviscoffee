import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  loading = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async onSubmit(): Promise<void> {
    this.error = '';
    this.loading = true;

    const { error } = await this.auth.signIn(this.email, this.password);

    this.loading = false;

    if (error) {
      this.error = error.message || 'Error al iniciar sesión';
      return;
    }

    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin';
    this.router.navigateByUrl(returnUrl);
  }
}
