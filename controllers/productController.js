import { Product, ProductImages, Category } from '../models/models.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { Op } from 'sequelize';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const createProduct = async (req, res) => {
    const { name, servername, trademarkId, countryId, description, price, offert, categoryId, images, inStock } =
        req.body;
    try {
        const newProduct = await Product.create({
            name,
            servername,
            trademarkId,
            countryId,
            description,
            price,
            offert,
            categoryId,
            inStock: inStock !== undefined ? inStock : true,
        });
        const uploaded = req.files?.images;
        if (uploaded) {
            const filesArray = Array.isArray(uploaded) ? uploaded : [uploaded];
            for (const file of filesArray) {
                try {
                    const ext = path.extname(file.name) || '.jpg';
                    const fileName = `${uuidv4()}${ext}`;
                    const uploadPath = path.resolve(__dirname, '..', 'static', fileName);
                    await file.mv(uploadPath);
                    await ProductImages.create({ link: fileName, productId: newProduct.id });
                } catch (fileErr) {
                    return res
                        .status(500)
                        .json({ success: false, message: 'Error while saving the file', error: fileErr.message });
                }
            }
        } else if (images && (Array.isArray(images) ? images.length > 0 : true)) {
            try {
                const normalized = Array.isArray(images) ? images : [images];
                const productImages = normalized.map((link) => ({ link, productId: newProduct.id }));
                await ProductImages.bulkCreate(productImages);
            } catch (imgErr) {
                return res
                    .status(500)
                    .json({ success: false, message: 'Error while saving image links', error: imgErr.message });
            }
        }
        let productWithImages;
        try {
            productWithImages = await Product.findByPk(newProduct.id, {
                include: [{ model: ProductImages, as: 'productImages' }],
            });
        } catch (findErr) {
            return res.status(500).json({
                success: false,
                message: 'Error retrieving product with images',
                error: findErr.message,
            });
        }
        console.log('Success add product');
        res.status(201).json({ success: true, data: productWithImages });
    } catch (error) {
        console.log('Error creating product:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
};

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.findAll({
            include: [
                {
                    model: ProductImages,
                    as: 'productImages',
                    attributes: ['id', 'link'],
                },
            ],
            order: [['createdAt', 'DESC']],
        });
        res.status(200).json({ succes: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const getProductsByCategory = async (req, res) => {
    try {
        const { slug } = req.params;
        const category = await Category.findOne({ where: { slug } });
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        const products = await Product.findAll({
            where: { categoryId: category.id },
            include: [
                {
                    model: ProductImages,
                    as: 'productImages',
                    attributes: ['id', 'link'],
                },
            ],
            order: [['createdAt', 'DESC']],
        });
        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

async function getAllCategoryIds(categoryId) {
    const ids = [categoryId];
    const children = await Category.findAll({ where: { parent_id: categoryId } });
    for (const child of children) {
        ids.push(...(await getAllCategoryIds(child.id)));
    }
    return ids;
}

export const getProductsByParentCategory = async (req, res) => {
    try {
        const { slug } = req.params;
        const category = await Category.findOne({ where: { slug } });
        if (!category) {
            return res.status(404).json({ succes: false, message: 'Category not found' });
        }
        const ids = await getAllCategoryIds(category.id);
        const products = await Product.findAll({
            where: { categoryId: { [Op.in]: ids } },
            include: [
                {
                    model: ProductImages,
                    as: 'productImages',
                    attributes: ['id', 'link'],
                },
            ],
            order: [['createdAt', 'DESC']],
        });
        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const getProductByServername = async (req, res) => {
    try {
        const { servername } = req.params;
        const product = await Product.findOne({
            where: { servername },
            include: [
                {
                    model: ProductImages,
                    as: 'productImages',
                    attributes: ['id', 'link'],
                },
            ],
        });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id, { include: [{ model: ProductImages, as: 'productImages' }] });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        const { name, servername, trademarkId, countryId, description, price, offert, categoryId, inStock } = req.body;
        if (typeof name !== 'undefined') product.name = name;
        if (typeof servername !== 'undefined') product.servername = servername;
        if (typeof trademarkId !== 'undefined') product.trademarkId = trademarkId;
        if (typeof countryId !== 'undefined') product.countryId = countryId;
        if (typeof description !== 'undefined') product.description = description;
        if (typeof price !== 'undefined') product.price = price;
        if (typeof offert !== 'undefined') product.offert = offert;
        if (typeof categoryId !== 'undefined') product.categoryId = categoryId;
        if (typeof inStock !== 'undefined') product.inStock = inStock === 'true' || inStock === true;

        const uploaded = req.files?.images;
        if (uploaded) {
            const filesArray = Array.isArray(uploaded) ? uploaded : [uploaded];
            for (const file of filesArray) {
                const ext = path.extname(file.name) || '.jpg';
                const fileName = `${uuidv4()}${ext}`;
                const uploadPath = path.resolve(__dirname, '..', 'static', fileName);
                await file.mv(uploadPath);
                await ProductImages.create({ link: fileName, productId: product.id });
            }
        }

        await product.save();
        const updated = await Product.findByPk(product.id, {
            include: [{ model: ProductImages, as: 'productImages' }],
        });
        return res.json({ success: true, data: updated });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id, { include: [{ model: ProductImages, as: 'productImages' }] });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        if (product.productImages && product.productImages.length) {
            for (const img of product.productImages) {
                try {
                    await img.destroy();
                } catch {}
            }
        }
        await product.destroy();
        return res.json({ success: true, message: 'Product deleted' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const deleteProductImage = async (req, res) => {
    try {
        const { id } = req.params;
        const image = await ProductImages.findByPk(id);

        if (!image) {
            return res.status(404).json({ success: false, message: 'Image not found' });
        }

        await image.destroy();
        return res.json({ success: true, message: 'Image deleted' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
