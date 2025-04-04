const { constants } = require('../config');

async function waitForResponse(channel, sentMessage, timeout = 10000) {
    return new Promise((resolve) => {
        const collector = channel.createMessageCollector({
            filter: m => m.author.id === constants.OWO_BOT_ID && 
                        m.createdTimestamp > sentMessage.createdTimestamp,
            time: timeout,
            max: 1
        });

        collector.on('collect', resolve);
        collector.on('end', collected => {
            if (collected.size === 0) resolve(null);
        });
    });
}

async function clickFirstButton(message) {
    try {
        if (!message.components?.length) {
            return false;
        }

        const firstButton = message.components[0]?.components[0];
        if (!firstButton || firstButton.type !== 'BUTTON') {
            return false;
        }

        await message.clickButton(firstButton.customId || firstButton.emoji?.name);
        return true;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    waitForResponse,
    clickFirstButton
};