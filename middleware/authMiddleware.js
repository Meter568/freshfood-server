import jwt from 'jsonwebtoken';;

export default function authMiddleware(req, res, next) {
    console.log('Auth header:', req.headers.authorization);
    console.log('SECRET_KEY exists:', !!process.env.SECRET_KEY);
    
    const secretKey = process.env.SECRET_KEY || 'your-secret-key-here';
    console.log('Using SECRET_KEY:', secretKey ? 'set' : 'not set');
    
    try {
        const authHeader = req.headers.authorization;

        if(!authHeader) {
            req.user = null;
            return next();
        }

        const token = authHeader.split(' ')[1]; // Bearer TOKEN
        if (!token) {
            console.log('No token provided');
            return res.status(401).json({ message: 'No token provided' });
        }

        console.log('Token found, verifying...');
        const decoded = jwt.verify(token, secretKey);
        console.log('Token verified successfully, user:', decoded);
        req.user = decoded;
        next();
    } catch (error) {
        console.log('Token verification failed:', error.message);
        return res.status(401).json({ message: 'Invalid token' });
    }
}
