const { execSync } = require('child_process');
const fs = require('fs');
const axios = require('axios');

const GITHUB_REPO = "XBsyale/tales-self-bot";
const TOKENS_FILE = "tokens.txt";

function readTokensFile() {
  try {
    return fs.readFileSync(TOKENS_FILE, 'utf-8');
  } catch {
    return "";
  }
}

function writeTokensFile(content) {
  fs.writeFileSync(TOKENS_FILE, content, 'utf-8');
}

function getLocalCommitHash() {
  try {
    return execSync('git rev-parse HEAD').toString().trim();
  } catch {
    return "";
  }
}

function stashChanges() {
  try {
    const changes = execSync('git status --porcelain').toString();
    if (changes.trim()) {
      console.log("📦 Uncommitted changes found. Stashing...");
      execSync('git stash');
    }
  } catch (err) {
    console.warn("⚠️ Failed to stash changes:", err.message);
  }
}

function cleanUntrackedFiles() {
  try {
    const untracked = execSync('git ls-files --others --exclude-standard').toString();
    if (untracked.trim()) {
      console.log("🧹 Untracked files found. Cleaning...");
      execSync('git clean -f -d');
    }
  } catch (err) {
    console.warn("⚠️ Failed to clean untracked files:", err.message);
  }
}

async function checkUpdates() {
  try {
    console.log("🔍 Checking for updates...");

    const { data: latestCommit } = await axios.get(
      `https://api.github.com/repos/${GITHUB_REPO}/commits/main`
    );
    const latestRemoteHash = latestCommit.sha;
    const localHash = getLocalCommitHash();

    if (latestRemoteHash !== localHash) {
      console.log("🔄 New update found. Preparing to update...");

      const tokensBackup = readTokensFile();

      stashChanges();
      cleanUntrackedFiles();

      try {
        console.log("⬇️ Pulling latest changes via git...");
        execSync('git checkout main');
        execSync('git pull origin main');
      } catch (gitError) {
        console.warn("⚠️ Git pull failed. Falling back to ZIP download...");
        execSync(`curl -L https://github.com/${GITHUB_REPO}/archive/main.zip -o update.zip`);
        execSync('unzip -o update.zip -d .');
      }

      writeTokensFile(tokensBackup);

      console.log("✅ Update complete. Restarting...");
      process.exit(1);
    } else {
      console.log("✔️ Bot is already up to date.");
    }
  } catch (error) {
    console.error("❌ Update process failed:", error.message);
  }
}

module.exports = checkUpdates;