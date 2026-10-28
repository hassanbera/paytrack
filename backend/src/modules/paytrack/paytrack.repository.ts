import { prisma } from '../../config/database.js';
import { HttpError } from '../../common/http.js';
import type { PlanInput, PaymentInput } from './paytrack.model.js';
import { schedule } from './paytrack.model.js';
const include = {
  installments: {
    orderBy: { number: 'asc' as const },
    include: { payments: { orderBy: { createdAt: 'desc' as const } } },
  },
};
export const paytrackRepository = {
  list: () => prisma.plan.findMany({ orderBy: { createdAt: 'desc' }, include }),
  get: (id: string) => prisma.plan.findUnique({ where: { id }, include }),
  create: (input: PlanInput) =>
    prisma.plan.create({
      data: {
        title: input.title,
        clientName: input.clientName,
        clientEmail: input.clientEmail,
        totalCents: input.totalCents,
        installments: {
          create: schedule(input.totalCents, input.installmentCount, input.firstDueDate),
        },
      },
      include,
    }),
  pay: (installmentId: string, input: PaymentInput) =>
    prisma.$transaction(async (tx) => {
      // Lock before reading the balance: concurrent payments cannot overspend it.
      await tx.$queryRaw`SELECT id FROM "Installment" WHERE id = ${installmentId}::uuid FOR UPDATE`;
      const installment = await tx.installment.findUnique({ where: { id: installmentId } });
      if (!installment) throw new HttpError(404, 'Taksit bulunamadı.');
      const previous = await tx.payment.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (previous) {
        if (
          previous.installmentId !== installmentId ||
          previous.amountCents !== input.amountCents ||
          previous.note !== input.note
        )
          throw new HttpError(409, 'İşlem anahtarı başka bir tahsilat için kullanıldı.');
        return previous;
      }
      if (input.amountCents > installment.amountCents - installment.paidCents)
        throw new HttpError(409, 'Tahsilat kalan taksit tutarını aşamaz.');
      const payment = await tx.payment.create({ data: { ...input, installmentId } });
      await tx.installment.update({
        where: { id: installmentId },
        data: { paidCents: { increment: input.amountCents } },
      });
      return payment;
    }),
};
