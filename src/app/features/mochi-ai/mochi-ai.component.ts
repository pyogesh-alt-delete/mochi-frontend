import { Component, signal, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-mochi-ai',
    imports: [FormsModule],
    templateUrl: './mochi-ai.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./mochi-ai.component.scss']
})
export class MochiAiComponent {
  email = signal('');
  subscribed = signal(false);

  chips = [
    'What\'s my biggest expense?',
    'How much did I spend on food?',
    'Am I on track to reach my goals?',
    'Summarize this month\'s spending',
    'Which subscriptions should I cancel?',
  ];

  mockChat = [
    { role: 'ai', text: 'Hi! I\'m Mochi AI 🍡 I can help you understand your finances, spot trends, and give personalized advice. What would you like to know?' },
    { role: 'user', text: 'How much did I spend last month?' },
    { role: 'ai', text: 'Based on your transactions, you spent ₹28,116 last month. Your biggest categories were Food (₹8,200), Shopping (₹9,460), and Transport (₹4,318). You\'re 8% over your shopping budget! 🛍️' },
  ];

  subscribe() {
    if (this.email()) {
      this.subscribed.set(true);
    }
  }
}
