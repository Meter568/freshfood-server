import { Order, Product, Basket, OrderItem, Category, ProductImages, User } from "../models/models.js";
import { sendOrderCheck } from "../services/emailService.js";
import bcrypt from 'bcrypt';

export const createOrder = async (req, res) => {
    try {
        let userId = req.user?.id;
        let guestEmail = req.body.guestEmail;
        let guestPhoneNumber = req.body.phoneNumber;
        const { cityId, street, houseNumber, apartmentNumber, paymentMethod, cardNumber, phoneNumber } = req.body;
        console.log('Order creation request:', {
            userId,
            guestEmail,
            guestPhoneNumber,
            cityId,
            street,
            houseNumber,
            apartmentNumber,
            paymentMethod,
            cardNumber,
            phoneNumber,
            basketItems: req.body.basketItems?.length || 0
        });
        console.log('Guest email validation:', {
            hasUserId: !!userId,
            hasGuestEmail: !!guestEmail,
            guestEmailValue: guestEmail,
            guestEmailTrimmed: guestEmail ? guestEmail.trim() : 'N/A',
            willProcessAsGuest: !userId && guestEmail && guestEmail.trim()
        });
        if (!userId && guestEmail && guestEmail.trim()) {
            guestEmail = String(guestEmail).trim().toLowerCase();
            console.log('Creating/updating guest user with data:', { 
                email: guestEmail, 
                cityId, 
                street, 
                houseNumber, 
                apartmentNumber, 
                phoneNumber: guestPhoneNumber 
            });
            const randomString = Math.random().toString(36).slice(-8);
            const generatePassword = `guest-${randomString}`
            const hashPassword = await bcrypt.hash(generatePassword, 5);
            let guestUser = await User.findOne({ where: { email: guestEmail } });
            if (!guestUser) {
                guestUser = await User.create({
                    name: 'Гість',
                    email: guestEmail,
                    password: hashPassword,
                    role: 'guest',
                    cityId: cityId || null,
                    street: street || null,
                    houseNumber: houseNumber || null,
                    apartmentNumber: apartmentNumber || null,
                    phoneNumber: guestPhoneNumber || null,
                });
            } else {
                if (guestPhoneNumber && !guestUser.phoneNumber) {
                    guestUser.phoneNumber = guestPhoneNumber;
                }
                if (cityId && !guestUser.cityId) {
                    guestUser.cityId = cityId;
                }
                if (street && !guestUser.street) {
                    guestUser.street = street;
                }
                if (houseNumber && !guestUser.houseNumber) {
                    guestUser.houseNumber = houseNumber;
                }
                if (apartmentNumber && !guestUser.apartmentNumber) {
                    guestUser.apartmentNumber = apartmentNumber;
                }
                await guestUser.save();
                console.log('Updated existing guest user:', guestUser.email);
            }
            console.log('Guest user created/updated successfully:', {
                id: guestUser.id,
                email: guestUser.email,
                cityId: guestUser.cityId,
                street: guestUser.street,
                houseNumber: guestUser.houseNumber,
                apartmentNumber: guestUser.apartmentNumber,
                phoneNumber: guestUser.phoneNumber
            });
            userId = guestUser.id;
        }
        console.log(userId)
        if (!userId) {
            console.log('No userId found, checking guest email:', {
                guestEmail,
                guestEmailType: typeof guestEmail,
                guestEmailLength: guestEmail ? guestEmail.length : 0,
                guestEmailTrimmed: guestEmail ? guestEmail.trim() : 'N/A'
            });
            return res.status(401).json({ 
                success: false, 
                message: 'Не вдалося визначити користувача або email.',
                debug: {
                    hasUserId: !!userId,
                    hasGuestEmail: !!guestEmail,
                    guestEmailValue: guestEmail
                }
            });
        }
        let basketItems = req.user
            ? await Basket.findAll({
                where: { userId },
                include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'price', 'offert', 'categoryId'] }]
            })
            : (req.body.basketItems || []);
        if (!basketItems || !basketItems.length) {
            return res.status(400).json({ success: false, message: 'Кошик порожній (guest).' });
        }
        const validBasketItems = basketItems.filter(item => req.user ? item.product : item.productId && item.name && item.price && item.quantity);
        if(validBasketItems.length === 0) {
            return res.status(400).json({ success: false, message: 'Не знайдено валідних товарів у кошику.' });
        }
        const totalAmount = validBasketItems.reduce((total, item) => {
            const price = item.product ? (item.product.offert && item.product.offert > 0 ? item.product.offert : item.product.price) : item.price;
            return total + (price * item.quantity);
        }, 0);
        const paymentStatus = paymentMethod === 'Online' ? 'Оплачано' : 'Очікує';
        if (!cityId || !street || !houseNumber || !paymentMethod) {
            return res.status(400).json({ success: false, message: 'Відсутні обов\'язкові поля: місто, вулиця, номер будинку або спосіб оплати' });
        }
        if (totalAmount <= 0 || isNaN(totalAmount)) {
            return res.status(400).json({ success: false, message: 'Невірна загальна сума' });
        }
        const order = await Order.create({
            userId,
            cityId: parseInt(cityId),
            street,
            houseNumber: houseNumber,
            apartmentNumber: apartmentNumber ?? null,
            phoneNumber: phoneNumber ?? null,
            status: 'Обробка',
            totalAmount,
            paymentMethod,
            paymentStatus,
            cardNumber: paymentMethod === 'Online' ? cardNumber : null,
        });
        for(const item of validBasketItems) {
            await OrderItem.create({
                orderId: order.id,
                productId: req.user ? parseInt(item.productId) : parseInt(item.productId),
                subcategoryId: req.user ? parseInt(item.product.categoryId) : (item.subcategoryId || 1), 
                quantity: parseInt(item.quantity),
                unitPrice: req.user ? parseFloat(item.product.offert && item.product.offert > 0 ? item.product.offert : item.product.price) : parseFloat(item.price),
            });
            if (req.user) await item.destroy();
        }
        try {
            const emailToSend = req.user ? req.user.email : guestEmail;
            if (emailToSend) {
                const orderData = {
                    order: {
                        id: order.id,
                        createdAt: order.createdAt,
                        paymentMethod: order.paymentMethod,
                        status: order.status,
                        totalAmount: order.totalAmount,
                        street: order.street,
                        houseNumber: order.houseNumber,
                        apartmentNumber: order.apartmentNumber,
                        phoneNumber: order.phoneNumber
                    },
                    items: validBasketItems.map(item => ({
                        name: req.user ? item.product.name : item.name,
                        quantity: item.quantity,
                        amount: req.user ? (item.product.offert && item.product.offert > 0 ? item.product.offert : item.product.price) * item.quantity : item.price * item.quantity
                    }))
                };
                
                await sendOrderCheck(emailToSend, orderData);
                console.log(`Order check sent to ${emailToSend}`);
            }
        } catch (emailError) {
            console.log('Failed to send order check:', emailError);
        }
        return res.status(201).json({ order });
    } catch (error) {
        console.log('Error creating order:', error);
        return res.status(500).json({ success: false, message: 'Внутрішня помилка сервера' });
    }
};

