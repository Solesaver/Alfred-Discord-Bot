console.log('import path');
const path = require('path');
console.log('import fs');
const fs = require('fs');

console.log('building file paths');
const content = path.join(__dirname, 'content');
const data = path.join(__dirname, 'data');

function ensureDir (filepath) {
    const dirname = path.dirname(filepath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureDir(dirname);
    fs.mkdirSync(dirname);
}

function getChannels(botData, server, channel, command) {
    const filepath = path.join(botData, server, 'channels.json');
    ensureDir(filepath);
    
    let channelsObj = {};
    try {
	channelsObj = require(filepath);
	if (channelsObj[command])
	    return channelsObj[command];
    }
    catch{}
    channelsObj[command] = channel;
    fs.writeFileSync(filepath, JSON.stringify(channelsObj, null, 4), 'utf8');
    return channel;
}

module.exports = {
	path: path,
	fs: fs,
	content: content,
	data: data,
	ensureDir: ensureDir,
	getChannels: getChannels
}
