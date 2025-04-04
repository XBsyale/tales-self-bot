const fs = require('fs');
const { paths } = require('../config');

function loadTokens() {
    try {
        const tokens = fs.readFileSync(paths.tokensFile, 'utf-8')
            .split('\n')
            .map(t => t.trim())
            .filter(t => t.length > 50);
        
        if (tokens.length === 0) {
            throw new Error(`${paths.tokensFile} dosyası boş veya geçersiz!`);
        }
        return tokens;
    } catch (err) {
        throw new Error(`Token dosyası okunamadı: ${err.message}`);
    }
}

function generateSessionId() {
    return `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

function generateNonce() {
    return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

module.exports = {
    loadTokens,
    generateSessionId,
    generateNonce
};