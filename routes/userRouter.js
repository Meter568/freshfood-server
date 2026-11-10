import Router from 'express';
const router = Router();
import { registration, login, getProfile, updateProfile, loginAdmin, loginGoogle, adminGetUsers, adminDeleteUser, adminGetUserById, adminUpdateUserById, adminToggleBlock } from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';

router.post('/registration', registration);
router.post('/login', login);
router.post('/login-admin', loginAdmin);
router.post('/google-login', loginGoogle)
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.delete('/admin/:id', authMiddleware, adminDeleteUser);
router.get('/', authMiddleware, adminGetUsers);
router.get("/admin/:id", authMiddleware, adminGetUserById);
router.put("/admin/:id", authMiddleware, adminUpdateUserById);
router.put('/admin/block/:id', authMiddleware, adminToggleBlock);

export default router;