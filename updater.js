const fs = require('fs');
const https = require('https');
const { execSync, spawn } = require('child_process');
const { theme } = require('./config');

const GITHUB_REPO = "XBsyale/tales-self-bot";
const CURRENT_COMMIT_FILE = "current_commit.txt";

async function downloadUpdate() {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream("update.zip");
        https.get(`https://github.com/${GITHUB_REPO}/archive/main.zip`, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink("update.zip", () => reject(err));
        });
    });
}

async function extractUpdate() {
    try {
        const AdmZip = require('adm-zip');
        const zip = new AdmZip("update.zip");
        zip.extractAllTo(".", true);
        fs.unlinkSync("update.zip");
        return true;
    } catch (error) {
        console.error(theme.error("ZIP açma hatası:", error));
        return false;
    }
}

async function checkUpdates() {
    try {
        console.log(theme.info("\n🔍 Güncellemeler kontrol ediliyor..."));

        // 1. Commit bilgisini al
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
        const currentCommitHash = fs.existsSync(CURRENT_COMMIT_FILE) ?
            fs.readFileSync(CURRENT_COMMIT_FILE, 'utf-8').trim() : "";

        // 2. Güncelleme varsa indir ve uygula
        if (latestCommitHash !== currentCommitHash) {
            console.log(theme.highlight("\n🔄 Yeni güncelleme bulundu!"));
            
            await downloadUpdate();
            console.log(theme.info("⬇️ İndirme tamamlandı. Çıkarılıyor..."));
            
            if (await extractUpdate()) {
                fs.writeFileSync(CURRENT_COMMIT_FILE, latestCommitHash);
                console.log(theme.success("✅ Güncelleme tamamlandı!"));
            }
        } else {
            console.log(theme.success("\n✔️ Bot zaten güncel."));
        }

        // 3. Main.js'yi başlat (YENİ ve ÖNEMLİ KISIM)
        console.log(theme.highlight("\n🚀 Ana uygulama başlatılıyor..."));
        const mainProcess = spawn('node', ['main.js'], {
            stdio: 'inherit',
            windowsHide: false,
            detached: false
        });

        mainProcess.on('close', (code) => {
            if (code !== 0) {
                console.log(theme.error(`Ana uygulama ${code} kodu ile kapandı`));
            }
            process.exit(code); // Terminalin kapanmaması için
        });

    } catch (error) {
        console.error(theme.error("\n❌ Kritik hata:", error.message));
        process.exit(1);
    }
}

// Doğrudan çalıştırma kontrolü
if (require.main === module) {
    checkUpdates();
} else {
    module.exports = checkUpdates;
}