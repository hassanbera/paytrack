import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { schedule } from '../src/modules/paytrack/paytrack.model.js';
const created: string[] = [];
afterAll(async () => {
  await prisma.plan.deleteMany({ where: { id: { in: created } } });
  await prisma.$disconnect();
});
async function plan() {
  const p = (
    await request(app)
      .post('/api/plans')
      .send({
        title: 'Test plan',
        clientName: 'Test Client',
        totalCents: 10000,
        installmentCount: 1,
        firstDueDate: '2026-01-31',
      })
      .expect(201)
  ).body.data;
  created.push(p.id);
  return p;
}
describe('PayTrack accounting invariants', () => {
  it('allocates every kuruş exactly and clamps month-end dates', () => {
    const rows = schedule(10000, 3, '2026-01-31');
    expect(rows.map((r) => r.amountCents)).toEqual([3334, 3333, 3333]);
    expect(rows[1]?.dueDate.toISOString().slice(0, 10)).toBe('2026-02-28');
    expect(rows[2]?.dueDate.toISOString().slice(0, 10)).toBe('2026-03-31');
  });
  it('replays identical payments once and rejects conflicting keys', async () => {
    const p = await plan(),
      url = '/api/installments/' + p.installments[0].id + '/payments';
    const body = { amountCents: 4000, idempotencyKey: randomUUID() };
    const a = await request(app).post(url).send(body).expect(201);
    const b = await request(app).post(url).send(body).expect(201);
    expect(a.body.data.id).toBe(b.body.data.id);
    const detail = (await request(app).get('/api/plans/' + p.id)).body.data;
    expect(detail.installments[0].paidCents).toBe(4000);
    expect(detail.installments[0].payments).toHaveLength(1);
    await request(app)
      .post(url)
      .send({ ...body, amountCents: 2000 })
      .expect(409);
  });
  it('serializes simultaneous payments and prevents overpayment', async () => {
    const p = await plan(),
      url = '/api/installments/' + p.installments[0].id + '/payments';
    const responses = await Promise.all(
      [1, 2].map(() =>
        request(app).post(url).send({ amountCents: 7000, idempotencyKey: randomUUID() }),
      ),
    );
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    const installment = await prisma.installment.findUniqueOrThrow({
      where: { id: p.installments[0].id },
    });
    expect(installment.paidCents).toBe(7000);
  });
  it('rejects fractions of a kuruş and invalid dates', async () => {
    await request(app)
      .post('/api/plans')
      .send({
        title: 'Bad',
        clientName: 'X',
        totalCents: 1.5,
        installmentCount: 2,
        firstDueDate: '2026-02-31',
      })
      .expect(400);
  });
});
