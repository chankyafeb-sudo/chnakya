const crypto = require('crypto');

const AES_SECRET = process.env.AES_SECRET || 'your_aes_secret_key';
const AES_KEY = crypto.createHash('sha256').update(AES_SECRET).digest();

const decrypt = (encryptedText) => {
    try {
        const [ivHex, encrypted] = encryptedText.split(':');
        console.log("IV (Hex):", ivHex);
        console.log("Encrypted Data:", encrypted);

        if (!ivHex || !encrypted) {
            throw new Error('Invalid input format');
        }

        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', AES_KEY, iv);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        console.log("Decrypted Data:", decrypted);
        return decrypted;
    } catch (error) {
        console.error('Decryption failed:', error);
        throw new Error('Decryption failed');
    }
};


const authMiddleware = (req, res, next) => {
    console.log("Token verification on");
    const token = req.headers['authorization']?.split(' ')[1];
    console.debug('Authorization header:', req.headers['authorization']);

    if (!token) {
        console.error('No token provided');
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decryptedToken = decrypt(token);
        const decoded = JSON.parse(decryptedToken);

        // Handle both old token {id: {id, role}} and new token {id: "string"}
        const rawId = decoded.id;
        if (typeof rawId === 'object' && rawId !== null && rawId.id) {
            req.userId = rawId.id;
            req.userRole = rawId.role;
            req.username = rawId.username;
        } else {
            req.userId = rawId;
            req.userRole = null;
            req.username = null;
        }

        console.debug('Token verified, userId:', req.userId);
        console.debug('Token verified, userRole:', req.userRole);
        next();
    } catch (err) {
        console.error('Decryption failed:', err);
        return res.status(401).json({ message: 'Invalid token', error: err.message });
    }
};

module.exports = authMiddleware;
