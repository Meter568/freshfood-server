import { User, VerificationCode } from '../models/models.js';
import { generateVerificationCode, sendVerificationCode, isValidEmail } from '../services/emailService.js';
import bcrypt from 'bcrypt';

export const sendPasswordResetCode = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email обов\'язковий' });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ message: 'Невірний формат email' });
        }
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'Користувач з таким email не знайдений' });
        }
        const code = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await VerificationCode.destroy({
            where: { email, type: 'password_reset' }
        });
        await VerificationCode.create({
            email,
            code,
            type: 'password_reset',
            expiresAt
        });
        const emailResult = await sendVerificationCode(email, code, 'password_reset');
        if (emailResult.success) {
            res.status(200).json({ 
                message: 'Код відправлено на вашу пошту',
                email: email
            });
        } else {
            res.status(500).json({ message: 'Помилка відправки email' });
        }
    } catch (error) {
        console.error('Error in sendPasswordResetCode:', error);
        res.status(500).json({ message: 'Внутрішня помилка сервера' });
    }
};

export const verifyPasswordResetCode = async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            return res.status(400).json({ message: 'Email та код обов\'язкові' });
        }
        const verificationCode = await VerificationCode.findOne({
            where: {
                email,
                code,
                type: 'password_reset',
                isUsed: false
            }
        });
        if (!verificationCode) {
            return res.status(400).json({ message: 'Невірний код' });
        }
        if (new Date() > verificationCode.expiresAt) {
            await verificationCode.destroy();
            return res.status(400).json({ message: 'Код застарів' });
        }
        await verificationCode.update({ isUsed: true });
        res.status(200).json({ 
            message: 'Код підтверджено',
            token: 'valid'
        });
    } catch (error) {
        console.error('Error in verifyPasswordResetCode:', error);
        res.status(500).json({ message: 'Внутрішня помилка сервера' });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;
        if (!email || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: 'Всі поля обов\'язкові' });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'Паролі не співпадають' });
        }
        if (newPassword.length < 5) {
            return res.status(400).json({ message: 'Пароль повинен містити мінімум 5 символів' });
        }
        const verificationCode = await VerificationCode.findOne({
            where: {
                email,
                type: 'password_reset',
                isUsed: true
            },
            order: [['createdAt', 'DESC']]
        });
        if (!verificationCode) {
            return res.status(400).json({ message: 'Спочатку підтвердіть код' });
        }
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        if (verificationCode.createdAt < oneHourAgo) {
            return res.status(400).json({ message: 'Сесія застаріла, спробуйте знову' });
        }
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'Користувач не знайдений' });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await user.update({ password: hashedPassword });
        await VerificationCode.destroy({
            where: {
                email,
                type: 'password_reset'
            }
        });
        res.status(200).json({ message: 'Пароль успішно змінено' });
    } catch (error) {
        console.error('Error in resetPassword:', error);
        res.status(500).json({ message: 'Внутрішня помилка сервера' });
    }
};

export const sendRegistrationCode = async (req, res) => {
    try {
        const { email } = req.body;
        console.log('sendRegistrationCode called with email:', email);
        if (!email) {
            return res.status(400).json({ message: 'Email обов\'язковий' });
        }
        if (!isValidEmail(email)) {
            console.log('Invalid email format:', email);
            return res.status(400).json({ message: 'Невірний формат email' });
        }
        const existingUser = await User.findOne({ where: { email } });
        console.log('Existing user found:', existingUser);
        
        if (existingUser && existingUser.role !== 'guest') {
            console.log('User already exists with role:', existingUser.role);
            return res.status(400).json({ message: 'Користувач з таким email вже існує' });
        }
        const code = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await VerificationCode.destroy({
            where: { email, type: 'registration' }
        });
        await VerificationCode.create({
            email,
            code,
            type: 'registration',
            expiresAt
        });
        const emailResult = await sendVerificationCode(email, code, 'registration');
        
        if (emailResult.success) {
            res.status(200).json({ 
                message: 'Код підтвердження відправлено на вашу пошту',
                email: email
            });
        } else {
            res.status(500).json({ message: 'Помилка відправки email' });
        }
    } catch (error) {
        console.error('Error in sendRegistrationCode:', error);
        res.status(500).json({ message: 'Внутрішня помилка сервера' });
    }
};

export const verifyRegistrationCode = async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            return res.status(400).json({ message: 'Email та код обов\'язкові' });
        }
        const verificationCode = await VerificationCode.findOne({
            where: {
                email,
                code,
                type: 'registration',
                isUsed: false
            }
        });
        if (!verificationCode) {
            return res.status(400).json({ message: 'Невірний код' });
        }
        if (new Date() > verificationCode.expiresAt) {
            await verificationCode.destroy();
            return res.status(400).json({ message: 'Код застарів' });
        }
        await verificationCode.update({ isUsed: true });
        res.status(200).json({ 
            message: 'Email підтверджено',
            verified: true
        });
    } catch (error) {
        console.error('Error in verifyRegistrationCode:', error);
        res.status(500).json({ message: 'Внутрішня помилка сервера' });
    }
};

export const sendEmailChangeCode = async (req, res) => {
    try {
        const { newEmail } = req.body;
        const userId = req.user.id;
        if (!newEmail) {
            return res.status(400).json({ message: 'Email обов\'язковий' });
        }
        if (!isValidEmail(newEmail)) {
            return res.status(400).json({ message: 'Невірний формат email' });
        }
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Користувач не знайдений' });
        }
        const existingUser = await User.findOne({ where: { email: newEmail } });
        if (existingUser && existingUser.id !== userId) {
            return res.status(400).json({ message: 'Email вже використовується іншим користувачем' });
        }
        if (user.email === newEmail) {
            return res.status(400).json({ message: 'Новий email повинен відрізнятися від поточного' });
        }
        const code = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await VerificationCode.destroy({
            where: { 
                email: newEmail, 
                type: 'email_change'
            }
        });
        await VerificationCode.create({
            email: newEmail,
            code,
            type: 'email_change',
            expiresAt
        });
        const emailResult = await sendVerificationCode(newEmail, code, 'email_change');
        
        if (emailResult.success) {
            res.status(200).json({ 
                message: 'Код підтвердження відправлено на нову пошту',
                email: newEmail
            });
        } else {
            res.status(500).json({ message: 'Помилка відправки email' });
        }
    } catch (error) {
        console.error('Error in sendEmailChangeCode:', error);
        res.status(500).json({ message: 'Внутрішня помилка сервера' });
    }
};

export const verifyEmailChangeCode = async (req, res) => {
    try {
        const { newEmail, code } = req.body;
        const userId = req.user.id;
        if (!newEmail || !code) {
            return res.status(400).json({ message: 'Email та код обов\'язкові' });
        }
        const verificationCode = await VerificationCode.findOne({
            where: {
                email: newEmail,
                code,
                type: 'email_change',
                isUsed: false
            }
        });
        if (!verificationCode) {
            return res.status(400).json({ message: 'Невірний код' });
        }
        if (new Date() > verificationCode.expiresAt) {
            await verificationCode.destroy();
            return res.status(400).json({ message: 'Код застарів' });
        }
        await verificationCode.update({ isUsed: true });
        res.status(200).json({ 
            message: 'Код підтверджено',
            email: newEmail
        });
    } catch (error) {
        console.error('Error in verifyEmailChangeCode:', error);
        res.status(500).json({ message: 'Внутрішня помилка сервера' });
    }
};

