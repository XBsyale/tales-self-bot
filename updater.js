const fs = require('fs');
const https = require('https');
const { theme } = require('./config');

const GITHUB_REPO = "XBsyale/tales-self-bot";
const CURRENT_COMMIT_FILE = "current_commit.txt";

module.exports = async function checkUpdates() {
    try {
        console.log(theme.info("\n🔍 Güncellemeler kontrol ediliyor..."));

        // GitHub'dan son commit bilgisini al
        const latestCommit = await new Promise((resolve, reject) => {
            https.get(`https://api.github.com/repos/${GITHUB_REPO}/commits/main`, {
                headers: { 'User-Agent': 'Node.js' }
            }, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(e);
                    }
                });
            }).on('error', reject);
        });

        const latestCommitHash = latestCommit.sha;
        const currentCommitHash = fs.existsSync(CURRENT_COMMIT_FILE)
            ? fs.readFileSync(CURRENT_COMMIT_FILE, 'utf-8').trim()
            : "";

        if (latestCommitHash !== currentCommitHash) {
            console.log(theme.highlight("\n🔄 Yeni güncelleme bulundu!"));
            
            // Burada güncelleme işlemleriniz olacak
            // Örnek: ZIP indirme ve çıkarma
            
            console.log(theme.success("\n✅ Güncelleme tamamlandı!"));
            return true;
        } else {
            console.log(theme.success("\n✔️ Bot zaten güncel."));
            return false;
        }
    } catch (error) {
        console.log(theme.error("\n❌ Güncelleme hatası:", error.message));
        return false;
    }
};