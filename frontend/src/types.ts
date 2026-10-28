export interface Payment {
  id: string;
  amountCents: number;
  note: string;
  createdAt: string;
}
export interface Installment {
  id: string;
  number: number;
  amountCents: number;
  paidCents: number;
  dueDate: string;
  payments: Payment[];
}
export interface Plan {
  id: string;
  title: string;
  clientName: string;
  clientEmail: string;
  totalCents: number;
  installments: Installment[];
}
export const paid = (p: Plan) => p.installments.reduce((n, i) => n + i.paidCents, 0);
export function overdue(i: Installment) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
  return i.paidCents < i.amountCents && i.dueDate.slice(0, 10) < today;
}
export function status(p: Plan) {
  return paid(p) === p.totalCents
    ? 'Tamamlandı'
    : p.installments.some(overdue)
      ? 'Gecikmiş'
      : 'Devam ediyor';
}
export function cents(value: FormDataEntryValue | null) {
  const s = String(value ?? '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) throw new Error('Tutar en fazla iki ondalık basamak içermeli.');
  const [whole, fraction = ''] = s.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}
