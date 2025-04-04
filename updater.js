const fs = require('fs');
const https = require('https');
const path = require('path');
const { execSync } = require('child_process');
const { theme } = require('./config');

const GITHUB_REPO = "XBsyale/tales-self-bot";
const TOKENS_FILE = "tokens.txt";
const CURRENT_COMMIT_FILE = "current_commit.txt";

async function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    https.get(url, (response) => {
      // GitHub yönlendirmesini takip et
      if (response.statusCode === 302) {
        https.get(response.headers.location, (res) => {
          res.pipe(file);
          file.on('finish', resolve);
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', resolve);
      }
    }).on('error', (err) => {
      fs.unlink(outputPath, () => reject(err));
    });
  });
}

async function extractZip(zipPath) {
  try {
    console.log(theme.info("📦 ZIP dosyası açılıyor (Node.js ile)..."));
    
    // ZIP'i geçici klasöre çıkar
    const tempDir = "temp_update";
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // ZIP'i çıkarmak için adm-zip kullan
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(tempDir, true);

    // Dosyaları ana dizine taşı
    const extractedDir = path.join(tempDir, `${GITHUB_REPO.split('/')[1]}-main`);
    fs.readdirSync(extractedDir).forEach(file => {
      const sourcePath = path.join(extractedDir, file);
      const destPath = path.join("./", file);
      
      // Eski dosyaları sil
      if (fs.existsSync(destPath)) {
        fs.rmSync(destPath, { recursive: true, force: true });
      }
      
      fs.renameSync(sourcePath, destPath);
    });

    // Temizlik
    fs.rmSync(tempDir, { recursive: true, force: true });
    fs.unlinkSync(zipPath);
    
    return true;
  } catch (error) {
    console.log(theme.error("❌ ZIP açma hatası:", error.message));
    return false;
  }
}

async function checkUpdates() {
  try {
    console.log(theme.info("\n🔍 Güncellemeler kontrol ediliyor..."));

    // Token'ları yedekle
    const tokensBackup = fs.existsSync(TOKENS_FILE) 
      ? fs.readFileSync(TOKENS_FILE, 'utf-8')
      : "";

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

      // ZIP'i indir
      await downloadFile(
        `https://github.com/${GITHUB_REPO}/archive/refs/heads/main.zip`,
        "update.zip"
      );

      // ZIP'i çıkar
      const success = await extractZip("update.zip");
      if (!success) throw new Error("ZIP extraction failed");

      // Token'ları geri yükle
      if (tokensBackup) {
        fs.writeFileSync(TOKENS_FILE, tokensBackup);
      }
      
      // Yeni commit hash'ini kaydet
      fs.writeFileSync(CURRENT_COMMIT_FILE, latestCommitHash);
      
      console.log(theme.success("\n✅ Güncelleme tamamlandı! Yeniden başlatılıyor..."));
      return true;
    } else {
      console.log(theme.success("\n✔️ Bot zaten güncel."));
      return false;
    }
  } catch (error) {
    console.log(theme.error("\n❌ Güncelleme hatası:", error.message));
    return false;
  }
}

module.exports = checkUpdates;