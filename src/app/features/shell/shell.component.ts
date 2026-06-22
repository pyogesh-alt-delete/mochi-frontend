import { Component, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { DataService, Transaction } from '../../core/services/data.service';
import { fmt } from '../../shared/utils/format.utils';

@Component({
    selector: 'app-shell',
    imports: [RouterModule, FormsModule],
    templateUrl: './shell.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./shell.component.scss']
})
export class ShellComponent implements OnInit {
  showModal = signal(false);
  editingTx = signal<Transaction | null>(null);
  currentRoute = signal('');
  saveError = signal('');

  // Modal form state
  modalType = signal<'expense' | 'income'>('expense');
  modalDesc = signal('');
  modalAmount = signal('');
  modalCategory = signal('Food');
  modalWallet = signal('');
  modalGroup = signal('Today');

  categories = ['Food', 'Groceries', 'Shopping', 'Transport', 'Bills', 'Entertainment', 'Health', 'Investment', 'Salary', 'Transfer'];
  groups = ['Today', 'Yesterday', 'This week', 'Earlier'];

  navItems = computed(() => {
    const recurringCount = this.data.recurring().length;
    return [
      { label: 'Dashboard', path: '/app/dashboard', icon: 'grid', badge: undefined as string | undefined },
      { label: 'Transactions', path: '/app/transactions', icon: 'arrows', badge: undefined },
      { label: 'Budgets', path: '/app/budgets', icon: 'donut', badge: undefined },
      { label: 'Analytics', path: '/app/analytics', icon: 'bars', badge: undefined },
      { label: 'Goals', path: '/app/goals', icon: 'target', badge: undefined },
      { label: 'EMIs & Loans', path: '/app/emis', icon: 'card', badge: undefined },
      { label: 'Recurring', path: '/app/recurring', icon: 'refresh', badge: recurringCount > 0 ? String(recurringCount) : undefined },
      { label: 'Mochi AI', path: '/app/mochi-ai', icon: 'spark', badge: 'Soon' },
      { label: 'Settings', path: '/app/settings', icon: 'gear', badge: undefined },
    ];
  });

  mobileNavItems = [
    { label: 'Home', path: '/app/dashboard', icon: 'grid' },
    { label: 'Activity', path: '/app/transactions', icon: 'arrows' },
    { label: 'Goals', path: '/app/goals', icon: 'target' },
    { label: 'Settings', path: '/app/settings', icon: 'gear' },
  ];

  pageTitle = computed(() => {
    const route = this.currentRoute();
    const item = this.navItems().find(n => n.path === route);
    return item?.label || 'Mochi';
  });

  constructor(
    public auth: AuthService,
    public theme: ThemeService,
    public data: DataService,
    private router: Router
  ) {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      this.currentRoute.set(e.urlAfterRedirects?.split('?')[0] || '');
    });
    this.currentRoute.set(this.router.url?.split('?')[0] || '');
  }

  async ngOnInit(): Promise<void> {
    try {
      await this.data.load();
    } catch {
      // Token expired or invalid — send back to login
      this.auth.logout();
    }
  }

  isActive(path: string): boolean {
    return this.currentRoute() === path;
  }

  openAdd() {
    this.editingTx.set(null);
    this.saveError.set('');
    this.modalType.set('expense');
    this.modalDesc.set('');
    this.modalAmount.set('');
    this.modalCategory.set('Food');
    this.modalWallet.set(this.data.wallets()[0]?.name || '');
    this.modalGroup.set('Today');
    this.showModal.set(true);
  }

  openEdit(tx: Transaction) {
    this.editingTx.set(tx);
    this.saveError.set('');
    this.modalType.set(tx.amount > 0 ? 'income' : 'expense');
    this.modalDesc.set(tx.merchant);
    this.modalAmount.set(String(Math.abs(tx.amount)));
    this.modalCategory.set(tx.category);
    this.modalWallet.set(tx.wallet);
    this.modalGroup.set(tx.group);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  async saveModal() {
    this.saveError.set('');
    const amt = parseFloat(this.modalAmount()) || 0;
    const finalAmt = this.modalType() === 'expense' ? -amt : amt;

    try {
      if (this.editingTx()) {
        await this.data.updateTransaction(this.editingTx()!.id, {
          merchant: this.modalDesc(),
          amount: finalAmt,
          category: this.modalCategory(),
          wallet: this.modalWallet(),
        });
      } else {
        await this.data.addTransaction({
          merchant: this.modalDesc() || 'Unnamed',
          category: this.modalCategory(),
          wallet: this.modalWallet(),
          amount: finalAmt,
        });
      }
      this.showModal.set(false);
    } catch (err: any) {
      this.saveError.set(err?.error?.error ?? 'Failed to save. Please try again.');
    }
  }

  async deleteTx() {
    if (this.editingTx()) {
      try {
        await this.data.deleteTransaction(this.editingTx()!.id);
      } catch {}
    }
    this.showModal.set(false);
  }

  getUser() { return this.auth.getUser(); }
  getInitials() {
    const u = this.getUser();
    if (!u) return 'DU';
    return u.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  logout() { this.auth.logout(); }
  fmt = fmt;

  getIcon(icon: string): string {
    const icons: Record<string, string> = {
      grid: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
      arrows: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>`,
      donut: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>`,
      bars: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
      target: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
      card: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`,
      refresh: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23,4 23,10 17,10"/><polyline points="1,20 1,14 7,14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
      spark: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>`,
      gear: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    };
    return icons[icon] || '';
  }
}
