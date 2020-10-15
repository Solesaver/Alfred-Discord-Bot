const files = require('./files');

console.log('verifying adventure content');
const adventureContent = files.path.join(files.content, 'adventure');

const commands = ['setname', 'check', 'trouble', 'help'];
const execution = {
    setname: CommandSetName,
    check: CommandCheck,
    trouble: CommandTrouble,
    help: CommandHelp
}
const help = {
    setname: "set your adventurer's name",
    check: "check in on your adventurer",
    trouble: "look for trouble",
    help: "you're looking at it"
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
    }
    catch {
        adventurer['object'] = GetContent('adventurer');
        if (adventurer.object) {
            adventurer.object['name'] = user.tag;
            files.fs.writeFileSync(adventurer.data, JSON.stringify(adventurer.object, null, 4), 'utf8');
        }
    }
    return adventurer
}

function GetDungeonData (botData, channel, looking) {
    const dungeon = {
        data: files.path.join(botData, channel.guild.name, 'adventure', 'dungeon.json')
    };
    files.ensureDir(dungeon.data);
    try {
        dungeon['object'] = require(dungeon.data);
    }
    catch {
        if (looking) {
            dungeon['object'] = GetContent('cellar');
            if (dungeon.object) {
                dungeon.object.next = 0;
                files.fs.writeFileSync(dungeon.data, JSON.stringify(dungeon.object, null, 4), 'utf8');
            }
        }
    }
    return dungeon;
}

function GetMonsterData (botData, channel, looking) {
    const monster = {
        data: files.path.join(botData, channel.guild.name, 'adventure', 'monster.json')
    };
    files.ensureDir(monster.data);
    
    const dungeon = GetDungeonData(botData, channel, looking);
    
    try {
        monster['object'] = require(monster.data);
    }
    catch {
        if (looking && dungeon.object) {
            const next = dungeon.object.next;
            monster['object'] = GetContent(dungeon.object.monsters[next]);
            if (monster.object) {
                files.fs.writeFileSync(monster.data, JSON.stringify(monster.object, null, 4), 'utf8');
            }
        }
    }
    return {dungeon: dungeon, monster: monster};
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

function CommandSetName (botData, user, channel, args) {
    const name = args[2];
    if (!name) {
        return "```usage: !adventure setname [new name]```";
    }
    
    adventurer = GetAdventurerData(botData, channel, user);
    if (!adventurer.object) {
        return 'Error initializing adventurer';
    }
    
    adventurer.object.name = args[2];
    files.fs.writeFileSync(adventurer.data, JSON.stringify(adventurer.object, null, 4), 'utf8');

    let message = "You got it!\n"
    message += PrintAdventurer(adventurer);
    return message;
}

function CommandHelp () {
    return helpMessage;
}

function CommandCheck (botData, user, channel) {
    adventurer = GetAdventurerData(botData, channel, user);
    if (!adventurer.object)
        return 'Error initializing adventurer';
    let message = PrintAdventurer(adventurer);
    
    trouble = GetMonsterData(botData, channel, false);
    const dungeon = trouble.dungeon.object;
    const monster = trouble.monster.object;
    if (dungeon || monster) {
        message += '\n';
        if (dungeon) {
            message += "You're looking around " + dungeon.name + ".\n"
        }
        if (monster) {
            message += "You see " + monster.name + ".\n"
        }
    }
    return message;
}

function CommandTrouble (botData, user, channel) {
    const trouble = GetMonsterData(botData, channel, true);
    if (!trouble.dungeon.object)
        return 'Error initializing dungeon';
    else if (!trouble.monster.object)
        return 'Error initializing monster';
        
    let message = "You go looking for trouble in " + trouble.dungeon.object.name + '\n';
    message += "You find " + trouble.monster.object.name + "!\n";
    //message += PrintMonster(trouble.monster.object);
    return message;
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
    
    const message = callback(botData, user, channel, args);
    return message;
};
