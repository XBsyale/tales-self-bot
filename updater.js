const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawn } = require('child_process');
const { theme } = require('./config');
const AdmZip = require('adm-zip');

const GITHUB_REPO = "XBsyale/tales-self-bot";
const TOKENS_FILE = "tokens.txt";
const CURRENT_COMMIT_FILE = "current_commit.txt";

async function safeUpdate() {
    try {
        // 1. Mevcut token'ları yedekle
        const currentTokens = fs.existsSync(TOKENS_FILE) 
            ? fs.readFileSync(TOKENS_FILE, 'utf-8') 
            : null;

        // 2. Güncellemeyi indir
        console.log(theme.info("\n⬇️ Güncelleme indiriliyor..."));
        const file = fs.createWriteStream("update.zip");
        await new Promise((resolve, reject) => {
            https.get(`https://github.com/${GITHUB_REPO}/archive/main.zip`, (res) => {
                res.pipe(file);
                file.on('finish', resolve);
            }).on('error', reject);
        });

        // 3. ZIP'i geçici dizine çıkar
        console.log(theme.info("📦 Dosyalar çıkarılıyor..."));
        const tempDir = "temp_update_" + Date.now();
        const zip = new AdmZip("update.zip");
        zip.extractAllTo(tempDir, true);

        // 4. Yeni dosyaları ana dizine taşı (token hariç)
        const updateDir = path.join(tempDir, `${GITHUB_REPO.split('/')[1]}-main`);
        fs.readdirSync(updateDir).forEach(item => {
            if (item !== path.basename(TOKENS_FILE)) {
                const source = path.join(updateDir, item);
                const dest = path.join(".", item);
                
                if (fs.existsSync(dest)) {
                    if (fs.lstatSync(dest).isDirectory()) {
                        fs.rmSync(dest, { recursive: true });
                    } else {
                        fs.unlinkSync(dest);
                    }
                }
                
                fs.renameSync(source, dest);
            }
        });

        // 5. Token dosyasını eski haline getir
        if (currentTokens) {
            fs.writeFileSync(TOKENS_FILE, currentTokens);
        }

        // 6. Temizlik
        fs.rmSync(tempDir, { recursive: true });
        fs.unlinkSync("update.zip");

        console.log(theme.success("\n✅ Güncelleme tamamlandı! (Tokenler korundu)"));

    } catch (error) {
        console.error(theme.error("\n❌ Güncelleme hatası:", error.message));
        throw error;
    }
}

async function checkUpdates() {
    try {
        console.log(theme.info("\n🔍 Güncellemeler kontrol ediliyor..."));

        // GitHub'dan son commit bilgisini al
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
            await safeUpdate();
            fs.writeFileSync(CURRENT_COMMIT_FILE, latestCommitHash);
        } else {
            console.log(theme.success("\n✔️ Bot zaten güncel."));
        }

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

if (require.main === module) {
    checkUpdates();
} else {
    module.exports = checkUpdates;
}