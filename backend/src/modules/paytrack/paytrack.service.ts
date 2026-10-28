import { HttpError } from '../../common/http.js';
import { paytrackRepository as repo } from './paytrack.repository.js';
export const paytrackService = {
  list: repo.list,
  create: repo.create,
  pay: repo.pay,
  async get(id: string) {
    const plan = await repo.get(id);
    if (!plan) throw new HttpError(404, 'Ödeme planı bulunamadı.');
    return plan;
  },
};
