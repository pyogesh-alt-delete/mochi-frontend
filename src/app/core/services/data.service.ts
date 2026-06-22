import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Wallet {
  id: string;
  name: string;
  type: string;
  last4: string;
  bal: number;
  gradient: string;
}

export interface Transaction {
  id: string;
  merchant: string;
  category: string;
  wallet: string;
  amount: number;
  date: string;
  group: string;
}

export interface Budget {
  category: string;
  spent: number;
  limit: number;
}

export interface Goal {
  id: string;
  name: string;
  current: number;
  target: number;
  monthly: number;
  eta: string;
  color: string;
}

export interface Emi {
  id: string;
  name: string;
  bank: string;
  emi: number;
  paid: number;
  total: number;
  outstanding: number;
  rate: number;
  due: string;
}

export interface Recurring {
  id: string;
  name: string;
  amount: number;
  cycle: string;
  due: string;
  dueDay: number;
  category: string;
}

@Injectable({ providedIn: 'root' })
export class DataService {
  transactions = signal<Transaction[]>([]);
  wallets = signal<Wallet[]>([]);
  goals = signal<Goal[]>([]);
  emis = signal<Emi[]>([]);
  recurring = signal<Recurring[]>([]);
  loading = signal(false);

  // Budget limits from API — spent is derived reactively from transactions
  private _budgetLimits = signal<{ id: string; category: string; limit: number }[]>([]);

  budgets = computed<Budget[]>(() => {
    const spending = this.getCategorySpending();
    return this._budgetLimits().map((b) => ({
      category: b.category,
      limit: b.limit,
      spent: spending[b.category] ?? 0,
    }));
  });

  totalBalance = computed(() => this.wallets().reduce((sum, w) => sum + w.bal, 0));
  totalIncome = computed(() =>
    this.transactions().filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
  );
  totalExpenses = computed(() =>
    this.transactions()
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  );

  // name → id and id → name maps for wallet lookup
  private walletNameById = new Map<string, string>();
  private walletIdByName = new Map<string, string>();

  constructor(private http: HttpClient) {}

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      // Wallets first — needed to resolve wallet names in transactions
      const walletsRes = await lastValueFrom(
        this.http.get<{ wallets: any[] }>(`${environment.apiUrl}/wallets`)
      );
      this.wallets.set(walletsRes.wallets.map((w) => this.mapWallet(w)));

      const [txRes, budgetRes, goalRes, emisRes, recurRes] = await Promise.all([
        lastValueFrom(this.http.get<{ transactions: any[] }>(`${environment.apiUrl}/transactions`)),
        lastValueFrom(this.http.get<{ budgets: any[] }>(`${environment.apiUrl}/budgets`)),
        lastValueFrom(this.http.get<{ goals: any[] }>(`${environment.apiUrl}/goals`)),
        lastValueFrom(this.http.get<{ emis: any[] }>(`${environment.apiUrl}/emis`)),
        lastValueFrom(this.http.get<{ recurring: any[] }>(`${environment.apiUrl}/recurring`)),
      ]);

