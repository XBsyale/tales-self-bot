const { Client } = require('discord.js-selfbot-v13');
const { writeLog } = require('../utils/logger');
const { waitForResponse, clickFirstButton } = require('../utils/discordhelpers');
const { theme, constants } = require('../config');

module.exports = async function transferMoney(token, index, channelId, targetUserId, amountToSend) {
    const client = new Client({ checkUpdate: false });
    
    try {
        console.log(theme.info(`\n[${index}] İşlem başlatılıyor...`));
        await client.login(token);
        console.log(theme.success(`[${index}] ${client.user.username} giriş yaptı`));

        const channel = await client.channels.fetch(channelId);
        console.log(theme.info(`[${index}] Kanal bağlantısı kuruldu`));

        // 1. BAKİYE KONTROLÜ
        console.log(theme.info(`[${index}] Bakiye sorgulanıyor...`));
        const sentCashMsg = await channel.send('owo cash');
        const cashResponse = await waitForResponse(channel, sentCashMsg, 10000);
        
        if (!cashResponse) {
            console.log(theme.error(`[${index}] Bakiye alınamadı!`));
            return { success: false, sentAmount: 0 };
        }

        const balanceMatch = cashResponse.content.match(/(\d{1,3}(?:[.,]\d{3})+)/);
        if (!balanceMatch) {
            console.log(theme.error(`[${index}] Bakiye bilgisi bulunamadı!`));
            return { success: false, sentAmount: 0 };
        }

        const balance = parseInt(balanceMatch[0].replace(/[.,]/g, ''));
        console.log(theme.success(`[${index}] Mevcut bakiye: ${balance.toLocaleString()} cowoncy`));

        // 2. TRANSFER MİKTARI HESAPLAMA (5M LİMİTLİ)
        let transferAmount = Math.min(
            balance - 5000, // 5k bırak
            amountToSend, // İstenen miktar
            constants.MAX_TRANSFER_PER_ACCOUNT // Maksimum 5M
        );

        if (transferAmount <= 0) {
            console.log(theme.error(`[${index}] Yetersiz bakiye veya geçersiz miktar!`));
            return { success: false, sentAmount: 0 };
        }

        console.log(theme.info(`[${index}] Gönderilecek miktar: ${transferAmount.toLocaleString()} cowoncy`));

        // 3. PARA GÖNDERME
        console.log(theme.info(`[${index}] Para gönderiliyor...`));
        const sendCmd = `owo send <@${targetUserId}> ${transferAmount}`;
        const sentMsg = await channel.send(sendCmd);
        console.log(theme.success(`[${index}] Gönderim komutu: "${sendCmd}"`));

        // 4. OTOMATİK ONAY
        console.log(theme.info(`[${index}] Otomatik onay bekleniyor...`));
        const result = await autoConfirmTransfer(channel, sentMsg);
        
        if (result) {
            console.log(theme.success(`[${index}] ${transferAmount.toLocaleString()} cowoncy gönderildi!`));
            return { success: true, sentAmount: transferAmount };
        }

        console.log(theme.error(`[${index}] Gönderim başarısız!`));
        return { success: false, sentAmount: 0 };

    } catch (error) {
        console.log(theme.error(`[${index}] Hata: ${error.message}`));
        return { success: false, sentAmount: 0 };
    } finally {
        if (client?.destroy) client.destroy();
    }
};

async function autoConfirmTransfer(channel, sentMsg) {
    try {
        // 1. Adım: Sonraki mesajı al (OwO'nun onay mesajı)
        const messages = await channel.messages.fetch({ after: sentMsg.id, limit: 1 });
        let confirmation = messages.first();

        // Eğer hemen gelmezse 5 saniye daha bekle
        if (!confirmation || confirmation.author.id !== constants.OWO_BOT_ID) {
            console.log(theme.info('Onay mesajı için ek 5s bekleniyor...'));
            await new Promise(resolve => setTimeout(resolve, 5000));
            const newMessages = await channel.messages.fetch({ limit: 1 });
            confirmation = newMessages.first();
        }

        if (!confirmation || confirmation.author.id !== constants.OWO_BOT_ID) {
            console.log(theme.error('Onay mesajı bulunamadı!'));
            return false;
        }

        // 2. Adım: İlk butona tıkla
        return await clickFirstButton(confirmation);

    } catch (error) {
        console.log(theme.error(`Onay hatası: ${error.message}`));
        return false;
    }
}