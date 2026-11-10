import express from 'express';
import { sendPasswordResetCode, verifyPasswordResetCode, resetPassword, sendRegistrationCode, verifyRegistrationCode, sendEmailChangeCode, verifyEmailChangeCode } from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/forgot-password', sendPasswordResetCode);
router.post('/verify-reset-code', verifyPasswordResetCode);
router.post('/reset-password', resetPassword);

router.post('/send-registration-code', sendRegistrationCode);
router.post('/verify-registration-code', verifyRegistrationCode);

router.post('/send-email-change-code', authMiddleware, sendEmailChangeCode);
router.post('/verify-email-change-code', authMiddleware, verifyEmailChangeCode);

export default router;
