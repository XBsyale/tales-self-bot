const chalk = require('chalk');

module.exports = {
    theme: {
        title: chalk.hex('#5865F2').bold,
        menu: chalk.hex('#57F287'),
        input: chalk.hex('#FEE75C'),
        success: chalk.hex('#57F287'),
        error: chalk.hex('#ED4245'),
        info: chalk.hex('#3498DB'),
        highlight: chalk.hex('#EB459E'),
        money: chalk.hex('#F8C300')
    },
    paths: {
        logFile: 'logs/received_messages.log',
        moneyLogFile: 'logs/money_status.log',
        tokensFile: 'tokens.txt',
        dmReceiversFile: 'logs/dm_receivers.log',
        errorFile: 'error.log'
    },
    constants: {
        MAX_TRANSFER_PER_ACCOUNT: 5000000,
        OWO_BOT_ID: '408785106942164992'
    }
};