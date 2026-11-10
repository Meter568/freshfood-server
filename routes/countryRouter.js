import Router from 'express';
import { getAllCountries, addCountry, updateCountry, deleteCountry } from '../controllers/countryController.js';

const router = Router();

router.get('/', getAllCountries);
router.post('/', addCountry);
router.put('/:id', updateCountry);
router.delete('/:id', deleteCountry);

export default router;
