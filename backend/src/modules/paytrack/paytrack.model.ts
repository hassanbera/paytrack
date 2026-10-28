import { z } from 'zod';
export const id = z.string().uuid();
export const planInput = z
  .object({
    title: z.string().trim().min(1).max(120),
    clientName: z.string().trim().min(1).max(100),
    clientEmail: z.union([z.string().email().max(200), z.literal('')]).default(''),
    totalCents: z.number().int().min(1).max(1_000_000_000),
    installmentCount: z.number().int().min(1).max(36),
    firstDueDate: z.string().date(),
  })
  .refine((x) => x.totalCents >= x.installmentCount, {
    message: 'Her taksit en az 1 kuruş olmalıdır.',
  });
export const paymentInput = z.object({
  amountCents: z.number().int().min(1).max(1_000_000_000),
  note: z.string().trim().max(300).default(''),
  idempotencyKey: id,
});
export type PlanInput = z.infer<typeof planInput>;
export type PaymentInput = z.infer<typeof paymentInput>;
export function schedule(totalCents: number, count: number, firstDueDate: string) {
  const first = new Date(firstDueDate + 'T00:00:00Z');
  return Array.from({ length: count }, (_, i) => {
    const year = first.getUTCFullYear(),
      month = first.getUTCMonth() + i;
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return {
      number: i + 1,
      amountCents: Math.floor(totalCents / count) + (i < totalCents % count ? 1 : 0),
      dueDate: new Date(Date.UTC(year, month, Math.min(first.getUTCDate(), lastDay))),
    };
  });
}
