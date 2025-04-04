const { Client } = require('discord.js-selfbot-v13');
const { writeLog, writeDmLog } = require('../utils/logger');
const { theme } = require('../config');

module.exports = async function checkDM(token, index, userIdToCheck) {
    const client = new Client();
    return new Promise((resolve) => {
        client.on('ready', async () => {
            writeLog(`[${index}] ${client.user.tag} DM kontrol ediliyor...`, 'info');
            try {
                const user = await client.users.fetch(userIdToCheck);
                const dmChannel = user.dmChannel || await user.createDM();
                const messages = await dmChannel.messages.fetch({ limit: 10 });
                
                let foundMessages = [];
                
                messages.forEach(msg => {
                    if (msg.author.id === userIdToCheck && 
                        msg.createdAt.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10)) {
                        foundMessages.push({
                            account: client.user.tag,
                            token: token,
                            message: msg.content
                        });
                    }
                });
                
                if (foundMessages.length > 0) {
                    foundMessages.forEach(data => {
                        const logMessage = `DM ALAN HESAP: ${data.account} | Token: ${data.token} | Mesaj: ${data.message}`;
                        writeLog(logMessage, 'success');
                        writeDmLog(logMessage);
                    });
                } else {
                    console.log(theme.highlight(`[${index}] ${client.user.tag} | Bugün mesaj yok`));
                }
            } catch (error) {
                writeLog(`[${index}] DM kontrol hatası: ${error.message}`, 'error');
            }
            client.destroy();
            resolve();
        });
        
        client.login(token).catch(err => {
            writeLog(`[${index}] Token giriş hatası: ${err.message}`, 'error');
            resolve();
        });
    });
};