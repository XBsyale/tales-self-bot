const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const fetch = require("node-fetch");

const repoOwner = "XBsyale";
const repoName = "tales-self-bot";
const zipUrl = `https://github.com/${repoOwner}/${repoName}/archive/refs/heads/main.zip`;
const targetDir = path.join(__dirname, repoName);
const protectedFiles = ["tokens.txt"];

function log(msg) {
  console.log(`[Updater] ${msg}`);
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if ([".git", "node_modules"].includes(entry.name)) continue;
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

async function downloadZip(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP Hatası: ${response.status}`);

  const buffer = await response.buffer();
  fs.writeFileSync(outputPath, buffer);
}

async function updateProject() {
  const zipPath = path.join(__dirname, "temp.zip");

  try {
    log("ZIP indiriliyor...");
    await downloadZip(zipUrl, zipPath);

    log("ZIP indirildi. Açılıyor...");
    const zip = new AdmZip(zipPath);
    zip.extractAllTo("temp_extract", true);

    const extractedFolderName = `${repoName}-main`;
    const extractedPath = path.join(__dirname, "temp_extract", extractedFolderName);

    log("Dosyalar güncelleniyor (tokens.txt korunuyor)...");
    copyRecursive(extractedPath, targetDir);

    fs.rmSync(zipPath);
    fs.rmSync(path.join(__dirname, "temp_extract"), { recursive: true, force: true });

    log("✅ Güncelleme tamamlandı!");
  } catch (err) {
    console.error("❌ Hata oluştu:", err.message);
  }
}

updateProject();
