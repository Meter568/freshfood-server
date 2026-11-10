import { User, City, VerificationCode } from '../models/models.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pkg from 'google-auth-library';
import { Op } from "sequelize";
const { OAuth2Client } = pkg;

const client = new OAuth2Client(process.env.OAUTH_GOOGLE_CLIENT_ID);

const generateJwt = (id, name, email, role) => {
    const secretKey = process.env.SECRET_KEY || 'your-secret-key-here';
    console.log('Generating JWT with secret key:', secretKey ? 'set' : 'not set');
    return jwt.sign(
        { id, name, email, role }, 
        secretKey, 
        { expiresIn: '24h' }
    );
}

export const registration = async (req, res) => {
    try {
        const { name, email, password, role, cityId, street, houseNumber, apartmentNumber, phoneNumber } = req.body;
        console.log('Registration request data:', { name, email, role, cityId, street, houseNumber, apartmentNumber, phoneNumber });
        if (!name || !email || !password || !role) {
            return res.status(400).json({ success: false, message: "Invalid name, email, password or role"  });
        }
        const candidate = await User.findOne({ where: { email } });
        console.log('Found candidate:', candidate ? { id: candidate.id, email: candidate.email, role: candidate.role } : 'No candidate found');
        
        if (candidate && candidate.role !== 'guest') {
            return res.status(400).json({ success: false, message: "User with this email already exists" });
        }
        const verificationCode = await VerificationCode.findOne({
            where: {
                email,
                type: 'registration',
                isUsed: true
            },
            order: [['createdAt', 'DESC']]
        });
        if (!verificationCode) {
            return res.status(400).json({ 
                success: false, 
                message: "Email не підтверджено. Спочатку підтвердіть email." 
            });
        }
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        if (verificationCode.createdAt < oneHourAgo) {
            return res.status(400).json({ 
                success: false, 
                message: "Сесія верифікації застаріла. Спробуйте знову." 
            });
        }
        const hashPassword = await bcrypt.hash(password, 5);
        let user;
        if (candidate && candidate.role === 'guest') {
            console.log('Updating existing guest user:', candidate.email);
            console.log('New data:', { name, role, cityId, street, houseNumber, apartmentNumber, phoneNumber });
            candidate.name = name;
            candidate.password = hashPassword;
            candidate.role = role;
            if (cityId !== undefined) candidate.cityId = cityId;
            if (street !== undefined) candidate.street = street;
            if (houseNumber !== undefined) candidate.houseNumber = houseNumber;
            if (apartmentNumber !== undefined) candidate.apartmentNumber = apartmentNumber;
            if (phoneNumber !== undefined) candidate.phoneNumber = phoneNumber;
            await candidate.save();
            console.log('Guest user updated successfully. New role:', candidate.role);
            user = candidate;
        } else {
            user = await User.create({ 
                name, 
                email, 
                password: hashPassword, 
                role, 
                cityId: cityId || null,
                street: street || null,
                houseNumber: houseNumber || null,
                apartmentNumber: apartmentNumber || null,
                phoneNumber: phoneNumber || null,
            });
        }
        await VerificationCode.destroy({
            where: {
                email,
                type: 'registration'
            }
        });
        const token = generateJwt(user.id, user.name, user.email, user.role);
        return res.status(200).json({ token });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal Server Error" })
    }
}

export const login = async(req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
        return res.status(400).json({ success: false, message: "User not found" });
    }
    if (user.inBlock) {
        return res.status(403).json({ success: false, message: "User is blocked" });
    }
    let comparePassword = bcrypt.compareSync(password, user.password);
    if (!comparePassword) {
        return res.status(400).json({ success: false, message: "Invalid password" });
    }
    const token = generateJwt(user.id, user.name, user.email, user.role);
    return res.status(200).json({ token });
}

export const loginAdmin = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
        return res.status(400).json({ success: false, message: "User not found" });
    }
    let comparePassword = bcrypt.compareSync(password, user.password);
    if (!comparePassword) {
        return res.status(400).json({ success: false, message: "Invalid password" });
    }
    if (user.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Access for admins only" });
    }
    const token = generateJwt(user.id, user.name, user.email, user.role);
    return res.status(200).json({ token });
}

export const loginGoogle = async (req, res) => {
    try {
        const { credential } = req.body;
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.OAUTH_GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const { email, name } = payload;
        let user = await User.findOne({ where: { email } });
        if(user && user.inBlock) {
            return res.status(403).json({ success: false, message: "User is blocked" });
        }
        if(!user) {
            const randomString = Math.random().toString(36).slice(-8);
            const generatePassword = `google-${randomString}`
            const hashPassword = await bcrypt.hash(generatePassword, 5);
            user = await User.create({
                name, 
                email, 
                password: hashPassword, 
                role: "user",
                cityId: null,
                street: null,
                houseNumber: null,
                apartmentNumber: null,
                phoneNumber: null,
            });
        }
        const token = generateJwt(user.id, user.name, user.email, user.role);
        return res.status(200).json({ token });
    } catch (error) {
        console.log('Error during Google login:', error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

export const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] }, 
            include: [
                {
                    model: City,
                    as: 'city',
                    attributes: ['id', 'name']
                }
            ]
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({ user });
    } catch (error) {
        console.log('Error fetching user profile:', error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, email, cityId, street, houseNumber, apartmentNumber, phoneNumber } = req.body;
        const user = await User.findByPk(userId);
        if(!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        user.name = name ?? user.name;
        user.email = email ?? user.email;
        user.cityId = cityId ?? user.cityId;
        user.street = street ?? user.street;
        user.houseNumber = houseNumber ?? user.houseNumber;
        user.apartmentNumber = apartmentNumber ?? user.apartmentNumber;
        user.phoneNumber = phoneNumber ?? user.phoneNumber;
        await user.save();
        return res.status(200).json({user});
    } catch (error) {
        console.log('Error updating user profile:', error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

export const adminGetUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ["id", "name", "email", "role", "cityId", "street", "houseNumber", "apartmentNumber", "phoneNumber", "inBlock"],
            where: {
                name: { [Op.ne]: 'Гість',
                },
            role: "user",
            },
            order: [['createdAt', 'ASC']],
        });
        return res.json(users);
    } catch (error) {
        console.log('Error fetching users for admin:', error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

export const adminGetUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: ["id", "name", "email", "phoneNumber", "cityId", "street", "houseNumber", "apartmentNumber"],
        });
        if(!user) {
            res.status(404).json({ message: "User not found" })
        }
        return res.status(200).json(user);
    } catch (error) {
        console.log('Error fetching user for admin:', error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

export const adminUpdateUserById = async (req, res) => {
    try {
        const { name, email, phoneNumber, cityId, street, houseNumber, apartmentNumber } = req.body;
        const user = await User.findByPk(req.params.id);
        if(!user) {
            res.status(404).json({ message: "User not found" })
        }
        await user.update({ name, email, phoneNumber, cityId, street, houseNumber, apartmentNumber });
        res.json({success: true})
    } catch (error) {
        console.log('Error update user for admin:', error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

export const adminDeleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        await user.destroy();
        return res.json({ success: true, message: "User deleted" });
    } catch (error) {
        console.log('Error deleting user:', error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

export const adminToggleBlock = async (req, res) => {
    try {
        const { id } = req.params;
        const { inBlock } = req.body;
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        user.inBlock = inBlock;
        await user.save();
        return res.json({ success: true, message: `User ${inBlock ? 'blocked' : 'unblocked'}` });
    } catch (error) {
        console.log('Error toggling user block status:', error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}