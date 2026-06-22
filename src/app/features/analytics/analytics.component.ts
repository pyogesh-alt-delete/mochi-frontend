import { Component, computed, ChangeDetectionStrategy } from '@angular/core';

import { DataService } from '../../core/services/data.service';
import { fmt, short, CAT_HEX } from '../../shared/utils/format.utils';

@Component({
    selector: 'app-analytics',
    imports: [],
    templateUrl: './analytics.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent {
  fmt = fmt;
  short = short;

  constructor(public data: DataService) {}

  // ── Stat cards ────────────────────────────────────────────────────────────

  // Net worth = wallet balances minus outstanding EMI debt
  netWorth = computed(() =>
    this.data.totalBalance() - this.data.emis().reduce((a, e) => a + e.outstanding, 0)
  );

  // Net change this calendar month
  thisMonthNet = computed(() => {
    const now = new Date();
    return this.data.transactions()
      .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, t) => sum + t.amount, 0);
  });

  avgDailySpend = computed(() => {
    const days = Math.max(this.dailySpendData().filter(d => d.spent > 0).length, 1);
    const total = this.dailySpendData().reduce((a, d) => a + d.spent, 0);
    return Math.round(total / days);
  });

  biggestCategory = computed(() => {
    const spending = this.data.getCategorySpending();
    let max = 0, cat = '';
    for (const [c, v] of Object.entries(spending)) {
      if (v > max) { max = v; cat = c; }
    }
    return { cat: cat || '—', val: max };
  });

  subscriptionTotal = computed(() => this.data.recurring().reduce((a, r) => a + r.amount, 0));

  // ── Monthly cashflow (last 6 months) ──────────────────────────────────────

  monthlyCashflow = computed(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const m = d.getMonth(), y = d.getFullYear();
      const net = this.data.transactions()
        .filter(t => {
          const td = new Date(t.date);
          return td.getMonth() === m && td.getFullYear() === y;
        })
        .reduce((sum, t) => sum + t.amount, 0);
      return { label: d.toLocaleDateString('en', { month: 'short' }), net };
    });
  });

  maxMonthly = computed(() =>
    Math.max(...this.monthlyCashflow().map(m => Math.abs(m.net)), 1)
  );

  // ── Daily spending (last 14 days) ─────────────────────────────────────────

  dailySpendData = computed(() => {
    const now = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13 + i);
      const key = this.localDateKey(d);
      const spent = this.data.transactions()
        .filter(t => this.localDateKey(new Date(t.date)) === key && t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      return { label: d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 2), spent };
    });
  });

  maxDailySpend = computed(() =>
    Math.max(...this.dailySpendData().map(d => d.spent), 1)
  );

  // ── Top sources by total transaction volume ───────────────────────────────

  topSources = computed(() => {
    const map = new Map<string, { amount: number; cat: string }>();
    for (const t of this.data.transactions()) {
      const entry = map.get(t.merchant);
      if (entry) {
        entry.amount += Math.abs(t.amount);
      } else {
        map.set(t.merchant, { amount: Math.abs(t.amount), cat: t.category });
      }
    }
    return [...map.entries()]
      .map(([name, v]) => ({ name, amount: v.amount, cat: v.cat }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  });

  maxSource = computed(() => this.topSources()[0]?.amount || 1);

  // ── Category spending breakdown ───────────────────────────────────────────

  categoryBreakdown = computed(() => {
    const spending = this.data.getCategorySpending();
    const total = Object.values(spending).reduce((a, v) => a + v, 0) || 1;
    return Object.entries(spending)
      .map(([cat, val]) => ({ cat, val, pct: Math.round((val / total) * 100) }))
      .sort((a, b) => b.val - a.val);
  });

  // ── Helpers ───────────────────────────────────────────────────────────────

  barH(val: number, max: number) { return Math.max(Math.round((Math.abs(val) / max) * 100), 2); }
  getCatColor(cat: string) { return CAT_HEX[cat] || '#818cf8'; }
  getSourceWidth(amount: number) { return Math.round((amount / this.maxSource()) * 100); }

  private localDateKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
