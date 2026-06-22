import { Component, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService, Recurring } from '../../core/services/data.service';
import { fmt } from '../../shared/utils/format.utils';

@Component({
    selector: 'app-recurring',
    imports: [FormsModule],
    templateUrl: './recurring.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./recurring.component.scss']
})
export class RecurringComponent {
  fmt = fmt;

  showAdd = signal(false);
  editItem = signal<Recurring | null>(null);
  deleteId = signal<string | null>(null);
  saving = signal(false);
  deleting = signal(false);

  categories = ['Bills', 'Health', 'Entertainment', 'Food', 'Groceries', 'Shopping', 'Transport'];
  cycles = ['Monthly', 'Yearly', 'Weekly'];

  // add form
  newName = signal('');
  newAmount = signal(0);
  newCycle = signal('Monthly');
  newDueDay = signal(1);
  newCategory = signal('Bills');

  // edit form
  editName = signal('');
  editAmount = signal(0);
  editCycle = signal('Monthly');
  editDueDay = signal(1);
  editCategory = signal('Bills');

  constructor(public data: DataService) {}

  monthlyTotal = computed(() => this.data.recurring().reduce((a, r) => a + r.amount, 0));
  yearlyTotal = computed(() => this.monthlyTotal() * 12);
  nextCharge = computed(() => {
    const sorted = [...this.data.recurring()].sort((a, b) => a.dueDay - b.dueDay);
    return sorted[0]?.name || '-';
  });

  getCatColor(cat: string): string {
    const map: Record<string, string> = {
      Bills: '#fb7185', Health: '#34d399', Entertainment: '#c084fc',
      Food: '#818cf8', Groceries: '#2dd4bf', Shopping: '#fbbf24', Transport: '#38bdf8'
    };
    return map[cat] || '#818cf8';
  }

  getCatEmoji(cat: string): string {
    const icons: Record<string, string> = {
      Bills: '⚡', Health: '💪', Entertainment: '🎬',
      Food: '🍜', Groceries: '🛒', Shopping: '🛍️', Transport: '🚗'
    };
    return icons[cat] || '📋';
  }

  async addRecurring() {
    this.saving.set(true);
    try {
      await this.data.addRecurring({
        name: this.newName(),
        amount: this.newAmount(),
        cycle: this.newCycle(),
        dueDay: this.newDueDay(),
        category: this.newCategory(),
      });
      this.showAdd.set(false);
      this.resetAdd();
    } finally {
      this.saving.set(false);
    }
  }

  openEdit(r: Recurring) {
    this.editItem.set(r);
    this.editName.set(r.name);
    this.editAmount.set(r.amount);
    this.editCycle.set(r.cycle);
    this.editDueDay.set(r.dueDay);
    this.editCategory.set(r.category);
  }

  async saveEdit() {
    const r = this.editItem();
    if (!r) return;
    this.saving.set(true);
    try {
      await this.data.updateRecurring(r.id, {
        name: this.editName(),
        amount: this.editAmount(),
        cycle: this.editCycle(),
        dueDay: this.editDueDay(),
        category: this.editCategory(),
      });
      this.editItem.set(null);
    } finally {
      this.saving.set(false);
    }
  }

  async doDelete() {
    const id = this.deleteId();
    if (!id) return;
    this.deleting.set(true);
    try {
      await this.data.deleteRecurring(id);
      this.deleteId.set(null);
    } finally {
      this.deleting.set(false);
    }
  }

  private resetAdd() {
    this.newName.set('');
    this.newAmount.set(0);
    this.newCycle.set('Monthly');
    this.newDueDay.set(1);
    this.newCategory.set('Bills');
  }
}
