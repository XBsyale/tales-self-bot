const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// === Ayarlar ===
const repoURL = "https://github.com/XBsyale/tales-self-bot.git";
const localFolder = "tales-self-bot"; // Klasör adı repo ile aynı

// === Log Fonksiyonu ===
function log(msg) {
  console.log(`[Updater] ${msg}`);
}

// === Klasörü Silme ===
function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.rmSync(folderPath, { recursive: true, force: true });
    log(`Eski klasör silindi: ${folderPath}`);
  }
}

// === Komut Çalıştırma ===
function runCommand(command, cwd = ".") {
  try {
    execSync(command, { cwd, stdio: "inherit" });
  } catch (err) {
    log(`Komut Hatası: ${err.message}`);
  }
}

// === Güncelleme ===
function updateProject() {
  const fullPath = path.join(__dirname, localFolder);

  if (fs.existsSync(fullPath)) {
    log("Proje zaten var. Klasör siliniyor...");
    deleteFolderRecursive(fullPath);
  }

  log("Proje GitHub'dan klonlanıyor...");
  runCommand(`git clone ${repoURL}`);
}

// === Başlat ===
updateProject();
