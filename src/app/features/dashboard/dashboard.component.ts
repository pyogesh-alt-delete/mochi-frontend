import { Component, computed, signal, ChangeDetectionStrategy } from '@angular/core';

import { RouterModule } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { fmt, short, CAT_HEX } from '../../shared/utils/format.utils';

@Component({
    selector: 'app-dashboard',
    imports: [RouterModule],
    templateUrl: './dashboard.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  fmt = fmt;
  short = short;

  constructor(public data: DataService) {}

  totalBalance = computed(() => this.data.totalBalance());
  totalIncome = computed(() => this.data.totalIncome());
  totalExpenses = computed(() => this.data.totalExpenses());
  savingsRate = computed(() => {
    const inc = this.totalIncome();
    if (!inc) return 0;
    return Math.round(((inc - this.totalExpenses()) / inc) * 100);
  });

  recentTransactions = computed(() => this.data.transactions().slice(0, 6));

  // Donut chart data
  donutData = computed(() => {
    const spending = this.data.getCategorySpending();
    const total = Object.values(spending).reduce((a, b) => a + b, 0);
    let offset = 0;
    const r = 60;
    const circ = 2 * Math.PI * r;

    return Object.entries(spending).map(([cat, val]) => {
      const pct = val / total;
      const dash = pct * circ;
      const gap = circ - dash;
      const result = { cat, val, pct, dash, gap, offset, color: CAT_HEX[cat] || '#818cf8' };
      offset += pct * 360;
      return result;
    });
  });

  donutTotal = computed(() => {
    return Object.values(this.data.getCategorySpending()).reduce((a, b) => a + b, 0);
  });

  // 6-month bar chart data (simulated)
  months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  incomeData = [82000, 95000, 88000, 110000, 98000, 125000];
  expenseData = [54000, 61000, 49000, 72000, 58000, 68000];
  maxBarVal = 130000;

  barHeight(val: number): number {
    return Math.round((val / this.maxBarVal) * 100);
  }

  // Sparkline SVG path (simulated balance history)
  sparkPoints = [45000, 62000, 58000, 71000, 66000, 84000, 79000, 91000, 88000, 100550];

  sparklinePath = computed(() => {
    const pts = this.sparkPoints;
    const w = 200, h = 60;
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const range = max - min || 1;

    const coords = pts.map((v, i) => ({
      x: (i / (pts.length - 1)) * w,
      y: h - ((v - min) / range) * h
    }));

    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      const cpx = (prev.x + curr.x) / 2;
      d += ` C ${cpx} ${prev.y} ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
    }
    return d;
  });

  // Donut stroke calculation
  getStrokeDasharray(pct: number): string {
    const circ = 2 * Math.PI * 60;
    return `${pct * circ} ${circ * (1 - pct)}`;
  }

  getStrokeDashoffset(startPct: number): string {
    const circ = 2 * Math.PI * 60;
    return String(circ * (0.25 - startPct));
  }

  getDashStartPct = computed(() => {
    const spending = this.data.getCategorySpending();
    const total = Object.values(spending).reduce((a, b) => a + b, 0);
    let acc = 0;
    return Object.entries(spending).map(([cat, val]) => {
      const start = acc;
      acc += val / total;
      return { cat, val, pct: val / total, start, color: CAT_HEX[cat] || '#818cf8' };
    });
  });

  // Bills due
  billsDue = computed(() => {
    return this.data.recurring().reduce((sum, r) => sum + r.amount, 0);
  });

  getGoalPct(g: any): number {
    return Math.min(100, Math.round((g.current / g.target) * 100));
  }

  topGoals = computed(() => this.data.goals().slice(0, 3));

  getCatEmoji(cat: string): string {
    const icons: Record<string, string> = {
      Food: '🍜',
      Groceries: '🛒',
      Shopping: '🛍️',
      Transport: '🚗',
      Bills: '⚡',
      Entertainment: '🎬',
      Health: '💪',
      Salary: '💰',
      Investment: '📈',
      Transfer: '↔️'
    };
    return icons[cat] || '💳';
  }

  getCatColor(cat: string): string {
    return CAT_HEX[cat] || '#818cf8';
  }

  getCatBg(cat: string): string {
    const h = CAT_HEX[cat] || '#818cf8';
    return h + '22';
  }
}