export const getOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await Order.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: OrderItem,
                    as: 'orderItems',
                    include: [
                        {
                            model: Product,
                            as: 'product',
                            include: [
                                { model: Category, as: 'category', attributes: ['name'] },
                                { model: ProductImages, as: 'productImages', attributes: ['link'], limit: 1 }
                            ],
                            attributes: ['id','name','price','offert']
                        }
                    ]
                }
            ]
        });
        const shaped = orders.map((o) => {
            const items = (o.orderItems || []).map((it) => {
                const p = it.product;
                const img = p?.productImages?.[0]?.link
                    ? `http://localhost:5000/static/${p.productImages[0].link}`
                    : undefined;
                const unit = p?.offert && p.offert > 0 ? p.offert : p?.price || 0;
                return {
                    id: it.id,
                    name: p?.name || '',
                    category: p?.category?.name || '',
                    quantity: it.quantity,
                    amount: unit * it.quantity,
                    image: img,
                };
            });
            return {
                id: o.id,
                paymentMethod: o.paymentMethod,
                totalAmount: o.totalAmount,
                status: o.status,
                deliveryStatus: o.deliveryStatus,
                createdAt: o.createdAt,
                street: o.street,
                houseNumber: o.houseNumber,
                apartmentNumber: o.apartmentNumber,
                phoneNumber: o.phoneNumber,
                cardNumber: o.cardNumber,
                items,
            };
        });
        return res.json(shaped);
    } catch (error) {
        console.log('Error fetching orders:', error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

export const getOrdersByGuestEmail = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email обов'язковий" });
        }
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ success: false, message: "Користувача з таким email не знайдено" });
        }
        const orders = await Order.findAll({
            where: { userId: user.id },
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: OrderItem,
                    as: 'orderItems',
                    include: [
                        {
                            model: Product,
                            as: 'product',
                            include: [
                                { model: Category, as: 'category', attributes: ['name'] },
                                { model: ProductImages, as: 'productImages', attributes: ['link'], limit: 1 }
                            ],
                            attributes: ['id','name','price','offert']
                        }
                    ]
                }
            ]
        });
        const shaped = orders.map((o) => {
            const items = (o.orderItems || []).map((it) => {
                const p = it.product;
                const img = p?.productImages?.[0]?.link
                    ? `http://localhost:5000/static/${p.productImages[0].link}`
                    : undefined;
                const unit = p?.offert && p.offert > 0 ? p.offert : p?.price || 0;
                return {
                    id: it.id,
                    name: p?.name || '',
                    category: p?.category?.name || '',
                    quantity: it.quantity,
                    amount: unit * it.quantity,
                    image: img,
                };
            });
            return {
                id: o.id,
                paymentMethod: o.paymentMethod,
                totalAmount: o.totalAmount,
                status: o.status,
                deliveryStatus: o.deliveryStatus,
                createdAt: o.createdAt,
                street: o.street,
                houseNumber: o.houseNumber,
                apartmentNumber: o.apartmentNumber,
                phoneNumber: o.phoneNumber,
                cardNumber: o.cardNumber,
                items,
            };
        });
        return res.json(shaped);
    } catch (error) {
        console.log('Error fetching guest orders:', error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

export const adminGetAllOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: OrderItem,
                    as: 'orderItems',
                    include: [
                        {
                            model: Product,
                            as: 'product',
                            include: [
                                { model: Category, as: 'category', attributes: ['name'] },
                                { model: ProductImages, as: 'productImages', attributes: ['link'], limit: 1 }
                            ],
                            attributes: ['id','name','price','offert']
                        }
                    ]
                },
                { model: User, attributes: ['name'] }
            ]
        });
        const shaped = orders.map((o) => {
            const items = (o.orderItems || []).map((it) => {
                const p = it.product;
                const img = p?.productImages?.[0]?.link
                    ? `http://localhost:5000/static/${p.productImages[0].link}`
                    : undefined;
                const unit = p?.offert && p.offert > 0 ? p.offert : p?.price || 0;
                return {
                    id: it.id,
                    name: p?.name || '',
                    category: p?.category?.name || '',
                    quantity: it.quantity,
                    amount: unit * it.quantity,
                    image: img,
                };
            });
            return {
                id: o.id,
                paymentMethod: o.paymentMethod,
                totalAmount: o.totalAmount,
                status: o.status,
                deliveryStatus: o.deliveryStatus,
                createdAt: o.createdAt,
                street: o.street,
                houseNumber: o.houseNumber,
                apartmentNumber: o.apartmentNumber,
                cardNumber: o.cardNumber,
                userName: o.user?.name,
                items,
            };
        });
        return res.json(shaped);
    } catch (error) {
        console.log('Error fetching all orders:', error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

export const resendOrderCheck = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Необхідна авторизація' });
        }
        const order = await Order.findOne({
            where: { id: orderId, userId },
            include: [
                {
                    model: OrderItem,
                    as: 'orderItems',
                    include: [
                        {
                            model: Product,
                            as: 'product',
                            attributes: ['id', 'name', 'price', 'offert']
                        }
                    ]
                }
            ]
        });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Замовлення не знайдено' });
        }
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Користувач не знайдений' });
        }
        const orderData = {
            order: {
                id: order.id,
                createdAt: order.createdAt,
                paymentMethod: order.paymentMethod,
                status: order.status,
                totalAmount: order.totalAmount,
                street: order.street,
                houseNumber: order.houseNumber,
                apartmentNumber: order.apartmentNumber
            },
            items: order.orderItems.map(item => ({
                name: item.product.name,
                quantity: item.quantity,
                amount: item.unitPrice * item.quantity
            }))
        };
        const emailResult = await sendOrderCheck(user.email, orderData);
        
        if (emailResult.success) {
            return res.json({ success: true, message: 'Чек успішно відправлено на email' });
        } else {
            return res.status(500).json({ success: false, message: 'Не вдалося відправити чек' });
        }
        
    } catch (error) {
        console.log('Error resending order check:', error);
        return res.status(500).json({ success: false, message: 'Внутрішня помилка сервера' });
    }
};

