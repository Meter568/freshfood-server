import { Category } from '../models/models.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createCategory = async (req, res) => {
    const { name, parent_id, slug, bgColor } = req.body;
    let parentIdToSave = null;
    try {
        if (!name) {
            return res.status(400).json({ success: false, message: 'Name is required' });
        }
        if (!bgColor) {
            return res.status(400).json({ success: false, message: 'bgColor is required' });
        }
        if (parent_id !== undefined && parent_id !== null && parent_id !== '' ) {
            const parent = await Category.findByPk(parent_id);
            if (!parent) {
                return res.status(400).json({ success: false, message: 'Parent category not found' });
            }
            parentIdToSave = parent.id;
        }
        let logoPath = null;
        if(req.files && req.files.logo) {
            const logoFile = req.files.logo;
            const fileName = uuidv4() + path.extname(logoFile.name);
            const filePath = path.resolve(__dirname, '..', 'static', fileName);
            if(!fs.existsSync(path.resolve(__dirname, '..', 'static'))) {
                fs.mkdirSync(path.resolve(__dirname, '..', 'static'))
            }
            await logoFile.mv(filePath);
            logoPath = `/static/${fileName}`;
        }
        const category = await Category.create({ name, slug, parent_id: parentIdToSave, logo: logoPath, bgColor });
        return res.status(201).json({ success: true, data: category });
    } catch (error) {
        console.log('Error creating category:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({ where: { parent_id: null } });
        return res.status(200).json({ success: true, data: categories });
    } catch (error) {
        console.log('Error fetching categories:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const getCategoryWithChildren = async (req, res) => {
    try {
        const {slug} = req.params;
        const parentCategory = await Category.findOne({where: {slug}});
        if(!parentCategory) {
            return res.status(404).json({success: false, message: "Category not found"})
        }
        const subcategories = await Category.findAll({
            where: {parent_id: parentCategory.id}
        });
        return res.json({
            success: true,
            category: parentCategory,
            subcategories:[
                ...subcategories
            ]
        });
    } catch (error) {
        console.log("Error fetching category:", error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const deleteParentCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        async function deleteSubcategories(parentId) {
            const children = await Category.findAll({ where: { parent_id: parentId } });
            for (const child of children) {
                await deleteSubcategories(child.id);
                await child.destroy();
            }
        }
        await deleteSubcategories(category.id);
        await category.destroy();
        return res.json({ success: true, message: 'Category and all subcategories deleted successfully' });
    } catch (error) {
        console.log('Error deleting category:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const deleteSubcategory = async (req, res) => {
    try {
        const { id } = req.params;
        const subcategory = await Category.findByPk(id);
        if (!subcategory) {
            return res.status(404).json({ success: false, message: 'Subcategory not found' });
        }
        if (!subcategory.parent_id) {
            return res.status(400).json({ success: false, message: 'This is not a subcategory' });
        }
        await subcategory.destroy();
        return res.json({ success: true, message: 'Subcategory deleted successfully' });
    } catch (error) {
        console.log('Error deleting subcategory:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, bgColor, parent_id } = req.body;
        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        if (req.files && req.files.logo) {
            const logoFile = req.files.logo;
            const fileName = uuidv4() + path.extname(logoFile.name);
            const filePath = path.resolve(__dirname, '..', 'static', fileName);
            if(!fs.existsSync(path.resolve(__dirname, '..', 'static'))) {
                fs.mkdirSync(path.resolve(__dirname, '..', 'static'))
            }
            await logoFile.mv(filePath);
            if(category.logo && fs.existsSync(path.resolve(__dirname, '..', '..', category.logo))) {
                try { fs.unlinkSync(path.resolve(__dirname, '..', '..', category.logo)); } catch {}
            }
            category.logo = `/static/${fileName}`;
        }
        if (typeof name !== 'undefined') category.name = name;
        if (typeof slug !== 'undefined') category.slug = slug;
        if (typeof bgColor !== 'undefined') category.bgColor = bgColor;
        if (typeof parent_id !== 'undefined') category.parent_id = parent_id || null;
        await category.save();
        return res.status(200).json({ success: true, data: category });
    } catch (error) {
        console.log('Error updating category:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}