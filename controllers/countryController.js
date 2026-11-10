import { Country } from '../models/models.js';

export const getAllCountries = async (req, res) => {
    try {
        const countries = await Country.findAll();
        return res.status(200).json({ success: true, data: countries });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const addCountry = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Country name is required' });
        }
        const country = await Country.create({ name });
        return res.status(201).json({ success: true, data: country });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const updateCountry = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const country = await Country.findByPk(id);
        if (!country) return res.status(404).json({ success: false, message: 'Country not found' });
        country.name = name;
        await country.save();
        return res.status(200).json({ success: true, data: country });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const deleteCountry = async (req, res) => {
    try {
        const { id } = req.params;
        const country = await Country.findByPk(id);
        if (!country) return res.status(404).json({ success: false, message: 'Country not found' });
        await country.destroy();
        return res.status(204).end();
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
