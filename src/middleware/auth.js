import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

const isAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const bearerToken = authHeader && authHeader.split(' ')[1]; // Se o cabeçalho existir, ele divide o conteúdo por espaço e pega o segundo item (o token em si)

    if (!bearerToken) {
        return res.status(401).json({ jwt_missing: 'No token provided.' });
    }

    jwt.verify(bearerToken, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ jwt_timeout: 'Invalid or expired token.' });
        }
        
        req.auth = decoded;
        next();
    });
};

export {isAuth};