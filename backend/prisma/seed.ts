import 'dotenv/config';
import { prisma as db } from '../src/config/database.js';
import { schedule } from '../src/modules/paytrack/paytrack.model.js';
import { randomUUID } from 'node:crypto';

try {
  if (!(await db.plan.findFirst())) {
    const now = new Date();
    const month = now.getUTCMonth(),
      year = now.getUTCFullYear();
    const first = new Date(Date.UTC(year, month - 1, 15)).toISOString().slice(0, 10);
    for (const [title, clientName, totalCents, count, paid] of [
      ['Kurumsal web sitesi', 'Atlas Tasarım', 7200000, 4, 1],
      ['Marka kimliği çalışması', 'Mavi Stüdyo', 3600000, 3, 2],
      ['Ürün danışmanlığı', 'Nova Teknoloji', 4800000, 6, 0],
      ['Arayüz tasarımı', 'Luna Creative', 2400000, 2, 2],
    ] as const) {
      await db.plan.create({
        data: {
          title,
          clientName,
          totalCents,
          installments: {
            create: schedule(totalCents, count, first).map((s, i) => ({
              ...s,
              paidCents: i < paid ? s.amountCents : 0,
              ...(i < paid
                ? {
                    payments: {
                      create: {
                        amountCents: s.amountCents,
                        note: 'Demo tahsilatı',
                        idempotencyKey: randomUUID(),
                      },
                    },
                  }
                : {}),
            })),
          },
        },
      });
    }
  }
  console.log('PayTrack demo verisi hazır.');
} finally {
  await db.$disconnect();
}
