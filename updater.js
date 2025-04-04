const fs = require('fs');
const https = require('https');
const { spawn } = require('child_process');
const { theme } = require('./config');
const AdmZip = require('adm-zip');

const GITHUB_REPO = "XBsyale/tales-self-bot";
const CURRENT_COMMIT_FILE = "current_commit.txt";

async function downloadUpdate() {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream("update.zip");
        console.log(theme.info("\n⬇️ GitHub'dan güncelleme indiriliyor..."));
        
        https.get(`https://github.com/${GITHUB_REPO}/archive/refs/heads/main.zip`, (response) => {
            // GitHub'ın yönlendirmesini takip et
            if (response.statusCode === 302 || response.statusCode === 301) {
                https.get(response.headers.location, (res) => {
                    res.pipe(file);
                    file.on('finish', resolve);
                }).on('error', reject);
            } else {
                response.pipe(file);
                file.on('finish', resolve);
            }
        }).on('error', (err) => {
            fs.unlink("update.zip", () => reject(err));
        });
    });
}

async function extractUpdate() {
    try {
        console.log(theme.info("📦 ZIP dosyası açılıyor (adm-zip ile)..."));
        
        const zip = new AdmZip("update.zip");
        
        // Önce tüm dosyaları geçici klasöre çıkar
        const tempDir = "temp_update";
        zip.extractAllTo(tempDir, true);
        
        // Dosyaları ana dizine taşı
        const extractedDir = `${GITHUB_REPO.split('/')[1]}-main`;
        fs.readdirSync(path.join(tempDir, extractedDir)).forEach(file => {
            fs.renameSync(
                path.join(tempDir, extractedDir, file),
                path.join("./", file),
                { overwrite: true }
            );
        });
        
        // Temizlik
        fs.rmSync(tempDir, { recursive: true, force: true });
        fs.unlinkSync("update.zip");
        
        return true;
    } catch (error) {
        console.error(theme.error("❌ ZIP açma hatası:", error));
        return false;
    }
}

async function checkUpdates() {
    try {
        console.log(theme.info("\n🔍 Güncellemeler kontrol ediliyor..."));

        // 1. GitHub'dan son commit bilgisini al
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

        // 2. Güncelleme varsa işlemleri yap
        if (latestCommitHash !== currentCommitHash) {
            console.log(theme.highlight("\n🔄 Yeni güncelleme bulundu!"));
            
            await downloadUpdate();
            const success = await extractUpdate();
            
            if (success) {
                fs.writeFileSync(CURRENT_COMMIT_FILE, latestCommitHash);
                console.log(theme.success("\n✅ Güncelleme tamamlandı!"));
            } else {
                throw new Error("ZIP işlemi başarısız");
            }
        } else {
            console.log(theme.success("\n✔️ Bot zaten güncel."));
        }

        // 3. Main.js'yi başlat
        console.log(theme.highlight("\n🚀 Ana uygulama başlatılıyor..."));
        const mainProcess = spawn('node', ['main.js'], {
            stdio: 'inherit',
            shell: true,
            windowsHide: false
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

// Doğrudan çalıştırma
if (require.main === module) {
    checkUpdates();
} else {
    module.exports = checkUpdates;
}