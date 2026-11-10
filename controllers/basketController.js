import { Basket, Product, ProductImages } from "../models/models.js";

export const addToBasket = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, quantity = 1 } = req.body;
        const product = await Product.findByPk(productId);
        if(!product) {
            return res.status(400).json({ success: false, message: "Product not found" });
        }
        const price = product.offert && product.offert > 0 ? product.offert : product.price;
        let basketItem = await Basket.findOne({ where: { userId, productId } });
        if(basketItem) {
            basketItem.quantity += quantity;
            basketItem.price = price;
            await basketItem.save();
        } else {
            basketItem = await Basket.create({ userId, productId, quantity, price });
        }
        return res.status(200).json({ 
            id: basketItem.id,
            productId: basketItem.productId,
            name: product.name,
            price: product.price,
            quantity: basketItem.quantity,
        });
    } catch (error) {
        console.log('Error adding to basket:', error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

export const getBasket = async (req, res) => {
    try {
        const userId = req.user.id;
        const items = await Basket.findAll({
            where: { userId },
            include: [
                {
                    model: Product,
                    as: 'product',
                    attributes: ['id', 'name', 'price', 'offert', 'servername'],
                    include: [
                        {
                            model: ProductImages,
                            as: 'productImages',
                            attributes: ['link'],
                            limit: 1,
                        }
                    ]
                },
            ],
        });

        const formtted = items.map((item) => {
            const product = item.product;
            const imageFile = product.productImages?.[0]?.link;
            const src = imageFile ? `http://localhost:5000/static/${imageFile}` : undefined;
            return {
                id: item.id,
                productId: product.id,
                name: product.name,
                servername: product.servername,
                price: product.offert && product.offert > 0 ? product.offert : product.price,
                image: src,
                quantity: item.quantity,
            }
        });
        return res.json(formtted);
    } catch (error) {
        console.log('Error fetching basket:', error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

export const updateBasketItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;
        const { quantity } = req.body;
        const basketItem = await Basket.findOne({ where: { userId, productId } });
        if(!basketItem) {
            return res.status(400).json({ success: false, message: "Item not found in basket" });
        }
        basketItem.quantity = quantity;
        await basketItem.save();
        return res.status(200).json({ productId: Number(productId), quantity });
    } catch (error) {
        console.log('Error updating basket item:', error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

export const removeFromBasket = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;
        const basketItem = await Basket.findOne({ where: { userId, productId } });
        if(!basketItem) {
            return res.status(404).json({ success: false, message: "Item not found in basket" });
        }
        await basketItem.destroy();
        return res.status(200).json({ success: true, message: "Item removed from basket" });
    } catch (error) {
        console.log('Error removing from basket:', error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}