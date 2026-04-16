const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = Buffer.from(process.env.CREDENTIALS_ENCRYPTION_KEY, 'hex'); // 32 bytes
const IV_LENGTH = 16; // For AES, this is always 16 bytes

/**
 * Encrypts a string
 * @param {string} text 
 * @returns {string} iv:encryptedText
 */
function encrypt(text) {
    if (!text) return null;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Decrypts an encrypted string
 * @param {string} text iv:encryptedText
 * @returns {string} decryptedText
 */
function decrypt(text) {
    if (!text) return null;
    const textParts = text.split(':');
    if (textParts.length !== 2) return text; // Probably not encrypted
    
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

module.exports = { encrypt, decrypt };
