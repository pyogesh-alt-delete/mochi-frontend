import { Component, signal, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-auth',
    imports: [FormsModule],
    templateUrl: './auth.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./auth.component.scss']
})
export class AuthComponent {
  tab = signal<'login' | 'signup'>('login');
  name = '';
  email = '';
  password = '';
  error = signal('');
  loading = signal(false);

  constructor(private auth: AuthService, private router: Router) {}

  switchTab(t: 'login' | 'signup') {
    this.tab.set(t);
    this.error.set('');
  }

  async submit() {
    this.error.set('');
    this.loading.set(true);
    try {
      if (this.tab() === 'login') {
        await this.auth.login(this.email, this.password);
        this.router.navigate(['/app/dashboard']);
      } else {
        const displayName = this.name.trim() || this.email.split('@')[0];
        await this.auth.register(this.email, this.password, displayName);
        this.router.navigate(['/onboarding']);
      }
    } catch (err: any) {
      const msg = err?.error?.error ?? 'Something went wrong. Please try again.';
      this.error.set(msg);
    } finally {
      this.loading.set(false);
    }
  }

  googleLogin() { this.auth.loginWithGoogle(); }
  appleLogin() { this.auth.loginWithApple(); }
}
