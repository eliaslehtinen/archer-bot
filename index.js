// Main file for the Discord bot

// Import dependencies
const Discord = require('discord.js');
const { prefix } = require('./config.json');
const ytdl = require('ytdl-core');
const token = process.env.ARCHERBOT_TOKEN;

// Create client and log in
const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
    ],
});
client.login(token);

// Add listeners
client.once('ready', () => {
    console.log('Ready!');
})
client.once('reconnecting', () => {
    console.log('Reconnecting!');
})
client.once('disconnect', () => {
    console.log('Disconnect!');
})

// Listen for new messages
client.on('message', async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const serverQueue = queue.get(message.guild.id);

    if (message.content.startsWith('${prefix}play')) {
        execute(message, serverQueue);
        return;
    } else if (message.content.startsWith('${prefix}skip')) {
        skip(message, serverQueue);
        return;
    } else if (message.content.startsWith('${prefix}stop')) {
        stop(message, serverQueue);
        return;
    } else {
        message.channel.send('You need to enter a valid command!\n'+
        'Available commands are !play, !skip and !stop.')
    }
})