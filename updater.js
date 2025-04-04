const https = require("https");
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip"); // npm install adm-zip

const repoOwner = "XBsyale";
const repoName = "tales-self-bot";
const zipUrl = `https://github.com/${repoOwner}/${repoName}/archive/refs/heads/main.zip`;
const targetDir = path.join(__dirname, repoName);
const protectedFiles = ["tokens.txt"]; // Korunacak dosyalar

function log(msg) {
  console.log(`[Updater] ${msg}`);
}

// === Dosya ve klasörleri kopyala (korunanlar hariç) ===
function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // Atlanacak klasörler
    if ([".git", "node_modules"].includes(entry.name)) continue;

    // Korunacak dosyalar
    if (protectedFiles.includes(entry.name)) {
      log(`Korunuyor: ${entry.name}`);
      continue;
    }

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      log(`Güncellendi: ${entry.name}`);
    }
  }
}

// === ZIP indir ===
function downloadZip(url, outputPath, callback) {
  const file = fs.createWriteStream(outputPath);
  https.get(url, (response) => {
    response.pipe(file);
    file.on("finish", () => {
      file.close(callback);
    });
  });
}

// === Başla ===
function updateProject() {
  const zipPath = path.join(__dirname, "temp.zip");

  log("ZIP indiriliyor...");
  downloadZip(zipUrl, zipPath, () => {
    log("ZIP indirildi. Açılıyor...");

    const zip = new AdmZip(zipPath);
    zip.extractAllTo("temp_extract", true);

    const extractedFolderName = `${repoName}-main`;
    const extractedPath = path.join(__dirname, "temp_extract", extractedFolderName);

    log("Dosyalar güncelleniyor (tokens.txt korunuyor)...");
    copyRecursive(extractedPath, targetDir);

    // Temizleme
    fs.rmSync(zipPath);
    fs.rmSync(path.join(__dirname, "temp_extract"), { recursive: true, force: true });

    log("✅ Güncelleme tamamlandı!");
  });
}

updateProject();
