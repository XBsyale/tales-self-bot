const readline = require('readline-sync');
const { theme, paths } = require('./config');
const { loadTokens } = require('./utils/helpers');
const { writeLog, writeMoneyLog } = require('./utils/logger');
const checkDM = require('./modules/dmChecker');
const clickButton = require('./modules/buttonClicker');
const checkToken = require('./modules/tokenChecker');
const moneyChecker = require('./modules/moneyChecker');
const sendMessage = require('./modules/messageSender');
const transferMoney = require('./modules/moneyTransfer');

// TOPLAM PARA İÇİN GLOBAL DEĞİŞKEN
let totalCowoncy = 0;

// Terminali temizle ve başlık göster
console.clear();
console.log(theme.title(`
████████╗ █████╗ ██╗     ███████╗███████╗
╚══██╔══╝██╔══██╗██║     ██╔════╝██╔════╝
   ██║   ███████║██║     █████╗  ███████╗
   ██║   ██╔══██║██║     ██╔══╝  ╚════██║
   ██║   ██║  ██║███████╗███████╗███████║
   ╚═╝   ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝
  SelfBot Multi-Tool v2.0 | Otomatik Güncelleyici Destekli deneme
`));

// Ana menü
async function main() {
    // Güncelleme kontrolü yap
    const updated = await checkUpdates();
    if (updated) {
        console.log(theme.highlight("\n🔄 Bot yeniden başlatılıyor..."));
        await new Promise(resolve => setTimeout(resolve, 3000));
        process.exit(0);
    }

    let tokens = loadTokens();
    
    while (true) {
        console.log(theme.menu(`
[1] DM Kontrolü
[2] Buton Tıklama
[3] Token Kontrolü
[4] Para Kontrolü
[5] Mesaj Gönderme
[6] Para Gönderme
[9] Token Listesini Değiştir (Şu an: ${paths.tokensFile})
[0] Çıkış
`));

        const choice = readline.question(theme.input('Seçiminiz: '));
        
        if (choice === '1') {
            const userId = readline.question(theme.input('Kontrol edilecek kullanıcı ID: '));
            for (let i = 0; i < tokens.length; i++) {
                await checkDM(tokens[i], i+1, userId);
                await new Promise(resolve => setTimeout(resolve, 2500));
            }
        } 
        else if (choice === '2') {
            const messageLink = readline.question(theme.input('Mesaj linki: '));
            for (let i = 0; i < tokens.length; i++) {
                await clickButton(tokens[i], i+1, messageLink);
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
        else if (choice === '3') {
            for (let i = 0; i < tokens.length; i++) {
                await checkToken(tokens[i], i+1);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        else if (choice === '4') {
            resetTotalCowoncy();
            const channelId = readline.question(theme.input('Para kontrol kanal ID: '));
            
            for (let i = 0; i < tokens.length; i++) {
                await checkMoney(tokens[i], i+1, channelId);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
            
            console.log(theme.money(`\n»»——————★——————««\nTOPLAM PARA: ${getTotalCowoncy().toLocaleString()} cowoncy\n»»——————★——————««`));
            writeMoneyLog(`\nTOPLAM PARA: ${getTotalCowoncy().toLocaleString()} cowoncy\n——————————————`);
        }
        else if (choice === '5') {
            const channelId = readline.question(theme.input('Mesaj gönderilecek kanal ID: '));
            const messageContent = readline.question(theme.input('Gönderilecek mesaj: '));
            
            for (let i = 0; i < tokens.length; i++) {
                await sendMessage(tokens[i], i+1, channelId, messageContent);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        else if (choice === '6') {
            const channelId = readline.question(theme.input('OwO komutlarını çalıştıracağınız kanal ID: '));
            const targetUserId = readline.question(theme.input('Para gönderilecek hesap ID: '));
            const totalAmount = parseInt(readline.question(theme.input('Gönderilecek toplam miktar: ')));
            
            console.log(theme.info(`\nToplam ${totalAmount.toLocaleString()} cowoncy gönderilecek...`));
            
            let remainingAmount = totalAmount;
            const workingTokens = tokens.filter(t => t.trim().length > 0);
            
            for (let i = 0; i < workingTokens.length && remainingAmount > 0; i++) {
                console.log(theme.highlight(`\nKalan gönderilecek miktar: ${remainingAmount.toLocaleString()} cowoncy`));
                
                const result = await transferMoney(
                    workingTokens[i], 
                    i+1, 
                    channelId, 
                    targetUserId, 
                    remainingAmount
                );
                
                if (result.success) {
                    remainingAmount -= result.sentAmount;
                    console.log(theme.success(`Başarıyla gönderildi! Kalan: ${remainingAmount.toLocaleString()} cowoncy`));
                    
                    if (remainingAmount > 0 && i < workingTokens.length - 1) {
                        const waitTime = 20000;
                        console.log(theme.info(`Sonraki hesaba geçmeden önce ${waitTime/1000} saniye bekleniyor...`));
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                    }
                } else {
                    console.log(theme.error(`Bu hesaptan para gönderilemedi, sonraki hesaba geçiliyor...`));
                }
            }
            
            if (remainingAmount <= 0) {
                console.log(theme.success(`\n»»——————★——————««\nTÜM PARA BAŞARIYLA GÖNDERİLDİ!\n»»——————★——————««`));
            } else {
                console.log(theme.error(`\n»»——————★——————««\nGÖNDERİLEMEYEN MİKTAR: ${remainingAmount.toLocaleString()} cowoncy\n»»——————★——————««`));
                console.log(theme.info(`Not: Daha fazla hesap ekleyerek kalan miktarı gönderebilirsiniz.`));
            }
        }
        else if (choice === '9') {
            changeTokenList();
            tokens = loadTokens();
        }
        else if (choice === '0') {
            break;
        }
        
        console.log(theme.title('\nAna menüye dönülüyor...\n'));
    }
    
    console.log(theme.title('\nTales SelfBot kapatılıyor...'));
}

// Token listesini değiştirme fonksiyonu
function changeTokenList() {
    console.log(theme.menu(`
[1] tokens.txt kullan (varsayılan)
[2] çalışan hesaplar.txt kullan
[0] İptal
`));
    
    const choice = readline.question(theme.input('Seçiminiz: '));
    
    if (choice === '1') {
        paths.tokensFile = 'tokens.txt';
        console.log(theme.success('Token listesi artık tokens.txt olarak ayarlandı!'));
    } else if (choice === '2') {
        paths.tokensFile = 'çalışan hesaplar.txt';
        console.log(theme.success('Token listesi artık çalışan hesaplar.txt olarak ayarlandı!'));
    } else {
        console.log(theme.info('İşlem iptal edildi.'));
    }
}

// Uygulamayı başlat
main().catch(err => {
    console.log(theme.error(`Kritik hata: ${err.message}`));
    process.exit(1);
});
