import { City } from '../models/models.js';

export const getAllCities = async (req, res) => {
    try {
        const cities = await City.findAll();
        return res.status(200).json({ success: true, data: cities });
    } catch (error) {
        console.log('Error fetching cities:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const addCity = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'City name is required' });
        }
        const city = await City.create({ name });
        return res.status(201).json({ success: true, data: city });
    } catch (error) {
        console.log('Error adding city:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const updateCity = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const city = await City.findByPk(id);
        if (!city) return res.status(404).json({ success: false, message: 'City not found' });
        city.name = name;
        await city.save();
        return res.status(200).json({ success: true, data: city });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const deleteCity = async (req, res) => {
    try {
        const { id } = req.params;
        const city = await City.findByPk(id);
        if (!city) return res.status(404).json({ success: false, message: 'City not found' });
        await city.destroy();
        return res.status(204).end();
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}