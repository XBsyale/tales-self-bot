const fs = require('fs');
const https = require('https');
const path = require('path');
const AdmZip = require('adm-zip'); // ZIP işlemleri için
const { theme } = require('./config');

const GITHUB_REPO = "XBsyale/tales-self-bot";
const CURRENT_COMMIT_FILE = "current_commit.txt";

async function downloadZip() {
  return new Promise((resolve, reject) => {
    const zipUrl = `https://github.com/${GITHUB_REPO}/archive/main.zip`;
    const zipPath = "update.zip";
    
    console.log(theme.info("\n⬇️ ZIP indiriliyor..."));
    const file = fs.createWriteStream(zipPath);
    
    https.get(zipUrl, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(zipPath, () => reject(err));
    });
  });
}

async function checkUpdates() {
  try {
    console.log(theme.info("\n🔍 Güncellemeler kontrol ediliyor..."));
    
    // GitHub API'den son commit hash'ini al
    const response = await new Promise((resolve, reject) => {
      https.get(`https://api.github.com/repos/${GITHUB_REPO}/commits/main`, {
        headers: { 'User-Agent': 'Node.js' }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    const latestCommitHash = response.sha;
    let currentCommitHash = fs.existsSync(CURRENT_COMMIT_FILE) 
      ? fs.readFileSync(CURRENT_COMMIT_FILE, 'utf-8').trim() 
      : "";

    if (latestCommitHash !== currentCommitHash) {
      console.log(theme.highlight("\n🔄 Yeni güncelleme bulundu!"));
      
      // ZIP indir
      await downloadZip();
      
      // ZIP'i aç
      console.log(theme.info("📦 ZIP açılıyor..."));
      const zip = new AdmZip("update.zip");
      zip.extractAllTo("./", true);
      
      // Temizlik
      fs.unlinkSync("update.zip");
      fs.writeFileSync(CURRENT_COMMIT_FILE, latestCommitHash);
      
      console.log(theme.success("\n✅ Güncelleme tamamlandı! Yeniden başlatılıyor..."));
      return true;
    } else {
      console.log(theme.success("\n✔️ Bot zaten güncel."));
      return false;
    }
  } catch (error) {
    console.log(theme.error("\n❌ Güncelleme hatası: " + error.message));
    return false;
  }
}

module.exports = checkUpdates;