import { Trademark } from '../models/models.js';

export const getAllTrademarks = async (req, res) => {
    try {
        const trademarks = await Trademark.findAll();
        return res.status(200).json({ success: true, data: trademarks });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const addTrademark = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Trademark name is required' });
        }
        const trademark = await Trademark.create({ name });
        return res.status(201).json({ success: true, data: trademark });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const updateTrademark = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const trademark = await Trademark.findByPk(id);
        if (!trademark) return res.status(404).json({ success: false, message: 'Trademark not found' });
        trademark.name = name;
        await trademark.save();
        return res.status(200).json({ success: true, data: trademark });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const deleteTrademark = async (req, res) => {
    try {
        const { id } = req.params;
        const trademark = await Trademark.findByPk(id);
        if (!trademark) return res.status(404).json({ success: false, message: 'Trademark not found' });
        await trademark.destroy();
        return res.status(204).end();
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
