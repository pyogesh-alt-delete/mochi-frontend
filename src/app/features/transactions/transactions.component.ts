import { Component, computed, signal, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { DataService, Transaction } from '../../core/services/data.service';
import { fmt, CAT_HEX } from '../../shared/utils/format.utils';

@Component({
    selector: 'app-transactions',
    imports: [FormsModule],
    templateUrl: './transactions.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent {
  fmt = fmt;
  search = signal('');
  activeCategory = signal('All');

  categories = ['All', 'Food', 'Groceries', 'Shopping', 'Transport', 'Bills', 'Entertainment', 'Health', 'Salary', 'Investment'];
  groups = ['Today', 'Yesterday', 'This week', 'Earlier'];

  constructor(public data: DataService) {}

  filtered = computed(() => {
    const q = this.search().toLowerCase();
    const cat = this.activeCategory();
    return this.data.transactions().filter(tx => {
      const matchQ = !q || tx.merchant.toLowerCase().includes(q) || tx.category.toLowerCase().includes(q);
      const matchCat = cat === 'All' || tx.category === cat;
      return matchQ && matchCat;
    });
  });

  groupedTransactions = computed(() => {
    const all = this.filtered();
    const map: Record<string, Transaction[]> = {};
    for (const tx of all) {
      if (!map[tx.group]) map[tx.group] = [];
      map[tx.group].push(tx);
    }
    return this.groups.filter(g => map[g]?.length).map(g => ({ group: g, txs: map[g] }));
  });

  totalIn = computed(() => this.data.transactions().filter(t => t.amount > 0).reduce((a, t) => a + t.amount, 0));
  totalOut = computed(() => this.data.transactions().filter(t => t.amount < 0).reduce((a, t) => a + Math.abs(t.amount), 0));

  getCatColor(cat: string) { return CAT_HEX[cat] || '#818cf8'; }
  getCatBg(cat: string) { return (CAT_HEX[cat] || '#818cf8') + '22'; }
  getCatEmoji(cat: string): string {
    const icons: Record<string, string> = { Food: '🍜', Groceries: '🛒', Shopping: '🛍️', Transport: '🚗', Bills: '⚡', Entertainment: '🎬', Health: '💪', Salary: '💰', Investment: '📈', Transfer: '↔️' };
    return icons[cat] || '💳';
  }

  delete(id: string, e: Event) {
    e.stopPropagation();
    this.data.deleteTransaction(id);
  }
}
