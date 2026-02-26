const crypto = require('crypto');

const AES_SECRET = process.env.AES_SECRET || 'your_aes_secret_key';
const AES_KEY = crypto.createHash('sha256').update(AES_SECRET).digest();

// Generate OTP
const generateOTP = () => {
    const otp = crypto.randomInt(100000, 999999).toString();
    console.debug('Generated OTP:', otp);
    return otp;
};

// Verify OTP
const verifyOTP = (storedOTP, providedOTP) => {
    const isValid = storedOTP === providedOTP;
    console.debug('OTP verification:', { storedOTP, providedOTP, isValid });
    return isValid;
};

// Encrypt data using AES
const encrypt = (text) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(AES_KEY), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
};

// ✅ Decrypt token
const decrypt = (encryptedText) => {
    try {
        const [ivHex, encrypted] = encryptedText.split(':');
        
        if (!ivHex || !encrypted) {
            throw new Error('Invalid token format');
        }

        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', AES_KEY, iv);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        throw new Error('Token decryption failed');
    }
};

// ✅ Verify and decode token
const verifyToken = (token) => {
    try {
        const decrypted = decrypt(token);
        const decoded = JSON.parse(decrypted);
        
        // Handle nested object token {id: {id, role}} or simple {id: "string"}
        if (decoded.id && typeof decoded.id === 'object') {
            return {
                id: decoded.id.id,
                role: decoded.id.role,
                username: decoded.id.username,
                school_id: decoded.id.school_id
            };
        }
        
        return decoded;
    } catch (error) {
        throw new Error('Invalid token');
    }
};

// Generate AES encrypted token
const generateToken = (userId) => {
    const tokenData = JSON.stringify({ id: userId, timestamp: Date.now() });
    const token = encrypt(tokenData);
    console.debug('Generated AES token:', token);
    return token;
};

module.exports = {
    generateOTP,
    verifyOTP,
    generateToken,
    encrypt,
    decrypt,
    verifyToken  // ✅ EXPORTED
};
