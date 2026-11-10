import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: 'sandbox.smtp.mailtrap.io',
    port: 2525,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const generateVerificationCode = () => {
    return Math.floor(10000 + Math.random() * 90000).toString();
};

export const sendVerificationCode = async (email, code, type) => {
    try {
        const getSubject = () => {
            switch (type) {
                case 'registration':
                    return 'Підтвердження реєстрації - FreshFood';
                case 'password_reset':
                    return 'Відновлення пароля - FreshFood';
                case 'email_change':
                    return 'Підтвердження зміни email - FreshFood';
                default:
                    return 'Підтвердження - FreshFood';
            }
        };
        const getTitle = () => {
            switch (type) {
                case 'registration':
                    return 'Підтвердження реєстрації';
                case 'password_reset':
                    return 'Відновлення пароля';
                case 'email_change':
                    return 'Підтвердження зміни email';
                default:
                    return 'Підтвердження';
            }
        };
        const getDescription = () => {
            switch (type) {
                case 'registration':
                    return 'Дякуємо за реєстрацію! Для завершення процесу реєстрації введіть наступний код:';
                case 'password_reset':
                    return 'Ви запросили відновлення пароля. Введіть наступний код для продовження:';
                case 'email_change':
                    return 'Ви змінюєте адресу електронної пошти. Введіть наступний код для підтвердження:';
                default:
                    return 'Введіть наступний код для підтвердження:';
            }
        };
        const subject = getSubject();
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #22c55e; margin: 0;">FreshFood</h1>
                </div>
                <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
                    <h2 style="color: #333; margin-top: 0; text-align: justify;">
                        ${getTitle()}
                    </h2>
                    <p style="color: #666; font-size: 16px; line-height: 1.5; text-align: justify;">
                        ${getDescription()}
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <div style="display: inline-block; background-color: #22c55e; color: white; padding: 15px 30px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 3px;">
                            ${code}
                        </div>
                    </div>
                    <p style="color: #999; font-size: 14px; margin-bottom: 0; text-align: justify;">
                        Цей код дійсний протягом 10 хвилин. Якщо ви не запитували цей код, проігноруйте це повідомлення.
                    </p>
                </div>
                <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                    <p>© 2024 FreshFood. Всі права захищені.</p>
                </div>
            </div>
        `;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: subject,
            html: htmlContent
        };
        const result = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', result.messageId);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};

export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const sendOrderCheck = async (email, orderData) => {
    try {
        const { order, items } = orderData;
        const subject = `Чек замовлення №${order.id} - FreshFood`;
        const itemsHtml = items.map(item => `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px; text-align: left;">${item.name}</td>
                <td style="padding: 10px; text-align: center;">${item.quantity}</td>
                <td style="padding: 10px; text-align: right;">${item.amount.toFixed(2)}₴</td>
            </tr>
        `).join('');
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #22c55e; margin: 0;">FreshFood</h1>
                    <p style="color: #666; margin: 5px 0;">Ваш чек замовлення</p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
                    <h2 style="color: #333; margin-top: 0; text-align: center;">Замовлення №${order.id}</h2>
                    
                    <div style="margin-bottom: 20px;">
                        <p style="margin: 5px 0;"><strong>Дата:</strong> ${new Date(order.createdAt).toLocaleDateString('uk-UA')}</p>
                        <p style="margin: 5px 0;"><strong>Спосіб оплати:</strong> ${order.paymentMethod === 'COD' ? 'Готівка при отриманні' : 'Онлайн-оплата'}</p>
                        <p style="margin: 5px 0;"><strong>Статус:</strong> ${order.status}</p>
                        <p style="margin: 5px 0;"><strong>Адреса доставки:</strong> ${order.street}, буд. ${order.houseNumber}${order.apartmentNumber ? ', кв. ' + order.apartmentNumber : ''}</p>
                        <p style="margin: 5px 0;"><strong>Номер телефону:</strong> ${order.phoneNumber}</p>
                    </div>
                    
                    <h3 style="color: #333; margin-bottom: 15px;">Товари:</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <thead>
                            <tr style="background-color: #e9ecef;">
                                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Назва</th>
                                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">Кількість</th>
                                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Сума</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>
                    
                    <div style="border-top: 2px solid #22c55e; padding-top: 15px;">
                        <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
                            <span>Загальна сума:</span>
                            <span style="color: #22c55e;">${order.totalAmount.toFixed(2)}₴</span>
                        </div>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                    <p>Дякуємо за замовлення! Очікуйте дзвінка від нашого менеджера.</p>
                    <p>© 2024 FreshFood. Всі права захищені.</p>
                </div>
            </div>
        `;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: subject,
            html: htmlContent
        };
        const result = await transporter.sendMail(mailOptions);
        console.log('Order check sent successfully:', result.messageId);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('Error sending order check:', error);
        return { success: false, error: error.message };
    }
};