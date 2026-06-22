import { Component, computed, signal, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { DataService, Goal } from '../../core/services/data.service';
import { fmt, short } from '../../shared/utils/format.utils';

@Component({
    selector: 'app-goals',
    imports: [FormsModule],
    templateUrl: './goals.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./goals.component.scss']
})
export class GoalsComponent {
  Math = Math;
  fmt = fmt;
  short = short;

  showAdd = signal(false);
  saving = signal(false);
  deleting = signal(false);

  // add form
  newName = signal('');
  newTarget = signal(0);
  newCurrent = signal(0);
  newMonthly = signal(0);
  newColor = signal('var(--c1)');

  // edit state
  editGoal = signal<Goal | null>(null);
  editName = signal('');
  editTarget = signal(0);
  editCurrent = signal(0);
  editMonthly = signal(0);
  editColor = signal('var(--c1)');

  // delete state
  deleteId = signal<string | null>(null);

  colorOptions = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)'];
  colorHex = ['#818cf8', '#2dd4bf', '#fbbf24', '#fb7185', '#c084fc', '#38bdf8'];

  constructor(public data: DataService) {}

  pct(g: Goal): number {
    return Math.min(100, Math.round((g.current / g.target) * 100));
  }

  ringDash(g: Goal): string {
    const circ = 2 * Math.PI * 54;
    const filled = (this.pct(g) / 100) * circ;
    return `${filled} ${circ}`;
  }

  ringOffset(): string {
    const circ = 2 * Math.PI * 54;
    return String(circ * 0.25);
  }

  async addGoal() {
    this.saving.set(true);
    try {
      await this.data.addGoal({
        name: this.newName(),
        target: this.newTarget(),
        current: this.newCurrent(),
        monthly: this.newMonthly(),
        eta: '',
        color: this.newColor(),
      });
      this.showAdd.set(false);
      this.newName.set('');
      this.newTarget.set(0);
      this.newCurrent.set(0);
      this.newMonthly.set(0);
    } finally {
      this.saving.set(false);
    }
  }

  openEdit(g: Goal) {
    this.editGoal.set(g);
    this.editName.set(g.name);
    this.editTarget.set(g.target);
    this.editCurrent.set(g.current);
    this.editMonthly.set(g.monthly);
    this.editColor.set(g.color);
  }

  async saveEdit() {
    const g = this.editGoal();
    if (!g) return;
    this.saving.set(true);
    try {
      await this.data.updateGoal(g.id, {
        name: this.editName(),
        target: this.editTarget(),
        current: this.editCurrent(),
        monthly: this.editMonthly(),
        color: this.editColor(),
      });
      this.editGoal.set(null);
    } finally {
      this.saving.set(false);
    }
  }

  async doDelete() {
    const id = this.deleteId();
    if (!id) return;
    this.deleting.set(true);
    try {
      await this.data.deleteGoal(id);
      this.deleteId.set(null);
    } finally {
      this.deleting.set(false);
    }
  }

  getColorHex(colorVar: string): string {
    const map: Record<string, string> = {
      'var(--c1)': '#818cf8', 'var(--c2)': '#2dd4bf', 'var(--c3)': '#fbbf24',
      'var(--c4)': '#fb7185', 'var(--c5)': '#c084fc', 'var(--c6)': '#38bdf8'
    };
    return map[colorVar] || '#818cf8';
  }

  totalSaved = computed(() => this.data.goals().reduce((a, g) => a + g.current, 0));
  totalTarget = computed(() => this.data.goals().reduce((a, g) => a + g.target, 0));
}
