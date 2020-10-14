const files = require('./files');

console.log('verifying adventure content');
const adventureContent = files.path.join(files.content, 'adventure');

const commands = ['setname', 'check', 'help'];
const execution = {
    setname: CommandSetName,
    check: CommandCheck,
    help: CommandHelp
}
const help = {
    setname: "set your adventurer's name",
    check: "check in on your adventurer",
    help: "you're looking at it"
}
const getAdventurer = {
    setname: true,
    check: true,
    help: false
}

function GetContent (filename) {
    const contentPath = files.path.join(adventureContent, filename + '.json');
    try {
        return require(contentPath);
    }
    catch {
        console.log('Missing Content: ' + contentPath);
        return undefined;
    }
}

function GetAdventurerData (botData, channel, user) {
    const adventurer = {
        data: files.path.join(botData, channel.guild.name, 'adventure', user.tag + '.json')
    }
    files.ensureDir(adventurer.data);
    try {
        adventurer['object'] = require(adventurer.data);
        return adventurer;
    }
    catch {
        adventurer['object'] = GetContent('adventurer');
        if (adventurer.object) {
            adventurer.object['name'] = user.tag;
            files.fs.writeFileSync(adventurer.data, JSON.stringify(adventurer.object, null, 4), 'utf8');
        }
        return adventurer;
    }
}

const adventurerAttributes = ['name', 'hp', 'attack', 'defense', 'dexterity', 'mastery']
let adventurerLongest = 0;
for (const entry of adventurerAttributes) {
    if (entry.length > adventurerLongest)
        adventurerLongest = entry.length;
}
function PrintAdventurer(adventurer) {
    let adventurerMessage = "```"
    for(const entry of adventurerAttributes) {
        adventurerMessage += entry + ': ';
        adventurerMessage = adventurerMessage.padEnd(adventurerMessage.length + adventurerLongest - entry.length, ' ');
        adventurerMessage += adventurer.object[entry] + '\n';
    }
    adventurerMessage += "```";
    return adventurerMessage;
}

console.log('creating adventure help message');
let longest = 0;
for (const entry of commands) {
    if (entry.length > longest)
        longest = entry.length;
}
var helpMessage = 'Here is a list of adventure commands.\n```';
for (const entry of commands) {
    helpMessage += entry + ': ';
    helpMessage = helpMessage.padEnd(helpMessage.length + longest - entry.length, ' ');
    const description = help[entry];
    if (description)
        helpMessage += description + '\n';
    else
        helpMessage += '...I dunno\n'
};
helpMessage += '```'

function CommandSetName (args, adventurer) {
    const name = args[2];
    if (!name) {
        return "```usage: !adventure setname [new name]```";
    }
    
    adventurer.object.name = args[2];
    files.fs.writeFileSync(adventurer.data, JSON.stringify(adventurer.object, null, 4), 'utf8');

    let message = "You got it!\n"
    message += PrintAdventurer(adventurer);
    return message;    
}

function CommandHelp (args) {
    return helpMessage;
}

function CommandCheck (args, adventurer) {
    return PrintAdventurer(adventurer);
}

module.exports = function(botData, user, channel, args) {
    
    const adventuringChannel = files.getChannels(botData, channel.guild.name, channel.name, 'adventure');
    if (channel.name != adventuringChannel) {
        return "Please constrain your adventuring to '" + adventuringChannel + "'";
    }
       
    let adventurer;    
    let command = args[1];
    if (command) {
        command = command.toLowerCase();
    }
    else {
        command = 'check';
    }
    
    let callback = execution[command];
    if (!callback) {
        command = 'help';
        callback = CommandHelp;
    }
    
    if (getAdventurer[command]) {
        adventurer = GetAdventurerData(botData, channel, user);
        if (!adventurer.object) {
            return 'Error initializing adventurer';
        }
    }
    
    return callback(args, adventurer);
};
