const { Client } = require('discord.js-selfbot-v13');
const { writeLog } = require('../utils/logger');
const { theme } = require('../config');

module.exports = async function checkToken(token, index) {
    const client = new Client({ checkUpdate: false });
    
    try {
        await client.login(token);
        console.log(theme.success(`[${index}] ${client.user.tag} | Geçerli token`));
        return true;
    } catch (error) {
        console.log(theme.error(`[${index}] Geçersiz token`));
        return false;
    } finally {
        if (client && client.destroy) client.destroy();
    }
};