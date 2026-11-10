import Router from 'express';
import { createProduct, getAllProducts, getProductsByParentCategory, getProductsByCategory, getProductByServername, updateProduct, deleteProduct, deleteProductImage } from '../controllers/productController.js';

const router = Router();

router.post('/', createProduct);
router.get('/', getAllProducts);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.get('/:servername', getProductByServername);
router.get('/category/:slug/all', getProductsByParentCategory);
router.get('/category/:slug', getProductsByCategory);
router.delete('/images/:id', deleteProductImage);

export default router;

