const fs = require('fs');
const { paths } = require('../config');

function ensureLogsDirectory() {
    if (!fs.existsSync('logs')) fs.mkdirSync('logs');
}

function writeLog(message, type = 'info') {
    const timestamp = new Date().toLocaleString();
    const logEntry = `[${timestamp}] ${message}\n`;
    ensureLogsDirectory();
    
    if (type === 'success') {
        fs.appendFileSync(paths.logFile, logEntry, 'utf-8');
    }
}

function writeMoneyLog(message) {
    const timestamp = new Date().toLocaleString();
    const logEntry = `[${timestamp}] ${message}\n`;
    ensureLogsDirectory();
    fs.appendFileSync(paths.moneyLogFile, logEntry, 'utf-8');
}

function writeDmLog(message) {
    ensureLogsDirectory();
    fs.appendFileSync(paths.dmReceiversFile, `${message}\n`, 'utf-8');
}

function writeErrorLog(error) {
    const timestamp = new Date().toLocaleString();
    const logEntry = `[${timestamp}] ${error}\n`;
    ensureLogsDirectory();
    fs.appendFileSync(paths.errorFile, logEntry, 'utf-8');
}

module.exports = {
    writeLog,
    writeMoneyLog,
    writeDmLog,
    writeErrorLog
};