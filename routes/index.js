import Router from 'express';
import userRouter from './userRouter.js';
import productRouter from './productRouter.js';
import categoryRouter from './categoryRouter.js';
import cityRouter from './cityRouter.js';
import basketRouter from './basketRouter.js';
import orderRouter from './orderRouter.js';
import authRouter from './authRouter.js';
import countryRouter from './countryRouter.js';
import trademarkRouter from './trademarkRouter.js';

const router = Router();
router.use('/user', userRouter);
router.use('/products', productRouter);
router.use('/categories', categoryRouter);
router.use('/cities', cityRouter);
router.use('/basket', basketRouter);
router.use('/orders', orderRouter);
router.use('/auth', authRouter);
router.use('/countries', countryRouter);
router.use('/trademarks', trademarkRouter);

export default router;