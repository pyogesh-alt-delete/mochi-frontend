import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly THEME_KEY = 'mochi_theme';
  theme = signal<'dark' | 'light'>('dark');

  constructor() {
    const saved = localStorage.getItem(this.THEME_KEY) as 'dark' | 'light' | null;
    this.theme.set(saved || 'dark');
    this.applyTheme(this.theme());

    effect(() => {
      this.applyTheme(this.theme());
      localStorage.setItem(this.THEME_KEY, this.theme());
    });
  }

  toggleTheme(): void {
    this.theme.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private applyTheme(theme: 'dark' | 'light'): void {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
