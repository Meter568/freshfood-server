import Router from 'express';
import { getAllCities, addCity, updateCity, deleteCity } from '../controllers/cityController.js';

const router = Router();

router.get('/', getAllCities);
router.post('/', addCity);
router.put('/:id', updateCity);
router.delete('/:id', deleteCity);

export default router;
