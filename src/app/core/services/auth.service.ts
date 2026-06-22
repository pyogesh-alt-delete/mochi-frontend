import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

interface AuthUser {
  email: string;
  name: string;
  avatar: string;
  provider?: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
    provider: string | null;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'mochi_token';
  private readonly USER_KEY = 'mochi_auth';

  isAuthenticated = signal(false);

  constructor(private http: HttpClient, private router: Router) {
    this.isAuthenticated.set(!!localStorage.getItem(this.TOKEN_KEY));
  }

  async login(email: string, password: string): Promise<void> {
    const res = await lastValueFrom(
      this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password })
    );
    this.setSession(res.token, res.user);
  }

  async register(email: string, password: string, name: string): Promise<void> {
    const res = await lastValueFrom(
      this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, { email, password, name })
    );
    this.setSession(res.token, res.user);
  }

  loginWithGoogle(): void {
    this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/social`, {
        email: 'user@gmail.com',
        name: 'Google User',
        provider: 'google',
      })
      .subscribe({
        next: (res) => {
          this.setSession(res.token, res.user);
          this.router.navigate(['/app/dashboard']);
        },
        error: () => {},
      });
  }

  loginWithApple(): void {
    this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/social`, {
        email: 'user@icloud.com',
        name: 'Apple User',
        provider: 'apple',
      })
      .subscribe({
        next: (res) => {
          this.setSession(res.token, res.user);
          this.router.navigate(['/app/dashboard']);
        },
        error: () => {},
      });
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.isAuthenticated.set(false);
    this.router.navigate(['/auth']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  getUser(): AuthUser | null {
    const data = localStorage.getItem(this.USER_KEY);
    return data ? JSON.parse(data) : null;
  }

  private setSession(token: string, user: AuthResponse['user']): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    const initials = user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    localStorage.setItem(
      this.USER_KEY,
      JSON.stringify({
        email: user.email,
        name: user.name,
        avatar: user.avatar ?? initials,
        provider: user.provider,
      })
    );
    this.isAuthenticated.set(true);
  }
}
