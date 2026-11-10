import Router from 'express';
import { createCategory, getAllCategories, getCategoryWithChildren, deleteParentCategory, deleteSubcategory, updateCategory } from '../controllers/categoryController.js';

const router = Router();

router.post('/', createCategory);
router.get('/', getAllCategories);
router.get('/:slug', getCategoryWithChildren);
router.put('/:id', updateCategory);
router.delete('/:id', deleteParentCategory);
router.delete('/subcategory/:id', deleteSubcategory);

export default router;

