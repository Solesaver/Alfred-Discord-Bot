console.log('import discord.js');
const DiscordAPI = require('discord.js');
console.log('import discordauth');
const auth = require('./discordauth');
console.log('import giphyauth');
const giphy = require('./giphyauth');

const files = require('./files.js');



console.log('creating and connecting bot');
var bot = new DiscordAPI.Client();

let botData = files.data;
bot.on('ready', () => {
    console.log('Logged in as ' + bot.user.tag + '!');
    botData = files.path.join(files.data, bot.user.tag);
});

bot.login(auth.token);

console.log('setting up commands');
const commands = ['giphy', 'ping', 'howmany', 'adventure', 'help']
const execution = {
    giphy: CommandGiphy,
    ping: CommandPing,
    howmany: CommandHowMany,
    adventure: CommandAdventure,
    help: CommandHelp
}
const help = {
    giphy: "translate your words into a gif",
    ping: "pong",
    howmany: "I'll tell you how many times I've been asked that",
    adventure: "go on an adventure",
    help: "you're looking at it"
};

function CommandGiphy (user, channel, args) {
    let phrase = args[1];
    if (args.length > 2) {
        for (let i = 2; i < args.length; ++i)
            phrase += '+' + args[i];
    }
    giphy.translate({s: phrase, rating: 'pg'})
        .then((response) => {
            if (response.meta.msg === "OK") {
                channel.send(response.data.embed_url);
            }
        })
        .catch((err) => {
            channel.send('Something went wrong with the giphy... thing...');
        });
}

function CommandPing (user, channel, args) {
    channel.send('pong');
}

function CommandHowMany (user, channel, args) {
    const howmanyPath = files.path.join(botData, channel.guild.name, 'howmany.json');
    files.ensureDir(howmanyPath);
    
    let howmanyObj;
    try {
        howmanyObj = require(howmanyPath);
    }
    catch{
        howmanyObj = {};
    }
    
    let count = howmanyObj['total'];
    let yourCount = howmanyObj[user.tag];
    let countMessage = '';
    if (!count) {
        count = 1;
        countMessage +=  "You're the first person to ask me that.";
    }
    else if (count == 1) {
        countMessage += "I've only been asked that " + count + " other time.";
        ++count;
    }
    else if (count < 10) {
        countMessage += "I've only been asked that " + count + " other times.";
        ++count;
    }
    else {
        countMessage += "I've been asked that " + count + " times already.";
        ++count;
    }
    howmanyObj['total'] = count;
    if (!yourCount) {
        yourCount = 1;
        countMessage += " This is the first time you've asked."
    }
    else if (yourCount == 1) {
        countMessage += " You've asked once before."
        ++yourCount;
    }
    else if (yourCount < 10) {
        countMessage += " You've only asked " + yourCount + " times before."
        ++yourCount;
    }
    else {
        countMessage += " You've already asked me that " + yourCount + " other times."
        ++yourCount;
    }
    howmanyObj[user.tag] = yourCount;
    channel.send(countMessage);
    
    files.fs.writeFileSync(howmanyPath, JSON.stringify(howmanyObj, null, 4), 'utf8');
}
function CommandAdventure (user, channel, args) {
    const adventure = require('./adventure');
    channel.send(adventure(botData, user, channel, args));
}

function CommandHelp (user, channel, args) {
    channel.send(helpMessage);
}

function CommandDefault (user, channel, args) {
    channel.send("'!" + args[0] + "' is not a command... yet?\nTry typing '!help' to see what's available.");
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
bot.on('message', msg => {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    var message = msg.content;
    if (message.substring(0, 1) == '!') {
        const args = message.substring(1).split(' ');
        let command = args[0];
        command = command.toLowerCase();
        let callback = execution[command];
        if (!callback)
            callback = CommandDefault;
        callback(msg.author, msg.channel, args);
    }
    else if (msg.mentions.has(bot.user)) {
        msg.channel.send("Hey " + msg.author.username + "!\nTry the '!help' command to see what I'm capable of!");
    }
});
