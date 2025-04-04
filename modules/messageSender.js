const { Client } = require('discord.js-selfbot-v13');
const { writeLog } = require('../utils/logger');
const { theme } = require('../config');

module.exports = async function sendMessage(token, index, channelId, messageContent) {
    const client = new Client({ checkUpdate: false });
    
    try {
        await client.login(token);
        console.log(theme.success(`[${index}] ${client.user.username} mesaj göndermeye hazır`));

        const channel = await client.channels.fetch(channelId);
        await channel.send(messageContent);
        
        console.log(theme.success(`[${index}] ${client.user.username} mesaj gönderdi: "${messageContent}"`));
        return true;
    } catch (error) {
        console.log(theme.error(`[${index}] Mesaj gönderme hatası: ${error.message}`));
        return false;
    } finally {
        if (client && client.destroy) client.destroy();
    }
};