const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const { https } = require("follow-redirects");
const { exec } = require("child_process");

const repoOwner = "XBsyale";
const repoName = "tales-self-bot";
const zipUrl = `https://github.com/${repoOwner}/${repoName}/archive/refs/heads/main.zip`;
const targetDir = __dirname;
const protectedFiles = ["tokens.txt"];

function log(msg) {
  console.log(`[Updater] ${msg}`);
}

function copyRecursive(src, dest) {
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
      if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      log(`Güncellendi: ${entry.name}`);
    }
  }
}

function downloadZip(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on("finish", () => file.close(resolve));
    }).on("error", reject);
  });
}

async function updateProject() {
  const zipPath = path.join(__dirname, "temp.zip");

  try {
    log("ZIP indiriliyor...");
    await downloadZip(zipUrl, zipPath);

    log("ZIP indirildi. Açılıyor...");
    const zip = new AdmZip(zipPath);
    zip.extractAllTo("temp_extract", true);

    const extractedPath = path.join(__dirname, "temp_extract", `${repoName}-main`);

    log("Dosyalar güncelleniyor (tokens.txt korunuyor)...");
    copyRecursive(extractedPath, targetDir);

    // Silme işlemi sırasında force: true kullanılarak zorla silme
    fs.rmSync(zipPath, { force: true });
    fs.rmSync(path.join(__dirname, "temp_extract"), { recursive: true, force: true });

    log("✅ Güncelleme tamamlandı!");

    // Yeni terminal penceresinde main.js'i çalıştırma
    exec("start cmd /K node main.js", (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
    });

    // 2 saniye sonra, ilk terminali kapatma komutu
    setTimeout(() => {
      exec("exit");
    }, 2000);  // 2 saniye bekleyip, terminali kapat

  } catch (err) {
    console.error("❌ Hata oluştu:", err.message);
  }
}

updateProject();