      this.transactions.set(txRes.transactions.map((t) => this.mapTransaction(t)));
      this._budgetLimits.set(
        budgetRes.budgets.map((b) => ({ id: b.id, category: b.category, limit: b.budgetLimit }))
      );
      this.goals.set(goalRes.goals.map((g) => this.mapGoal(g)));
      this.emis.set(emisRes.emis.map((e) => this.mapEmi(e)));
      this.recurring.set(recurRes.recurring.map((r) => this.mapRecurring(r)));
    } finally {
      this.loading.set(false);
    }
  }

  // ── Transactions ─────────────────────────────────────────────────────────

  async addTransaction(tx: Omit<Transaction, 'id' | 'date' | 'group'>): Promise<void> {
    const body = {
      merchant: tx.merchant,
      category: tx.category,
      walletId: this.walletIdByName.get(tx.wallet) ?? null,
      amount: tx.amount,
    };
    const res = await lastValueFrom(
      this.http.post<{ transaction: any }>(`${environment.apiUrl}/transactions`, body)
    );
    this.transactions.set([this.mapTransaction(res.transaction), ...this.transactions()]);
  }

  async updateTransaction(id: string, changes: Partial<Omit<Transaction, 'id' | 'date' | 'group'>>): Promise<void> {
    const body: Record<string, unknown> = {};
    if (changes.merchant !== undefined) body['merchant'] = changes.merchant;
    if (changes.amount !== undefined) body['amount'] = changes.amount;
    if (changes.category !== undefined) body['category'] = changes.category;
    if (changes.wallet !== undefined) body['walletId'] = this.walletIdByName.get(changes.wallet) ?? null;

    const res = await lastValueFrom(
      this.http.put<{ transaction: any }>(`${environment.apiUrl}/transactions/${id}`, body)
    );
    const mapped = this.mapTransaction(res.transaction);
    this.transactions.set(this.transactions().map((t) => (t.id === id ? mapped : t)));
  }

  async deleteTransaction(id: string): Promise<void> {
    await lastValueFrom(this.http.delete(`${environment.apiUrl}/transactions/${id}`));
    this.transactions.set(this.transactions().filter((t) => t.id !== id));
  }

  // ── Wallets ───────────────────────────────────────────────────────────────

  async addWallet(wallet: Omit<Wallet, 'id'>): Promise<void> {
    const res = await lastValueFrom(
      this.http.post<{ wallet: any }>(`${environment.apiUrl}/wallets`, {
        name: wallet.name,
        type: wallet.type,
        last4: wallet.last4,
        balance: wallet.bal,
        gradient: wallet.gradient,
      })
    );
    this.wallets.set([...this.wallets(), this.mapWallet(res.wallet)]);
  }

  // ── Goals ─────────────────────────────────────────────────────────────────

  async addGoal(goal: Omit<Goal, 'id'>): Promise<void> {
    const res = await lastValueFrom(
      this.http.post<{ goal: any }>(`${environment.apiUrl}/goals`, {
        name: goal.name,
        currentAmount: goal.current,
        targetAmount: goal.target,
        monthlyContribution: goal.monthly,
        color: goal.color,
      })
    );
    this.goals.set([...this.goals(), this.mapGoal(res.goal)]);
  }

  async updateGoal(id: string, changes: Partial<Omit<Goal, 'id' | 'eta'>>): Promise<void> {
    const body: Record<string, unknown> = {};
    if (changes.name !== undefined) body['name'] = changes.name;
    if (changes.current !== undefined) body['currentAmount'] = changes.current;
    if (changes.target !== undefined) body['targetAmount'] = changes.target;
    if (changes.monthly !== undefined) body['monthlyContribution'] = changes.monthly;
    if (changes.color !== undefined) body['color'] = changes.color;

    const res = await lastValueFrom(
      this.http.put<{ goal: any }>(`${environment.apiUrl}/goals/${id}`, body)
    );
    const mapped = this.mapGoal(res.goal);
    this.goals.set(this.goals().map((g) => (g.id === id ? mapped : g)));
  }

  async deleteGoal(id: string): Promise<void> {
    await lastValueFrom(this.http.delete(`${environment.apiUrl}/goals/${id}`));
    this.goals.set(this.goals().filter((g) => g.id !== id));
  }

  // ── EMIs ──────────────────────────────────────────────────────────────────

  async addEmi(emi: Omit<Emi, 'id'>): Promise<void> {
    const res = await lastValueFrom(
      this.http.post<{ emi: any }>(`${environment.apiUrl}/emis`, {
        name: emi.name,
        bank: emi.bank,
        emiAmount: emi.emi,
        paidInstallments: emi.paid,
        totalInstallments: emi.total,
        outstandingAmount: emi.outstanding,
        interestRate: emi.rate,
        dueDate: emi.due,
      })
    );
    this.emis.set([...this.emis(), this.mapEmi(res.emi)]);
  }

  async updateEmi(id: string, changes: Partial<Omit<Emi, 'id'>>): Promise<void> {
    const body: Record<string, unknown> = {};
    if (changes.name !== undefined) body['name'] = changes.name;
    if (changes.bank !== undefined) body['bank'] = changes.bank;
    if (changes.emi !== undefined) body['emiAmount'] = changes.emi;
    if (changes.paid !== undefined) body['paidInstallments'] = changes.paid;
    if (changes.total !== undefined) body['totalInstallments'] = changes.total;
    if (changes.outstanding !== undefined) body['outstandingAmount'] = changes.outstanding;
    if (changes.rate !== undefined) body['interestRate'] = changes.rate;
    if (changes.due !== undefined) body['dueDate'] = changes.due;

    const res = await lastValueFrom(
      this.http.put<{ emi: any }>(`${environment.apiUrl}/emis/${id}`, body)
    );
    const mapped = this.mapEmi(res.emi);
    this.emis.set(this.emis().map((e) => (e.id === id ? mapped : e)));
  }

  async deleteEmi(id: string): Promise<void> {
    await lastValueFrom(this.http.delete(`${environment.apiUrl}/emis/${id}`));
    this.emis.set(this.emis().filter((e) => e.id !== id));
  }

  // ── Recurring ─────────────────────────────────────────────────────────────

  async addRecurring(r: { name: string; amount: number; cycle: string; dueDay: number; category: string }): Promise<void> {
    const res = await lastValueFrom(
      this.http.post<{ recurring: any }>(`${environment.apiUrl}/recurring`, r)
    );
    this.recurring.set([...this.recurring(), this.mapRecurring(res.recurring)]);
  }

  async updateRecurring(id: string, changes: { name?: string; amount?: number; cycle?: string; dueDay?: number; category?: string }): Promise<void> {
    const res = await lastValueFrom(
      this.http.put<{ recurring: any }>(`${environment.apiUrl}/recurring/${id}`, changes)
    );
    const mapped = this.mapRecurring(res.recurring);
    this.recurring.set(this.recurring().map((r) => (r.id === id ? mapped : r)));
  }

  async deleteRecurring(id: string): Promise<void> {
    await lastValueFrom(this.http.delete(`${environment.apiUrl}/recurring/${id}`));
    this.recurring.set(this.recurring().filter((r) => r.id !== id));
  }

  // ── Computed helpers ──────────────────────────────────────────────────────

  getTransactionsByGroup(): Record<string, Transaction[]> {
    const groups: Record<string, Transaction[]> = {};
    for (const tx of this.transactions()) {
      if (!groups[tx.group]) groups[tx.group] = [];
      groups[tx.group].push(tx);
    }
    return groups;
  }

  getCategorySpending(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const tx of this.transactions()) {
      if (tx.amount < 0) {
        result[tx.category] = (result[tx.category] || 0) + Math.abs(tx.amount);
      }
    }
    return result;
  }

  // ── Private mappers ───────────────────────────────────────────────────────

  private mapWallet(w: any): Wallet {
    this.walletNameById.set(w.id, w.name);
    this.walletIdByName.set(w.name, w.id);
    return {
      id: w.id,
      name: w.name,
      type: w.type,
      last4: w.last4,
      bal: w.balance,
      gradient: w.gradient ?? '',
    };
  }

  private mapTransaction(t: any): Transaction {
    return {
      id: t.id,
      merchant: t.merchant,
      category: t.category,
      wallet: this.walletNameById.get(t.walletId) ?? '—',
      amount: t.amount,
      date: t.date,
      group: this.dateToGroup(t.date),
    };
  }

  private mapGoal(g: any): Goal {
    return {
      id: g.id,
      name: g.name,
      current: g.currentAmount,
      target: g.targetAmount,
      monthly: g.monthlyContribution,
      eta: g.eta ?? '',
      color: g.color ?? 'var(--c1)',
    };
  }

  private mapEmi(e: any): Emi {
    return {
      id: e.id,
      name: e.name,
      bank: e.bank,
      emi: e.emiAmount,
      paid: e.paidInstallments,
      total: e.totalInstallments,
      outstanding: e.outstandingAmount,
      rate: e.interestRate,
      due: e.dueDate,
    };
  }

  private mapRecurring(r: any): Recurring {
    return {
      id: r.id,
      name: r.name,
      amount: r.amount,
      cycle: r.cycle,
      due: this.ordinal(r.dueDay),
      dueDay: r.dueDay,
      category: r.category,
    };
  }

  private dateToGroup(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayMs = 86_400_000;
    const diff = todayStart.getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    if (diff === 0) return 'Today';
    if (diff === dayMs) return 'Yesterday';
    if (diff < 7 * dayMs) return 'This week';
    return 'Earlier';
  }

  private ordinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
}
