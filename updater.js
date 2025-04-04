const fs = require('fs');
const https = require('https');
const { execSync, spawn } = require('child_process');
const { theme } = require('./config');

const GITHUB_REPO = "XBsyale/tales-self-bot";
const CURRENT_COMMIT_FILE = "current_commit.txt";

async function checkUpdates() {
    try {
        console.log(theme.info("\n🔍 Güncellemeler kontrol ediliyor..."));

        // GitHub'dan son commit hash'ini al
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
            
            // ZIP indirme ve çıkarma işlemleri
            console.log(theme.info("⬇️ Güncelleme indiriliyor..."));
            execSync(`curl -L https://github.com/${GITHUB_REPO}/archive/main.zip -o update.zip`);
            
            console.log(theme.info("📦 Dosyalar çıkarılıyor..."));
            const AdmZip = require('adm-zip');
            const zip = new AdmZip('update.zip');
            zip.extractAllTo(".", true);
            fs.unlinkSync("update.zip");
            
            // Commit hash'ini güncelle
            fs.writeFileSync(CURRENT_COMMIT_FILE, latestCommitHash);
            console.log(theme.success("\n✅ Güncelleme tamamlandı!"));
        } else {
            console.log(theme.success("\n✔️ Bot zaten güncel."));
        }

        // Ana uygulamayı başlat
        console.log(theme.highlight("\n🚀 Ana uygulama başlatılıyor..."));
        const mainProcess = spawn('node', ['main.js'], {
            stdio: 'inherit',
            shell: true
        });

        mainProcess.on('close', (code) => {
            if (code !== 0) {
                console.log(theme.error(`\n❌ Main uygulaması hata kodu ${code} ile kapandı`));
            }
        });

    } catch (error) {
        console.log(theme.error("\n❌ Kritik hata:", error.message));
        process.exit(1);
    }
}

// Doğrudan çalıştırma
if (require.main === module) {
    checkUpdates();
} else {
    module.exports = checkUpdates;
}