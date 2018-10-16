Alfred-Discord-Bot

Having finally convinced the crew to switch to Discord, Allie complained it didn't have Gifs. This project is a bot, originally intended to just link in the Gifs. Now I'm just messing around, having fun adding additional features.

Prerequisites:
    Node.js
    A Discord bot application
    A Giphy API key
    
Installing
    Have Node.js installed https://nodejs.org/en/, I used 8.12.0
    Run install.cmd
    Make a Discord bot https://discordapp.com/developers/applications/
    Replace "Insert Bot Token here" in auth.json with your bot's token
    Make a Giphy developer account and app https://developers.giphy.com/
    Replace "Insert Giphy API key here" in giphyauth.js with your giphy api key

Deployment
    Add the discord bot you made to a server by going to https://discordapp.com/oauth2/authorize?&client_id=CLIENTID&scope=bot&permissions=8 but replacing CLIENTID with your app's client id.
    Run bot.js on a server somewhere
    
Authors
    Trevor Bennett
    Daniel Jackson?