import { Component, signal, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { DataService } from '../../core/services/data.service';

@Component({
    selector: 'app-settings',
    imports: [FormsModule],
    templateUrl: './settings.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  Math = Math;

  notifications = signal(true);
  biometric = signal(false);
  weeklyEmail = signal(true);
  twoFa = signal(false);

  constructor(
    public auth: AuthService,
    public theme: ThemeService,
    public data: DataService,
    private router: Router
  ) {}

  getUser() { return this.auth.getUser(); }
  getInitials() {
    const u = this.getUser();
    if (!u) return 'DU';
    return u.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2);
  }

  logout() { this.auth.logout(); }
}
