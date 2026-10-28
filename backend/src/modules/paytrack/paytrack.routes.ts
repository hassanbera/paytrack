import { Router } from 'express';
import { controller as c } from './paytrack.controller.js';
export const router = Router();
router.get('/plans', c.list);
router.post('/plans', c.create);
router.get('/plans/:id', c.get);
router.post('/installments/:id/payments', c.pay);
