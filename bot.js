console.log('import discord.io');
var DiscordAPI = require('discord.io');
console.log('import discordauth');
var auth = require('./discordauth.js');
console.log('import giphyauth');
var giphy = require('./giphyauth.js');

console.log('creating and connecting bot');
var bot = new DiscordAPI.Client({
   token: auth.token,
   autorun: true
});

console.log('setting up commands');
const commands = ['giphy', 'ping', 'help']
const execution = {
    giphy: CommandGiphy,
    ping: CommandPing,
    help: CommandHelp
}
const help = {
    giphy: "translate your words into a gif",
    help: "you're looking at it"
};

function CommandGiphy (user, userID, channelID, args) {
    let phrase = args[1];
    if (args.length > 2) {
        for (let i = 2; i < args.length; ++i)
            phrase += '+' + args[i];
    }
    giphy.translate('gifs', {"s": phrase})
        .then((response) => {
            bot.sendMessage({
                to: channelID,
                message: response.data.embed_url
            });
        })
        .catch((err) => {
            bot.sendMessage({
                to: channelID,
                message: 'Something went wrong with the giphy... thing...'
            });
        });
}

function CommandPing (user, userID, channelID, args) {
    bot.sendMessage({
        to: channelID,
        message: 'pong'
    });
}

function CommandHelp (user, userID, channelID, args) {
    bot.sendMessage({
        to: channelID,
        message: helpMessage
    });
}

function CommandDefault (user, userID, channelID, args) {
    bot.sendMessage({
        to: channelID,
        message: "'!" + args[0] + "' is not a command... yet?\nTry typing '!help' to see what's available."
    });
}

console.log('creating help message');
let longest = 0;
for (const entry of commands) {
    if (entry.length > longest)
        longest = entry.length;
}
var helpMessage = 'Here is a list of commands that I know:\n```';
for (const entry of commands) {
    helpMessage += '!' + entry + ': ';
    helpMessage = helpMessage.padEnd(helpMessage.length + longest - entry.length, ' ');
    const description = help[entry];
    if (description)
        helpMessage += description + '\n';
    else
        helpMessage += '...I dunno\n'
};
helpMessage += '```'

console.log('set up message callback');
bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
        const args = message.substring(1).split(' ');
        const command = args[0];
        let callback = execution[command];
        if (!callback)
            callback = CommandDefault;
        callback(user, userID, channelID, args);
    }
});