export const adminUpdateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, deliveryStatus } = req.body;
        const order = await Order.findByPk(id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        if (typeof status !== 'undefined') order.status = status;
        if (typeof deliveryStatus !== 'undefined') order.deliveryStatus = deliveryStatus;
        await order.save();
        return res.json({ success: true, order });
    } catch (error) {
        console.log('Error updating order status:', error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

export const adminDeleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findByPk(id);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        await order.destroy();
        return res.json({ success: true, message: "Order deleted" });
    } catch (error) {
        console.log('Error deleting order:', error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const getOrdersByUserId = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const orders = await Order.findAll({
            where: { userId: id },
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: OrderItem,
                    as: 'orderItems',
                    include: [
                        {
                            model: Product,
                            as: 'product',
                            include: [
                                { model: Category, as: 'category', attributes: ['name'] },
                                { model: ProductImages, as: 'productImages', attributes: ['link'], limit: 1 }
                            ],
                            attributes: ['id','name','price','offert']
                        }
                    ]
                },
                {
                    model: User,
                    attributes: ['id', 'name', 'email']
                },
            ],
        });
        const shaped = orders.map((o) => {
            const items = (o.orderItems || []).map((it) => {
                const p = it.product;
                const img = p?.productImages?.[0]?.link
                    ? `http://localhost:5000/static/${p.productImages[0].link}`
                    : undefined;
                const unit = p?.offert && p.offert > 0 ? p.offert : p?.price || 0;
                return {
                    id: it.id,
                    name: p?.name || '',
                    category: p?.category?.name || '',
                    quantity: it.quantity,
                    amount: unit * it.quantity,
                    image: img,
                };
            });
            return {
                id: o.id,
                paymentMethod: o.paymentMethod,
                totalAmount: o.totalAmount,
                status: o.status,
                deliveryStatus: o.deliveryStatus,
                createdAt: o.createdAt,
                street: o.street,
                houseNumber: o.houseNumber,
                apartmentNumber: o.apartmentNumber,
                cardNumber: o.cardNumber,
                userName: o.user?.name,
                items,
            };
        });
        return res.status(200).json({ success: true, shaped });
    } catch(error) {
        console.log('Error fetching orders for user:', error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};