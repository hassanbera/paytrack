import type { Request, Response } from 'express';
import { paytrackService as service } from './paytrack.service.js';
import { id, planInput, paymentInput } from './paytrack.model.js';
export const controller = {
  async list(_req: Request, res: Response) {
    res.json({ data: await service.list() });
  },
  async get(req: Request, res: Response) {
    res.json({ data: await service.get(id.parse(req.params.id)) });
  },
  async create(req: Request, res: Response) {
    res.status(201).json({ data: await service.create(planInput.parse(req.body)) });
  },
  async pay(req: Request, res: Response) {
    res
      .status(201)
      .json({ data: await service.pay(id.parse(req.params.id), paymentInput.parse(req.body)) });
  },
};
