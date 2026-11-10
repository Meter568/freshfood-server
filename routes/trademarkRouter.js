import Router from 'express';
import { getAllTrademarks, addTrademark, updateTrademark, deleteTrademark } from '../controllers/trademarkController.js';

const router = Router();

router.get('/', getAllTrademarks);
router.post('/', addTrademark);
router.put('/:id', updateTrademark);
router.delete('/:id', deleteTrademark);

export default router;
