import { Component, computed, ChangeDetectionStrategy } from '@angular/core';

import { DataService } from '../../core/services/data.service';
import { fmt, short, CAT_HEX } from '../../shared/utils/format.utils';

@Component({
    selector: 'app-budgets',
    imports: [],
    templateUrl: './budgets.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./budgets.component.scss']
})
export class BudgetsComponent {
  fmt = fmt;
  short = short;
  Math = Math;

  constructor(public data: DataService) {}

  totalSpent = computed(() => this.data.budgets().reduce((a, b) => a + b.spent, 0));
  totalLimit = computed(() => this.data.budgets().reduce((a, b) => a + b.limit, 0));
  overallPct = computed(() => Math.min(100, Math.round((this.totalSpent() / this.totalLimit()) * 100)));

  pct(b: any): number { return Math.min(100, Math.round((b.spent / b.limit) * 100)); }
  isOver(b: any): boolean { return b.spent > b.limit; }
  getCatColor(cat: string) { return CAT_HEX[cat] || '#818cf8'; }
  getCatBg(cat: string) { return (CAT_HEX[cat] || '#818cf8') + '22'; }

  getCatEmoji(cat: string): string {
    const icons: Record<string,string> = { Food:'🍜', Groceries:'🛒', Shopping:'🛍️', Transport:'🚗', Bills:'⚡', Entertainment:'🎬', Health:'💪', Salary:'💰', Investment:'📈' };
    return icons[cat] || '💳';
  }
}
