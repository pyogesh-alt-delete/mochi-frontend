import { Component, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService, Emi } from '../../core/services/data.service';
import { fmt, short } from '../../shared/utils/format.utils';

@Component({
    selector: 'app-emis',
    imports: [FormsModule],
    templateUrl: './emis.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./emis.component.scss']
})
export class EmisComponent {
  fmt = fmt;
  short = short;

  showAdd = signal(false);
  editEmi = signal<Emi | null>(null);
  deleteId = signal<string | null>(null);
  saving = signal(false);
  deleting = signal(false);

  // add form
  newName = signal('');
  newBank = signal('');
  newEmiAmount = signal(0);
  newPaid = signal(0);
  newTotal = signal(12);
  newOutstanding = signal(0);
  newRate = signal(0);
  newDueDate = signal('');

  // edit form
  editName = signal('');
  editBank = signal('');
  editEmiAmount = signal(0);
  editPaid = signal(0);
  editTotal = signal(12);
  editOutstanding = signal(0);
  editRate = signal(0);
  editDueDate = signal('');

  constructor(public data: DataService) {}

  totalEmi = computed(() => this.data.emis().reduce((a, e) => a + e.emi, 0));
  totalOutstanding = computed(() => this.data.emis().reduce((a, e) => a + e.outstanding, 0));

  paidPct(e: Emi): number {
    return Math.round((e.paid / e.total) * 100);
  }

  async addEmi() {
    this.saving.set(true);
    try {
      await this.data.addEmi({
        name: this.newName(),
        bank: this.newBank(),
        emi: this.newEmiAmount(),
        paid: this.newPaid(),
        total: this.newTotal(),
        outstanding: this.newOutstanding(),
        rate: this.newRate(),
        due: this.newDueDate(),
      });
      this.showAdd.set(false);
      this.resetAdd();
    } finally {
      this.saving.set(false);
    }
  }

  openEdit(e: Emi) {
    this.editEmi.set(e);
    this.editName.set(e.name);
    this.editBank.set(e.bank);
    this.editEmiAmount.set(e.emi);
    this.editPaid.set(e.paid);
    this.editTotal.set(e.total);
    this.editOutstanding.set(e.outstanding);
    this.editRate.set(e.rate);
    this.editDueDate.set(e.due);
  }

  async saveEdit() {
    const e = this.editEmi();
    if (!e) return;
    this.saving.set(true);
    try {
      await this.data.updateEmi(e.id, {
        name: this.editName(),
        bank: this.editBank(),
        emi: this.editEmiAmount(),
        paid: this.editPaid(),
        total: this.editTotal(),
        outstanding: this.editOutstanding(),
        rate: this.editRate(),
        due: this.editDueDate(),
      });
      this.editEmi.set(null);
    } finally {
      this.saving.set(false);
    }
  }

  async doDelete() {
    const id = this.deleteId();
    if (!id) return;
    this.deleting.set(true);
    try {
      await this.data.deleteEmi(id);
      this.deleteId.set(null);
    } finally {
      this.deleting.set(false);
    }
  }

  private resetAdd() {
    this.newName.set('');
    this.newBank.set('');
    this.newEmiAmount.set(0);
    this.newPaid.set(0);
    this.newTotal.set(12);
    this.newOutstanding.set(0);
    this.newRate.set(0);
    this.newDueDate.set('');
  }
}
