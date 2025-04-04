const { Client } = require('discord.js-selfbot-v13');
const { writeMoneyLog } = require('../utils/logger');
const { waitForResponse } = require('../utils/discordhelpers');
const { theme, constants } = require('../config');

let totalCowoncy = 0;

module.exports = async function checkMoney(token, index, channelId) {
    const client = new Client({ checkUpdate: false });
    
    try {
        await client.login(token);
        console.log(theme.success(`[${index}] ${client.user.username} para kontrolü başlıyor...`));

        const channel = await client.channels.fetch(channelId);
        
        // Eski mesajları temizle
        const oldMessages = await channel.messages.fetch({ limit: 5 });
        await Promise.all(oldMessages.map(msg => 
            msg.author.id === client.user.id && msg.content === 'owo cash' ? msg.delete().catch(() => {}) : null
        ));

        const sentMessage = await channel.send('owo cash');
        console.log(theme.info(`[${index}] ${client.user.username} para sorgusu gönderildi`));

        const response = await waitForResponse(channel, sentMessage);
        
        if (response) {
            const moneyMatch = response.content.match(/(\d{1,3}(?:,\d{3})+(?=\D*$))/);
            if (moneyMatch) {
                const moneyAmount = parseInt(moneyMatch[0].replace(/,/g, ''));
                totalCowoncy += moneyAmount;
                const logMessage = `[${index}] ${client.user.username} | Para: ${moneyAmount.toLocaleString()} cowoncy`;
                writeMoneyLog(logMessage);
                return moneyAmount;
            }
        }
        
        console.log(theme.error(`[${index}] Para bilgisi alınamadı!`));
        return 0;

    } catch (error) {
        console.log(theme.error(`[${index}] Hata: ${error.message}`));
        return 0;
    } finally {
        if (client && client.destroy) client.destroy();
    }
};

module.exports.getTotalCowoncy = () => totalCowoncy;
module.exports.resetTotalCowoncy = () => { totalCowoncy = 0; };