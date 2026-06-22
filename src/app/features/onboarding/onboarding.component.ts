import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from '../../core/services/data.service';

@Component({
    selector: 'app-onboarding',
    imports: [FormsModule],
    templateUrl: './onboarding.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./onboarding.component.scss']
})
export class OnboardingComponent {
  walletType = signal('Bank Account');
  walletName = signal('');
  balance = signal(0);
  selectedGradient = signal('linear-gradient(150deg,#4f46e5,#1e1b4b)');
  saving = signal(false);

  walletTypes = ['Bank Account', 'Credit Card', 'Debit Card', 'Cash', 'Custom'];
  gradients = [
    'linear-gradient(150deg,#4f46e5,#1e1b4b)',
    'linear-gradient(150deg,#0d9488,#134e4a)',
    'linear-gradient(150deg,#b45309,#7c2d12)',
    'linear-gradient(150deg,#be185d,#831843)',
    'linear-gradient(150deg,#27272a,#09090b)',
  ];

  cardName = computed(() => this.walletName() || 'My Wallet');
  cardBalance = computed(() => this.balance());

  constructor(private data: DataService, private router: Router) {}

  async create() {
    this.saving.set(true);
    try {
      await this.data.addWallet({
        name: this.walletName() || 'My Wallet',
        type: this.walletType(),
        last4: '0000',
        bal: this.balance(),
        gradient: this.selectedGradient(),
      });
    } finally {
      this.saving.set(false);
    }
    this.router.navigate(['/app/dashboard']);
  }

  skip() {
    this.router.navigate(['/app/dashboard']);
  }

  fmt(n: number): string {
    n = Math.round(Math.abs(n));
    const s = String(n);
    const l3 = s.slice(-3);
    let r = s.slice(0, -3);
    if (r) r = r.replace(/\B(?=(\d\d)+(?!\d))/g, ',');
    return '₹' + (r ? r + ',' : '') + l3;
  }
}
