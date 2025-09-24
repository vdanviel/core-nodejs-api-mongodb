import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'
dotenv.config();

const checkScope = (requiredScope) => {
    
    return (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1];
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (!decoded.scope || !decoded.scope.includes(requiredScope)) {
                return res.status(403).json({ message: 'Not allowed. Insufficient permission.' });
            }
            next();
        } catch (err) {
            return res.status(401).json({ message: 'Invalid or expired token.' });
        }

    };
};

export {checkScope};