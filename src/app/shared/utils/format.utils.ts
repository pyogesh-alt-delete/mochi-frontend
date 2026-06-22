// Indian number format (₹1,00,550)
export function fmt(n: number): string {
  const neg = n < 0;
  n = Math.round(Math.abs(n));
  const s = String(n);
  const l3 = s.slice(-3);
  let r = s.slice(0, -3);
  if (r) { r = r.replace(/\B(?=(\d\d)+(?!\d))/g, ','); }
  return (neg ? '-' : '') + '₹' + (r ? r + ',' : '') + l3;
}

// Short format (₹1.0L, ₹32k)
export function short(n: number): string {
  const neg = n < 0;
  n = Math.abs(n);
  let result: string;
  if (n >= 10000000) result = '₹' + (n/10000000).toFixed(1) + 'Cr';
  else if (n >= 100000) result = '₹' + (n/100000).toFixed(1) + 'L';
  else if (n >= 1000) result = '₹' + (n/1000).toFixed(0) + 'k';
  else result = '₹' + Math.round(n);
  return neg ? '-' + result : result;
}

export const CAT_COLORS: Record<string, string> = {
  Food: 'var(--c1)', Groceries: 'var(--c2)', Shopping: 'var(--c3)',
  Transport: 'var(--c6)', Bills: 'var(--c4)', Entertainment: 'var(--c5)',
  Health: 'var(--pos)', Salary: 'var(--pos)', Investment: 'var(--c2)', Transfer: 'var(--c1)'
};

export const CAT_HEX: Record<string, string> = {
  Food:'#818cf8', Groceries:'#2dd4bf', Shopping:'#fbbf24', Transport:'#38bdf8',
  Bills:'#fb7185', Entertainment:'#c084fc', Health:'#34d399', Salary:'#34d399',
  Investment:'#2dd4bf', Transfer:'#818cf8'
};

export const CAT_ICONS: Record<string, string> = {
  Food: '🍜', Groceries: '🛒', Shopping: '🛍️', Transport: '🚗',
  Bills: '⚡', Entertainment: '🎬', Health: '💪', Salary: '💰',
  Investment: '📈', Transfer: '↔️'
};
