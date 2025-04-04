const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawn } = require('child_process');
const { theme } = require('./config');

const GITHUB_REPO = "XBsyale/tales-self-bot";
const CURRENT_COMMIT_FILE = "current_commit.txt";

async function checkUpdates() {
    try {
        console.log(theme.info("\n🔍 Güncellemeler kontrol ediliyor..."));

        // 1. Token'ları yedekle
        const tokensBackup = fs.existsSync('tokens.txt') 
            ? fs.readFileSync('tokens.txt', 'utf-8')
            : null;

        // 2. GitHub'dan son commit bilgisini al
        const latestCommit = await new Promise((resolve, reject) => {
            https.get(`https://api.github.com/repos/${GITHUB_REPO}/commits/main`, {
                headers: { 'User-Agent': 'Node.js' }
            }, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve(JSON.parse(data)));
            }).on('error', reject);
        });

        const latestCommitHash = latestCommit.sha;
        const currentCommitHash = fs.existsSync(CURRENT_COMMIT_FILE)
            ? fs.readFileSync(CURRENT_COMMIT_FILE, 'utf-8').trim()
            : "";

        if (latestCommitHash !== currentCommitHash) {
            console.log(theme.highlight("\n🔄 Yeni güncelleme bulundu!"));
            
            // Güncelleme işlemleri buraya gelecek
            console.log(theme.success("\n✅ Güncelleme tamamlandı (simüle edildi)"));
            
            // Commit hash'ini güncelle
            fs.writeFileSync(CURRENT_COMMIT_FILE, latestCommitHash);
        } else {
            console.log(theme.success("\n✔️ Bot zaten güncel."));
        }

        // 3. Main.js'yi başlat
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

// Doğrudan çalıştırma durumu
if (require.main === module) {
    checkUpdates();
} else {
    module.exports = { checkUpdates };  // Fonksiyonu nesne içinde export et
}