const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// === Ayarlar ===
const repoURL = "https://github.com/XBsyale/tales-self-bot.git";
const localFolder = "tales-self-bot"; // Klasör adı repo ismiyle aynı

// === Log Fonksiyonu ===
function log(message) {
  console.log(`[Updater] ${message}`);
}

// === Komut Çalıştırma Fonksiyonu ===
function runCommand(command, cwd = ".") {
  try {
    execSync(command, { cwd, stdio: "inherit" });
  } catch (err) {
    log(`Hata: ${err.message}`);
  }
}

// === Güncelleme Fonksiyonu ===
function updateProject() {
  const projectPath = path.join(__dirname, localFolder);

  if (!fs.existsSync(projectPath)) {
    log("Proje bulunamadı. GitHub'dan klonlanıyor...");
    runCommand(`git clone ${repoURL}`);
  } else {
    log("Proje bulundu. Güncelleniyor (git pull)...");
    runCommand(`git pull`, projectPath);
  }
}

// === Başlat ===
updateProject();
