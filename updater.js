const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawn } = require('child_process');
const AdmZip = require('adm-zip');

const GITHUB_REPO = "XBsyale/tales-self-bot";
const TOKENS_FILE = "tokens.txt";
const BACKUP_FILE = "tokens_backup.tmp";

async function protectedUpdate() {
    try {
        // 1. Token dosyasını yedekle
        if (fs.existsSync(TOKENS_FILE)) {
            fs.copyFileSync(TOKENS_FILE, BACKUP_FILE);
            console.log("🔒 Token dosyası yedeklendi");
        }

        // 2. Güncellemeyi indir
        console.log("⬇️ Güncelleme indiriliyor...");
        const zipPath = "update.zip";
        const file = fs.createWriteStream(zipPath);
        
        await new Promise((resolve, reject) => {
            https.get(`https://github.com/${GITHUB_REPO}/archive/main.zip`, (res) => {
                res.pipe(file);
                file.on('finish', resolve);
            }).on('error', reject);
        });

        // 3. ZIP'i aç
        console.log("📦 Dosyalar çıkarılıyor...");
        const zip = new AdmZip(zipPath);
        const extractDir = "temp_update";
        zip.extractAllTo(extractDir, true);

        // 4. Yeni dosyaları taşı (token dosyasını hariç tut)
        const sourceDir = path.join(extractDir, `${GITHUB_REPO.split('/')[1]}-main`);
        fs.readdirSync(sourceDir).forEach(file => {
            if (file !== path.basename(TOKENS_FILE)) {
                const sourcePath = path.join(sourceDir, file);
                const destPath = path.join(".", file);
                
                if (fs.existsSync(destPath)) {
                    fs.rmSync(destPath, { recursive: true, force: true });
                }
                fs.renameSync(sourcePath, destPath);
            }
        });

        // 5. Orijinal token dosyasını geri yükle
        if (fs.existsSync(BACKUP_FILE)) {
            fs.renameSync(BACKUP_FILE, TOKENS_FILE);
            console.log("🔒 Token dosyası geri yüklendi");
        }

        // 6. Temizlik
        fs.rmSync(extractDir, { recursive: true, force: true });
        fs.unlinkSync(zipPath);
        
        console.log("✅ Güncelleme tamamlandı (Token dosyası korundu)");
        return true;

    } catch (error) {
        console.error("❌ Güncelleme hatası:", error.message);
        
        // Hata durumunda token'ı geri yükle
        if (fs.existsSync(BACKUP_FILE)) {
            fs.renameSync(BACKUP_FILE, TOKENS_FILE);
            console.log("⚠️ Token dosyası geri yüklendi (hata durumunda)");
        }
        
        return false;
    }
}

// Ana güncelleme fonksiyonu
async function checkUpdates() {
    try {
        console.log("🔍 Güncellemeler kontrol ediliyor...");
        
        // Güncelleme kontrolü yap...
        
        if (/* güncelleme varsa */ true) {
            await protectedUpdate();
        }
        
        // Main.js'yi başlat
        console.log("🚀 Ana uygulama başlatılıyor...");
        const main = spawn('node', ['main.js'], { 
            stdio: 'inherit',
            shell: true
        });
        
        main.on('exit', (code) => {
            if (code !== 0) {
                console.log(`Ana uygulama kapatıldı (kod: ${code})`);
            }
        });

    } catch (error) {
        console.error("❌ Kritik hata:", error.message);
        process.exit(1);
    }
}

// Doğrudan çalıştırma
if (require.main === module) {
    checkUpdates();
}