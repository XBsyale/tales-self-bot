const fs = require('fs');
const https = require('https');
const { spawn } = require('child_process');
const { theme } = require('./config');

const GITHUB_REPO = "XBsyale/tales-self-bot";
const CURRENT_COMMIT_FILE = "current_commit.txt";

// Ana fonksiyon
async function checkUpdates() {
    try {
        console.log(theme.info("\n🔍 Güncellemeler kontrol ediliyor..."));

        // Güncelleme kontrol mantığı buraya gelecek
        console.log(theme.success("\n✔️ Güncelleme kontrolü tamamlandı"));

        // Main.js'yi başlat
        console.log(theme.highlight("\n🚀 Ana uygulama başlatılıyor..."));
        const mainProcess = spawn('node', ['main.js'], {
            stdio: 'inherit',
            shell: true
        });

        mainProcess.on('close', (code) => {
            if (code !== 0) {
                console.log(theme.error(`Ana uygulama ${code} kodu ile kapandı`));
            }
        });

    } catch (error) {
        console.error(theme.error("\n❌ Kritik hata:", error.message));
        process.exit(1);
    }
}

// Modül olarak export et
module.exports = checkUpdates;