const { Client } = require('discord.js-selfbot-v13');
const { writeLog, writeErrorLog } = require('../utils/logger');
const { generateSessionId, generateNonce } = require('../utils/helpers');
const { theme } = require('../config');

module.exports = async function clickButton(token, index, messageLink) {
    const client = new Client({ checkUpdate: false });
    
    try {
        await client.login(token);
        console.log(theme.success(`[${index}] ${client.user.username} hazır`));

        const parts = messageLink.split('/').filter(p => p.length > 5);
        const messageId = parts.pop();
        const channelId = parts.pop();
        const guildId = parts.pop();
        
        const channel = await client.channels.fetch(channelId);
        const message = await channel.messages.fetch(messageId);
        
        client.ws.sessionId = client.ws.sessionId || generateSessionId();
        
        for (const row of message.components) {
            for (const component of row.components) {
                if (component.type === 'BUTTON' && component.customId === "join_giveaway") {
                    await fetch('https://discord.com/api/v9/interactions', {
                        method: 'POST',
                        headers: {
                            'Authorization': token,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            type: 3,
                            nonce: generateNonce(),
                            guild_id: guildId,
                            channel_id: channelId,
                            message_id: messageId,
                            application_id: message.author.id,
                            session_id: client.ws.sessionId,
                            data: { 
                                component_type: 2, 
                                custom_id: component.customId 
                            }
                        })
                    });
                    
                    console.log(theme.success(`[${index}] ${client.user.username} tıklandı!`));
                    return true;
                }
            }
        }
        
        return false;
    } catch (error) {
        const timestamp = new Date().toLocaleString();
        const errorLog = `[${timestamp}] [${index}] Hata: ${error.message}`;
        writeErrorLog(errorLog);
        return false;
    } finally {
        if (client && client.destroy) client.destroy();
    }
};